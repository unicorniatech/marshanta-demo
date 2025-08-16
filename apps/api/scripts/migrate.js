import 'dotenv/config'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function main() {
  const migrationsDir = path.resolve(__dirname, '..', 'migrations')
  const files = (await readdir(migrationsDir))
    .filter(f => f.match(/^\d+_.*\.sql$/))
    .sort() // ensure numeric order

  if (!files.length) {
    console.log('No migration files found')
    return
  }

  const url = process.env.DATABASE_URL
  if (!url) {
    console.error('DATABASE_URL not set. See .env.example')
    process.exit(1)
  }

  const client = new Client({ connectionString: url })
  await client.connect()

  try {
    for (const f of files) {
      const full = path.join(migrationsDir, f)
      const sql = await readFile(full, 'utf8')
      console.log(`Applying migration: ${f}`)
      await client.query(sql)
    }
    console.log('Migrations applied successfully')
  } finally {
    await client.end()
  }
}

main().catch(err => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
