import { Hono } from 'hono'
import { db } from '../db/index.js'
import {
  profile,
  resumeWork,
  resumeEducation,
  resumeSkills,
  resumeProjects,
} from '../db/schema.js'
import { eq, asc } from 'drizzle-orm'

type Locale = 'en' | 'id'

function parseLocale(raw: string | undefined): Locale {
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

function buildResumeResponse(locale: Locale) {
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
  const body = await c.req.json<Partial<typeof profile.$inferInsert>>()
  const row = db
    .insert(profile)
    .values({ locale, name: '', ...body })
    .onConflictDoUpdate({ target: profile.locale, set: body })
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
  const body = await c.req.json<typeof resumeWork.$inferInsert>()
  const row = db.insert(resumeWork).values(body).returning().get()
  return c.json(row, 201)
})

resumeAdmin.patch('/work/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<Partial<typeof resumeWork.$inferInsert>>()
  const row = db
    .update(resumeWork)
    .set(body)
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
  const body = await c.req.json<typeof resumeEducation.$inferInsert>()
  const row = db.insert(resumeEducation).values(body).returning().get()
  return c.json(row, 201)
})

resumeAdmin.patch('/education/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<Partial<typeof resumeEducation.$inferInsert>>()
  const row = db
    .update(resumeEducation)
    .set(body)
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
  const body = await c.req.json<typeof resumeSkills.$inferInsert>()
  const row = db.insert(resumeSkills).values(body).returning().get()
  return c.json(row, 201)
})

resumeAdmin.patch('/skills/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<Partial<typeof resumeSkills.$inferInsert>>()
  const row = db
    .update(resumeSkills)
    .set(body)
    .where(eq(resumeSkills.id, id))
    .returning()
    .get()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
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
  const body = await c.req.json<typeof resumeProjects.$inferInsert>()
  const row = db.insert(resumeProjects).values(body).returning().get()
  return c.json(row, 201)
})

resumeAdmin.patch('/projects/:id', async (c) => {
  const id = Number(c.req.param('id'))
  const body = await c.req.json<Partial<typeof resumeProjects.$inferInsert>>()
  const row = db
    .update(resumeProjects)
    .set(body)
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
