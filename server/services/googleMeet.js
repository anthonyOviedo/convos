import { google } from 'googleapis'
import { randomUUID } from 'crypto'

const FALLBACK = () => `https://meet.jit.si/conVos-${randomUUID()}`

function makeAuth() {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN } = process.env
  if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !GOOGLE_REFRESH_TOKEN) return null
  const auth = new google.auth.OAuth2(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET)
  auth.setCredentials({ refresh_token: GOOGLE_REFRESH_TOKEN })
  return auth
}

export function googleConfigured() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN)
}

export async function createMeetEvent({ session, client, psychologist }) {
  const auth = makeAuth()
  if (!auth) {
    console.warn('[googleMeet] Credenciales no configuradas, usando Jitsi como fallback')
    return { meetLink: FALLBACK(), eventCreated: false }
  }

  const endTime = new Date(
    new Date(session.scheduled_at).getTime() + (session.duration_minutes ?? 50) * 60_000
  ).toISOString()

  try {
    const calendar = google.calendar({ version: 'v3', auth })
    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      sendUpdates: 'all',
      requestBody: {
        summary: `Sesión conVos — ${psychologist.name} & ${client.name}`,
        description: [
          `Sesión de psicología a través de conVos.`,
          ``,
          `Psicólogo/a: ${psychologist.name}`,
          `Paciente: ${client.name}`,
          ``,
          `Para unirse a la videollamada, use el enlace de Google Meet adjunto.`,
        ].join('\n'),
        start: { dateTime: session.scheduled_at, timeZone: 'America/Costa_Rica' },
        end:   { dateTime: endTime,               timeZone: 'America/Costa_Rica' },
        attendees: [
          { email: psychologist.email, displayName: psychologist.name },
          { email: client.email,       displayName: client.name },
        ],
        conferenceData: {
          createRequest: { requestId: randomUUID(), conferenceSolutionKey: { type: 'hangoutsMeet' } },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email',  minutes: 60 * 24 },  // 24h antes
            { method: 'email',  minutes: 60 },         // 1h antes
            { method: 'popup',  minutes: 30 },
          ],
        },
      },
    })

    const ep = event.data.conferenceData?.entryPoints?.find(e => e.entryPointType === 'video')
    const meetLink = ep?.uri ?? event.data.hangoutLink ?? FALLBACK()

    console.log(`[googleMeet] Evento creado: ${event.data.id} → ${meetLink}`)
    return { meetLink, eventId: event.data.id, eventCreated: true }
  } catch (err) {
    console.error('[googleMeet] Error creando evento:', err.message)
    return { meetLink: FALLBACK(), eventCreated: false }
  }
}
