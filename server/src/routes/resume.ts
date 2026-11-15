import { Hono, type Context } from 'hono'
import { z } from 'zod'
import { db } from '../db/index.js'
import {
  profile,
  resumeWork,
  resumeEducation,
  resumeSkills,
  resumeProjects,
} from '../db/schema.js'
import { eq, asc } from 'drizzle-orm'
import type { Lang } from '../../../shared/types/common.js'

function parseLocale(raw: string | undefined): Lang {
  return raw === 'id' ? 'id' : 'en'
}

function parseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function typeLabel(type: string): string {
  return type === 'work' ? 'work' : 'side project'
}

function buildResumeResponse(locale: Lang) {
  const prof = db.select().from(profile).where(eq(profile.locale, locale)).get()
  const work = db
    .select()
    .from(resumeWork)
    .where(eq(resumeWork.locale, locale))
    .orderBy(asc(resumeWork.sortOrder))
    .all()
  const education = db
    .select()
    .from(resumeEducation)
    .where(eq(resumeEducation.locale, locale))
    .orderBy(asc(resumeEducation.sortOrder))
    .all()
  const skills = db
    .select()
    .from(resumeSkills)
    .orderBy(asc(resumeSkills.sortOrder))
    .all()
  const projects = db
    .select()
    .from(resumeProjects)
    .where(eq(resumeProjects.locale, locale))
    .orderBy(asc(resumeProjects.sortOrder))
    .all()

  return {
    profile: prof
      ? {
          name: prof.name,
          initials: prof.initials,
          location: prof.location,
          locationLink: prof.locationLink,
          currentJob: prof.currentJob,
          description: prof.description,
          about: prof.about,
          summary: prof.summary,
          avatarUrl: prof.avatarUrl,
          personalWebsiteUrl: prof.personalWebsiteUrl,
          email: prof.email,
          tel: prof.tel,
          social: parseJson<{ name: string; url: string }[]>(prof.social, []),
        }
      : null,
    work: work.map((w) => ({
      id: w.id,
      company: w.company,
      link: w.link,
      badge: w.badge,
      title: w.title,
      start: w.start,
      end: w.end,
      description: w.description,
    })),
    education: education.map((e) => ({
      id: e.id,
      school: e.school,
      degree: e.degree,
      start: e.start,
      end: e.end,
      desc: e.desc,
    })),
    skills: skills.map((s) => s.name),
    projects: projects.map((p) => ({
      id: p.id,
      title: p.title,
      type: p.type,
      company: p.company ?? undefined,
      techStack: [typeLabel(p.type), ...parseJson<string[]>(p.techStack, [])],
      description: p.description,
      link:
        p.linkLabel && p.linkHref
          ? { label: p.linkLabel, href: p.linkHref }
          : undefined,
      img: p.img,
      isFeatured: p.isFeatured === 1,
    })),
  }
}

// Public router

export const resumePublic = new Hono()

resumePublic.get('/', (c) => {
  const locale = parseLocale(c.req.query('locale'))
  return c.json(buildResumeResponse(locale))
})

// Request bodies. Keys a schema does not name (id included) are dropped, so a
// body can only write the columns listed here.

const localeField = z.enum(['en', 'id'])
const requiredText = z.string().trim().min(1)
const sortOrder = z.number().int()

/** Social links are a JSON array kept as text; an empty field means no links. */
const socialJson = z.string().transform((raw, ctx) => {
  const value = raw.trim() ? parseJson<unknown>(raw, undefined) : []
  const links = z
    .array(z.object({ name: z.string(), url: z.string() }).passthrough())
    .safeParse(value)
  if (!links.success) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Must be a JSON array of { name, url }',
    })
    return z.NEVER
  }
  return JSON.stringify(value)
})

/** Tech stack is stored as a JSON array; a plain "Go, React" list is accepted too. */
const techStackJson = z.string().transform((raw) => {
  const value = parseJson<unknown>(raw, undefined)
  const list =
    Array.isArray(value) && value.every((v) => typeof v === 'string')
      ? value
      : raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
  return JSON.stringify(list)
})

const profileSchema = z
  .object({
    name: z.string(),
    initials: z.string(),
    location: z.string(),
    locationLink: z.string(),
    currentJob: z.string(),
    description: z.string(),
    about: z.string(),
    summary: z.string(),
    avatarUrl: z.string(),
    personalWebsiteUrl: z.string(),
    email: z.string(),
    tel: z.string(),
    social: socialJson,
  })
  .partial()

const workSchema = z.object({
  locale: localeField,
  company: requiredText,
  link: z.string().optional(),
  badge: z.string().optional(),
  title: z.string(),
  start: z.string(),
  end: z.string(),
  description: z.string().optional(),
  sortOrder: sortOrder.optional(),
})

