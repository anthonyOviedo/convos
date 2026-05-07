import { Router } from 'express'
import { getOidcConfig, signToken, verifyToken, oidc } from '../auth.js'

export const COOKIE_NAME = 'convos_token'

const COOKIE_OPTS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
}

const TEMP_COOKIE_OPTS = {
  ...COOKIE_OPTS,
  maxAge: 10 * 60 * 1000,
}

const router = Router()

router.get('/login', async (req, res) => {
  try {
    const config = await getOidcConfig()
    const state = oidc.randomState()
    const nonce = oidc.randomNonce()
    const codeVerifier = oidc.randomPKCECodeVerifier()
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier)
    const returnTo = typeof req.query.return_to === 'string' ? req.query.return_to : '/'

    res.cookie('oidc_state', state, TEMP_COOKIE_OPTS)
    res.cookie('oidc_nonce', nonce, TEMP_COOKIE_OPTS)
    res.cookie('oidc_verifier', codeVerifier, TEMP_COOKIE_OPTS)
    res.cookie('oidc_return_to', returnTo, TEMP_COOKIE_OPTS)

    const authUrl = oidc.buildAuthorizationUrl(config, {
      redirect_uri: process.env.OIDC_REDIRECT_URI,
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    res.redirect(authUrl.href)
  } catch (err) {
    console.error('[auth] login error:', err.message)
    res.status(500).send('Error al iniciar sesión')
  }
})

router.get('/callback', async (req, res) => {
  const { oidc_state, oidc_nonce, oidc_verifier, oidc_return_to } = req.cookies

  res.clearCookie('oidc_state', COOKIE_OPTS)
  res.clearCookie('oidc_nonce', COOKIE_OPTS)
  res.clearCookie('oidc_verifier', COOKIE_OPTS)
  res.clearCookie('oidc_return_to', COOKIE_OPTS)

  try {
    const config = await getOidcConfig()
    const callbackUrl = new URL(`${process.env.OIDC_REDIRECT_URI}?${new URLSearchParams(req.query)}`)

    const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
      pkceCodeVerifier: oidc_verifier,
      expectedState: oidc_state,
      expectedNonce: oidc_nonce,
    })

    const claims = tokens.claims()
    let userInfo
    try {
      userInfo = await oidc.fetchUserInfo(config, tokens.access_token, claims.sub)
    } catch {
      userInfo = claims
    }

    const token = await signToken({
      sub: userInfo.sub,
      email: userInfo.email ?? null,
      name: userInfo.name ?? userInfo.preferred_username ?? userInfo.sub,
      groups: userInfo.groups ?? [],
    })

    res.cookie(COOKIE_NAME, token, { ...COOKIE_OPTS, maxAge: 30 * 24 * 60 * 60 * 1000 })
    res.redirect(oidc_return_to || '/')
  } catch (err) {
    console.error('[auth] callback error:', err.message)
    res.redirect('/api/auth/login')
  }
})

router.get('/me', async (req, res) => {
  const token = req.cookies[COOKIE_NAME]
  if (!token) return res.json({ user: null })
  try {
    const { sub, email, name, groups } = await verifyToken(token)
    res.json({ user: { sub, email, name, groups } })
  } catch {
    res.clearCookie(COOKIE_NAME, { path: '/' })
    res.json({ user: null })
  }
})

router.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: '/' })
  res.json({ ok: true })
})

export default router
