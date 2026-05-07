import * as oidc from 'openid-client'
import { SignJWT, jwtVerify } from 'jose'

let _config = null

export async function getOidcConfig() {
  if (_config) return _config
  const issuerUrl = new URL(process.env.OIDC_ISSUER_URL)
  _config = await oidc.discovery(issuerUrl, process.env.OIDC_CLIENT_ID, process.env.OIDC_CLIENT_SECRET)
  return _config
}

export function jwtSecret() {
  return new TextEncoder().encode(process.env.JWT_SECRET)
}

export async function signToken(payload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(jwtSecret())
}

export async function verifyToken(token) {
  const { payload } = await jwtVerify(token, jwtSecret())
  return payload
}

export { oidc }
