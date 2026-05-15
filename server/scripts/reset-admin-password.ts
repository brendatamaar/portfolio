import { db } from '../src/db/index.js'
import { adminUsers } from '../src/db/schema.js'
import { hashPassword } from '../src/lib/crypto.js'
import { eq } from 'drizzle-orm'

const [username, newPassword] = process.argv.slice(2)

if (!username || !newPassword) {
  console.error(
    'Usage: bun run server/scripts/reset-admin-password.ts <username> <newpassword>',
  )
  process.exit(1)
}

const user = db
  .select({ id: adminUsers.id })
  .from(adminUsers)
  .where(eq(adminUsers.username, username))
  .get()
if (!user) {
  console.error(`Error: user "${username}" not found.`)
  process.exit(1)
}

const hash = await hashPassword(newPassword)
db.update(adminUsers)
  .set({ passwordHash: hash })
  .where(eq(adminUsers.username, username))
  .run()
console.log(`Password updated for "${username}".`)
