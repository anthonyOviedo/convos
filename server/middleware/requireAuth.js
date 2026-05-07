import { verifyToken } from '../auth.js'
import { COOKIE_NAME } from '../routes/auth.js'

export async function requireAuth(req, res, next) {
  const token = req.cookies[COOKIE_NAME]
  if (!token) return res.status(401).json({ error: 'No autenticado' })
  try {
    req.user = await verifyToken(token)
    next()
  } catch {
    res.clearCookie(COOKIE_NAME, { path: '/' })
    res.status(401).json({ error: 'Sesión inválida' })
  }
}
