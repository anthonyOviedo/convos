import nodemailer from 'nodemailer'

const FROM = '"conVos" <convos@milocalhost.work>'

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

export async function notifyNewSession({ session, client, psychologist }) {
  try {
    const t = makeTransport()
    await t.sendMail({
      from: FROM,
      to: psychologist.email,
      subject: 'Nueva solicitud de sesión — conVos',
      html: `
        <p>Hola <strong>${psychologist.name}</strong>,</p>
        <p>Tienes una nueva solicitud de sesión de <strong>${client.name}</strong>.</p>
        <p><strong>Fecha solicitada:</strong> ${fmt(session.scheduled_at)}</p>
        ${session.client_message ? `<p><strong>Mensaje:</strong> "${session.client_message}"</p>` : ''}
        <p>Ingresa a conVos para aceptar o rechazar la sesión.</p>
        <hr/>
        <p style="color:#666;font-size:12px">conVos — Plataforma de psicología online</p>
      `,
    })
  } catch (err) {
    console.error('[notify] notifyNewSession error:', err.message)
  }
}

export async function notifySessionResponse({ session, client, psychologist }) {
  try {
    const t = makeTransport()
    if (session.status === 'accepted') {
      const meetHtml = `<p><strong>Enlace de videollamada:</strong> <a href="${session.meet_link}">${session.meet_link}</a></p>`
      await Promise.all([
        t.sendMail({
          from: FROM,
          to: psychologist.email,
          subject: 'Sesión confirmada — conVos',
          html: `
            <p>Hola <strong>${psychologist.name}</strong>,</p>
            <p>Has aceptado la sesión con <strong>${client.name}</strong>.</p>
            <p><strong>Fecha:</strong> ${fmt(session.scheduled_at)}</p>
            ${meetHtml}
            <hr/><p style="color:#666;font-size:12px">conVos</p>
          `,
        }),
        t.sendMail({
          from: FROM,
          to: client.email,
          subject: 'Tu sesión fue aceptada — conVos',
          html: `
            <p>Hola <strong>${client.name}</strong>,</p>
            <p><strong>${psychologist.name}</strong> ha aceptado tu sesión.</p>
            <p><strong>Fecha:</strong> ${fmt(session.scheduled_at)}</p>
            ${meetHtml}
            <hr/><p style="color:#666;font-size:12px">conVos</p>
          `,
        }),
      ])
    } else if (session.status === 'rejected') {
      await t.sendMail({
        from: FROM,
        to: client.email,
        subject: 'Actualización sobre tu sesión — conVos',
        html: `
          <p>Hola <strong>${client.name}</strong>,</p>
          <p><strong>${psychologist.name}</strong> no puede atenderte en la fecha solicitada.</p>
          ${session.rejection_reason ? `<p><strong>Motivo:</strong> ${session.rejection_reason}</p>` : ''}
          <p>Puedes intentar agendar en otro horario disponible.</p>
          <hr/><p style="color:#666;font-size:12px">conVos</p>
        `,
      })
    }
  } catch (err) {
    console.error('[notify] notifySessionResponse error:', err.message)
  }
}
