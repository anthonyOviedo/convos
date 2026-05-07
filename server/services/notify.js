import nodemailer from 'nodemailer'
import { randomUUID } from 'crypto'

const FROM   = '"conVos" <convos@milocalhost.work>'
const APP_URL = 'https://convos.milocalhost.work'

function makeTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST ?? 'smtp-relay',
    port: parseInt(process.env.SMTP_PORT ?? '587'),
    secure: false,
    tls: { rejectUnauthorized: false },
  })
}

function fmt(dt) {
  return new Date(dt).toLocaleString('es-CR', {
    timeZone: 'America/Costa_Rica',
    weekday: 'long', year: 'numeric', month: 'long',
    day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

function fmtIcal(isoStr) {
  // YYYYMMDDTHHMMSSZ
  return new Date(isoStr).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
}

function buildIcs({ summary, description, start, end, meetLink, psychologist, client }) {
  const uid = `${randomUUID()}@convos.milocalhost.work`
  const now = fmtIcal(new Date().toISOString())
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//conVos//Psychology Platform//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART:${fmtIcal(start)}`,
    `DTEND:${fmtIcal(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
    `LOCATION:${meetLink}`,
    `URL:${meetLink}`,
    `ORGANIZER;CN=conVos:mailto:convos@milocalhost.work`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=ACCEPTED;CN="${psychologist.name}":mailto:${psychologist.email}`,
    `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;CN="${client.name}":mailto:${client.email}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Sesión conVos en 1 hora',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Sesión conVos en 30 minutos',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

function emailHeader(recipientName) {
  return `
  <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:560px;margin:0 auto;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden">
  <div style="background:#0369a1;padding:24px 32px;text-align:center">
    <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:-0.5px">con<span style="color:#bae6fd">Vos</span></h1>
    <p style="color:rgba(255,255,255,0.75);margin:4px 0 0;font-size:13px">Plataforma de psicología online</p>
  </div>
  <div style="padding:28px 32px;background:#ffffff">
    <p style="margin:0 0 16px;font-size:15px;color:#1e293b">Hola <strong>${recipientName}</strong>,</p>
  `
}

function emailFooter() {
  return `
  </div>
  <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center">
    <p style="margin:0;font-size:12px;color:#94a3b8">
      Este mensaje fue generado automáticamente por
      <a href="${APP_URL}" style="color:#0369a1;text-decoration:none">conVos</a>.
      No respondas a este correo.
    </p>
  </div>
  </div>`
}

function meetBtn(link) {
  return `
  <div style="margin:20px 0;text-align:center">
    <a href="${link}" style="display:inline-block;padding:13px 28px;background:#0369a1;color:#fff;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px">
      📹 Unirse a Google Meet
    </a>
    <p style="margin:8px 0 0;font-size:12px;color:#64748b">O copia el enlace: <a href="${link}" style="color:#0369a1">${link}</a></p>
  </div>`
}

function sessionInfo({ scheduled_at, duration, psychologist, client, message }) {
  return `
  <table style="width:100%;border-collapse:collapse;margin:16px 0;font-size:14px">
    <tr><td style="padding:8px 12px;background:#f1f5f9;border-radius:6px 6px 0 0;font-weight:600;color:#475569">Fecha y hora</td>
        <td style="padding:8px 12px;background:#f8fafc">${fmt(scheduled_at)}</td></tr>
    <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;color:#475569">Duración</td>
        <td style="padding:8px 12px;background:#fff">${duration ?? 50} minutos</td></tr>
    <tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;color:#475569">Psicólogo/a</td>
        <td style="padding:8px 12px;background:#f8fafc">${psychologist.name}</td></tr>
    <tr><td style="padding:8px 12px;background:#f1f5f9;border-radius:0 0 6px 6px;font-weight:600;color:#475569">Paciente</td>
        <td style="padding:8px 12px;background:#fff">${client.name}</td></tr>
    ${message ? `<tr><td style="padding:8px 12px;background:#f1f5f9;font-weight:600;color:#475569">Mensaje</td><td style="padding:8px 12px;background:#f8fafc;font-style:italic">"${message}"</td></tr>` : ''}
  </table>`
}

async function send(opts) {
  try {
    await makeTransport().sendMail({ from: FROM, ...opts })
  } catch (err) {
    console.error(`[notify] Error enviando a ${opts.to}: ${err.message}`)
  }
}

// ── Contact request notifications ─────────────────────────────────────────────

export async function notifyContactRequest({ request, client, psychologist }) {
  await send({
    to: psychologist.email,
    subject: `Nueva solicitud de contacto de ${client.name} — conVos`,
    html: emailHeader(psychologist.name) + `
      <p style="margin:0 0 16px;color:#334155">
        <strong>${client.name}</strong> quiere ponerse en contacto contigo como paciente.
      </p>
      ${request.message ? `<blockquote style="margin:0 0 16px;padding:12px 16px;background:#f0f9ff;border-left:4px solid #0369a1;border-radius:4px;color:#334155;font-style:italic">"${request.message}"</blockquote>` : ''}
      <div style="text-align:center;margin:20px 0">
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:#0369a1;color:#fff;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px">
          Responder en conVos
        </a>
      </div>
    ` + emailFooter(),
  })
}

export async function notifyContactResponse({ request, client, psychologist }) {
  const accepted = request.status === 'accepted'
  await send({
    to: client.email,
    subject: accepted
      ? `${psychologist.name} aceptó tu solicitud — conVos`
      : `Actualización de tu solicitud — conVos`,
    html: emailHeader(client.name) + (accepted ? `
      <p style="color:#334155">
        <strong>${psychologist.name}</strong> ha <strong style="color:#059669">aceptado</strong> tu solicitud de contacto.
      </p>
      <p style="color:#334155;margin-top:12px">
        Ya puedes agendar una sesión directamente desde tu panel en conVos.
        Puedes escribirle a: <a href="mailto:${psychologist.email}" style="color:#0369a1">${psychologist.email}</a>
      </p>
      <div style="text-align:center;margin:20px 0">
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:#059669;color:#fff;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px">
          Agendar sesión
        </a>
      </div>
    ` : `
      <p style="color:#334155">
        <strong>${psychologist.name}</strong> no podrá atenderte en este momento.
      </p>
      <p style="color:#334155;margin-top:12px">
        Te invitamos a explorar otros psicólogos disponibles en conVos.
      </p>
      <div style="text-align:center;margin:20px 0">
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:#0369a1;color:#fff;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px">
          Ver psicólogos disponibles
        </a>
      </div>
    `) + emailFooter(),
  })
}

// ── Session notifications ──────────────────────────────────────────────────────

export async function notifyNewSession({ session, client, psychologist }) {
  await send({
    to: psychologist.email,
    subject: `Nueva solicitud de sesión de ${client.name} — conVos`,
    html: emailHeader(psychologist.name) + `
      <p style="color:#334155">
        <strong>${client.name}</strong> ha solicitado una sesión contigo.
      </p>
      ${sessionInfo({ scheduled_at: session.scheduled_at, duration: session.duration_minutes, psychologist, client, message: session.client_message })}
      <div style="text-align:center;margin:20px 0">
        <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:#0369a1;color:#fff;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px">
          Aceptar o rechazar en conVos
        </a>
      </div>
    ` + emailFooter(),
  })
}

export async function notifySessionResponse({ session, client, psychologist }) {
  if (session.status === 'accepted') {
    const endTime = new Date(
      new Date(session.scheduled_at).getTime() + (session.duration_minutes ?? 50) * 60_000
    ).toISOString()

    const ics = buildIcs({
      summary: `Sesión conVos — ${psychologist.name} & ${client.name}`,
      description: `Sesión de psicología vía conVos.\nPsicólogo/a: ${psychologist.name}\nPaciente: ${client.name}`,
      start: session.scheduled_at,
      end: endTime,
      meetLink: session.meet_link,
      psychologist,
      client,
    })

    const attachment = {
      filename: 'sesion-convos.ics',
      content: ics,
      contentType: 'text/calendar; method=REQUEST; charset=UTF-8',
    }

    const bodyPsych = emailHeader(psychologist.name) + `
      <p style="color:#334155">Has <strong style="color:#059669">aceptado</strong> la sesión con <strong>${client.name}</strong>. La invitación de calendario fue agregada a tu correo.</p>
      ${sessionInfo({ scheduled_at: session.scheduled_at, duration: session.duration_minutes, psychologist, client })}
      ${meetBtn(session.meet_link)}
    ` + emailFooter()

    const bodyClient = emailHeader(client.name) + `
      <p style="color:#334155"><strong>${psychologist.name}</strong> ha <strong style="color:#059669">confirmado</strong> tu sesión. La invitación de calendario fue agregada a tu correo.</p>
      ${sessionInfo({ scheduled_at: session.scheduled_at, duration: session.duration_minutes, psychologist, client })}
      ${meetBtn(session.meet_link)}
    ` + emailFooter()

    await Promise.all([
      send({ to: psychologist.email, subject: `Sesión confirmada con ${client.name} — conVos`,         html: bodyPsych,   attachments: [attachment] }),
      send({ to: client.email,       subject: `Tu sesión con ${psychologist.name} fue confirmada — conVos`, html: bodyClient, attachments: [attachment] }),
    ])
  } else if (session.status === 'rejected') {
    await send({
      to: client.email,
      subject: `Actualización de tu sesión — conVos`,
      html: emailHeader(client.name) + `
        <p style="color:#334155">
          <strong>${psychologist.name}</strong> no puede atenderte en el horario solicitado.
        </p>
        ${session.rejection_reason ? `<div style="margin:12px 0;padding:12px 16px;background:#fef2f2;border-left:4px solid #dc2626;border-radius:4px;color:#334155"><strong>Motivo:</strong> ${session.rejection_reason}</div>` : ''}
        <p style="color:#334155;margin-top:12px">Puedes elegir otro horario disponible en conVos.</p>
        <div style="text-align:center;margin:20px 0">
          <a href="${APP_URL}" style="display:inline-block;padding:12px 24px;background:#0369a1;color:#fff;border-radius:50px;text-decoration:none;font-weight:700;font-size:14px">
            Reagendar sesión
          </a>
        </div>
      ` + emailFooter(),
    })
  }
}
