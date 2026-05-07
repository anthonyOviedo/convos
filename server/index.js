import express from 'express'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import pool from './db.js'
import authRouter from './routes/auth.js'
import { requireAuth } from './middleware/requireAuth.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3000

app.use(express.json())
app.use(cookieParser())
app.use(express.static(join(__dirname, 'public')))

app.use('/api/auth', authRouter)

app.get('/api/hello', requireAuth, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT message FROM convos.greetings LIMIT 1')
    const message = rows[0]?.message ?? 'Hola desde conVos'
    res.json({ message, desde_db: rows.length > 0 })
  } catch {
    res.json({ message: 'Hola desde conVos', desde_db: false })
  }
})

app.get('/{*path}', (_req, res) => {
  res.sendFile(join(__dirname, 'public', 'index.html'))
})

app.listen(PORT, () => console.log(`conVos corriendo en :${PORT}`))
