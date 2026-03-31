import { Hono } from 'hono';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { db } from '../db/index.js';
import { adminUsers } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { getJwtSecret } from '../middleware/auth.js';
import { verifyPassword } from '../lib/crypto.js';

const app = new Hono();

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

app.post('/login', async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: 'Invalid request' }, 400);

  const { username, password } = parsed.data;

  const user = db.select().from(adminUsers).where(eq(adminUsers.username, username)).get();
  if (!user) return c.json({ error: 'Invalid credentials' }, 401);

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return c.json({ error: 'Invalid credentials' }, 401);

  const secret = await getJwtSecret();
  const token = jwt.sign({ sub: String(user.id) }, secret, { expiresIn: '30d' });

  return c.json({ token });
});

export default app;