const educationSchema = z.object({
  locale: localeField,
  school: requiredText,
  degree: z.string(),
  start: z.string(),
  end: z.string(),
  desc: z.string().optional(),
  sortOrder: sortOrder.optional(),
})

const skillSchema = z.object({
  name: requiredText,
  sortOrder: sortOrder.optional(),
})

const projectSchema = z.object({
  locale: localeField,
  title: requiredText,
  type: z.enum(['side_project', 'work']),
  company: z.string().nullable().optional(),
  techStack: techStackJson.optional(),
  description: z.string().optional(),
  linkLabel: z.string().nullable().optional(),
  linkHref: z.string().nullable().optional(),
  img: z.string().optional(),
  isFeatured: z.number().int().min(0).max(1).optional(),
  sortOrder: sortOrder.optional(),
})

/** The request body checked against a schema, or the error response to send back. */
async function readBody<T extends z.ZodTypeAny>(
  c: Context,
  schema: T,
): Promise<{ data: z.output<T> } | { error: Response }> {
  const body = await c.req.json().catch(() => null)
  if (body === null) return { error: c.json({ error: 'Malformed JSON' }, 400) }
  const parsed = schema.safeParse(body)
  if (!parsed.success)
    return {
      error: c.json(
        {
          error: 'Validation failed',
          issues: parsed.error.issues.map((i) => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        422,
      ),
    }
  return { data: parsed.data }
}

/** Same, for an update: every field optional, but at least one present. */
async function readPatch<T extends z.AnyZodObject>(c: Context, schema: T) {
  const body = await readBody(c, schema.partial())
  if ('data' in body && Object.keys(body.data).length === 0)
    return { error: c.json({ error: 'Nothing to update' }, 422) }
  return body
}

// Admin router

export const resumeAdmin = new Hono()

// Profile
resumeAdmin.get('/profile', (c) => {
  const locale = parseLocale(c.req.query('locale'))
  const row = db.select().from(profile).where(eq(profile.locale, locale)).get()
  return c.json(row ?? null)
})

resumeAdmin.patch('/profile', async (c) => {
  const locale = parseLocale(c.req.query('locale'))
  const body = await readPatch(c, profileSchema)
  if ('error' in body) return body.error
  const row = db
    .insert(profile)
    .values({ locale, name: '', ...body.data })
    .onConflictDoUpdate({ target: profile.locale, set: body.data })
    .returning()
    .get()
  return c.json(row)
})

// Work
resumeAdmin.get('/work', (c) => {
  const locale = parseLocale(c.req.query('locale'))
  const rows = db
    .select()
    .from(resumeWork)
    .where(eq(resumeWork.locale, locale))
    .orderBy(asc(resumeWork.sortOrder))
    .all()
  return c.json(rows)
})

resumeAdmin.post('/work', async (c) => {
  const body = await readBody(c, workSchema)
  if ('error' in body) return body.error
  const row = db.insert(resumeWork).values(body.data).returning().get()
  return c.json(row, 201)
})

resumeAdmin.patch('/work/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await readPatch(c, workSchema)
  if ('error' in body) return body.error
  const row = db
    .update(resumeWork)
    .set(body.data)
    .where(eq(resumeWork.id, id))
    .returning()
    .get()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

resumeAdmin.delete('/work/:id', (c) => {
  const id = Number(c.req.param('id'))
  const existing = db
    .select()
    .from(resumeWork)
    .where(eq(resumeWork.id, id))
    .get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(resumeWork).where(eq(resumeWork.id, id)).run()
  return c.json({ ok: true })
})

resumeAdmin.post('/work/copy', (c) => {
  const from = parseLocale(c.req.query('from'))
  const to = parseLocale(c.req.query('to'))
  const source = db
    .select()
    .from(resumeWork)
    .where(eq(resumeWork.locale, from))
    .orderBy(asc(resumeWork.sortOrder))
    .all()
  db.delete(resumeWork).where(eq(resumeWork.locale, to)).run()
  if (source.length > 0) {
    db.insert(resumeWork)
      .values(source.map(({ id: _id, ...row }) => ({ ...row, locale: to })))
      .run()
  }
  const result = db
    .select()
    .from(resumeWork)
    .where(eq(resumeWork.locale, to))
    .orderBy(asc(resumeWork.sortOrder))
    .all()
  return c.json(result)
})

// Education
resumeAdmin.get('/education', (c) => {
  const locale = parseLocale(c.req.query('locale'))
  const rows = db
    .select()
    .from(resumeEducation)
    .where(eq(resumeEducation.locale, locale))
    .orderBy(asc(resumeEducation.sortOrder))
    .all()
  return c.json(rows)
})

resumeAdmin.post('/education', async (c) => {
  const body = await readBody(c, educationSchema)
  if ('error' in body) return body.error
  const row = db.insert(resumeEducation).values(body.data).returning().get()
  return c.json(row, 201)
})

resumeAdmin.patch('/education/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await readPatch(c, educationSchema)
  if ('error' in body) return body.error
  const row = db
    .update(resumeEducation)
    .set(body.data)
    .where(eq(resumeEducation.id, id))
    .returning()
    .get()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

resumeAdmin.delete('/education/:id', (c) => {
  const id = Number(c.req.param('id'))
  const existing = db
    .select()
    .from(resumeEducation)
    .where(eq(resumeEducation.id, id))
    .get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(resumeEducation).where(eq(resumeEducation.id, id)).run()
  return c.json({ ok: true })
})

resumeAdmin.post('/education/copy', (c) => {
  const from = parseLocale(c.req.query('from'))
  const to = parseLocale(c.req.query('to'))
  const source = db
    .select()
    .from(resumeEducation)
    .where(eq(resumeEducation.locale, from))
    .orderBy(asc(resumeEducation.sortOrder))
    .all()
  db.delete(resumeEducation).where(eq(resumeEducation.locale, to)).run()
  if (source.length > 0) {
    db.insert(resumeEducation)
      .values(source.map(({ id: _id, ...row }) => ({ ...row, locale: to })))
      .run()
  }
  const result = db
    .select()
    .from(resumeEducation)
    .where(eq(resumeEducation.locale, to))
    .orderBy(asc(resumeEducation.sortOrder))
    .all()
  return c.json(result)
})

// Skills
resumeAdmin.get('/skills', (c) => {
  const rows = db
    .select()
    .from(resumeSkills)
    .orderBy(asc(resumeSkills.sortOrder))
    .all()
  return c.json(rows)
})

resumeAdmin.post('/skills', async (c) => {
  const body = await readBody(c, skillSchema)
  if ('error' in body) return body.error
  const taken = db
    .select()
    .from(resumeSkills)
    .where(eq(resumeSkills.name, body.data.name))
    .get()
  if (taken) return c.json({ error: 'Skill already exists' }, 409)
  const row = db.insert(resumeSkills).values(body.data).returning().get()
  return c.json(row, 201)
})

resumeAdmin.delete('/skills/:id', (c) => {
  const id = Number(c.req.param('id'))
  const existing = db
    .select()
    .from(resumeSkills)
    .where(eq(resumeSkills.id, id))
    .get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(resumeSkills).where(eq(resumeSkills.id, id)).run()
  return c.json({ ok: true })
})

// Projects
resumeAdmin.get('/projects', (c) => {
  const locale = parseLocale(c.req.query('locale'))
  const rows = db
    .select()
    .from(resumeProjects)
    .where(eq(resumeProjects.locale, locale))
    .orderBy(asc(resumeProjects.sortOrder))
    .all()
  return c.json(rows)
})

resumeAdmin.post('/projects', async (c) => {
  const body = await readBody(c, projectSchema)
  if ('error' in body) return body.error
  const row = db.insert(resumeProjects).values(body.data).returning().get()
  return c.json(row, 201)
})

resumeAdmin.patch('/projects/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await readPatch(c, projectSchema)
  if ('error' in body) return body.error
  const row = db
    .update(resumeProjects)
    .set(body.data)
    .where(eq(resumeProjects.id, id))
    .returning()
    .get()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

resumeAdmin.delete('/projects/:id', (c) => {
  const id = Number(c.req.param('id'))
  const existing = db
    .select()
    .from(resumeProjects)
    .where(eq(resumeProjects.id, id))
    .get()
  if (!existing) return c.json({ error: 'Not found' }, 404)
  db.delete(resumeProjects).where(eq(resumeProjects.id, id)).run()
  return c.json({ ok: true })
})

resumeAdmin.post('/projects/copy', (c) => {
  const from = parseLocale(c.req.query('from'))
  const to = parseLocale(c.req.query('to'))
  const source = db
    .select()
    .from(resumeProjects)
    .where(eq(resumeProjects.locale, from))
    .orderBy(asc(resumeProjects.sortOrder))
    .all()
  db.delete(resumeProjects).where(eq(resumeProjects.locale, to)).run()
  if (source.length > 0) {
    db.insert(resumeProjects)
      .values(source.map(({ id: _id, ...row }) => ({ ...row, locale: to })))
      .run()
  }
  const result = db
    .select()
    .from(resumeProjects)
    .where(eq(resumeProjects.locale, to))
    .orderBy(asc(resumeProjects.sortOrder))
    .all()
  return c.json(result)
})
