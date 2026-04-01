/**
 * Password hashing via Node built-in crypto (scrypt).
 * No external dependency.
 */

import { scrypt, randomBytes, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const scryptAsync = promisify(scrypt)

const SALT_LEN = 16
const KEY_LEN = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LEN).toString('hex')
  const hash = (await scryptAsync(password, salt, KEY_LEN)) as Buffer
  return `${salt}:${hash.toString('hex')}`
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const derived = (await scryptAsync(password, salt, KEY_LEN)) as Buffer
  if (derived.length !== hashBuf.length) return false
  return timingSafeEqual(derived, hashBuf)
}
