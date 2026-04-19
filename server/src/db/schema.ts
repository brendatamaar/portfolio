import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull().default(''),
  content: text('content').notNull().default(''),
  status: text('status', { enum: ['draft', 'published'] })
    .notNull()
    .default('draft'),
  titleId: text('title_id'),
  descriptionId: text('description_id'),
  contentId: text('content_id'),
  coverImageUrl: text('cover_image_url'),
  publishedAt: integer('published_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
})

export const postTags = sqliteTable('post_tags', {
  postId: integer('post_id')
    .notNull()
    .references(() => posts.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id')
    .notNull()
    .references(() => tags.id, { onDelete: 'cascade' }),
})

export const images = sqliteTable('images', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  filename: text('filename').notNull().unique(),
  originalName: text('original_name').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  url: text('url').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const appSettings = sqliteTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
})

export const adminUsers = sqliteTable('admin_users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const books = sqliteTable('books', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  author: text('author').notNull(),
  status: text('status', { enum: ['reading', 'finished', 'want'] })
    .notNull()
    .default('finished'),
  year: integer('year'),
  coverUrl: text('cover_url'),
  featured: integer('featured').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

export const albums = sqliteTable('albums', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  artist: text('artist').notNull(),
  year: integer('year'),
  coverUrl: text('cover_url'),
  featured: integer('featured').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .notNull()
    .default(sql`(unixepoch())`),
})

// Resume tables

export const profile = sqliteTable('profile', {
  locale: text('locale', { enum: ['en', 'id'] }).primaryKey(),
  name: text('name').notNull(),
  initials: text('initials').notNull().default(''),
  location: text('location').notNull().default(''),
  locationLink: text('location_link').notNull().default(''),
  currentJob: text('current_job').notNull().default(''),
  description: text('description').notNull().default(''),
  about: text('about').notNull().default(''),
  summary: text('summary').notNull().default(''),
  avatarUrl: text('avatar_url').notNull().default(''),
  personalWebsiteUrl: text('personal_website_url').notNull().default(''),
  email: text('email').notNull().default(''),
  tel: text('tel').notNull().default(''),
  social: text('social').notNull().default('[]'),
})

export const resumeWork = sqliteTable('resume_work', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  locale: text('locale', { enum: ['en', 'id'] }).notNull(),
  company: text('company').notNull(),
  link: text('link').notNull().default(''),
  badge: text('badge').notNull().default(''),
  title: text('title').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
  description: text('description').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const resumeEducation = sqliteTable('resume_education', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  locale: text('locale', { enum: ['en', 'id'] }).notNull(),
  school: text('school').notNull(),
  degree: text('degree').notNull(),
  start: text('start').notNull(),
  end: text('end').notNull(),
  desc: text('desc').notNull().default(''),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const resumeSkills = sqliteTable('resume_skills', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
})

export const resumeProjects = sqliteTable('resume_projects', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  locale: text('locale', { enum: ['en', 'id'] }).notNull(),
  title: text('title').notNull(),
  type: text('type', { enum: ['side_project', 'work'] }).notNull(),
  company: text('company'),
  techStack: text('tech_stack').notNull().default('[]'),
  description: text('description').notNull().default(''),
  linkLabel: text('link_label'),
  linkHref: text('link_href'),
  img: text('img').notNull().default(''),
  isFeatured: integer('is_featured').notNull().default(0),
  sortOrder: integer('sort_order').notNull().default(0),
})
