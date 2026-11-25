/**
 * Envío de correos (verificación de cuenta).
 *
 * Usa SMTP configurado por variables de entorno. Si NO hay credenciales SMTP
 * (modo demo/local), el código se imprime en la consola del servidor y el
 * controlador lo devuelve en la respuesta para poder probar sin servidor de
 * correo. En cuanto se configure SMTP, los correos se envían de verdad.
 *
 * Variables de entorno:
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
 * (para Gmail: host smtp.gmail.com, puerto 465, y una "contraseña de aplicación")
 */
import nodemailer from 'nodemailer';

const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

/** true si hay credenciales suficientes para enviar correos reales. */
export const correoConfigurado = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS);

let transporte = null;
if (correoConfigurado) {
  transporte = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
}

/** Plantilla HTML sencilla del correo de verificación. */
function plantillaHtml(nombre, codigo) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#fdf8ef; padding:24px;">
    <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #f0e2c8;">
      <h1 style="color:#7a4a1e;margin:0 0 8px;font-size:22px;">Apiario Digital</h1>
      <p style="color:#5b4a36;font-size:15px;">Hola ${nombre},</p>
      <p style="color:#5b4a36;font-size:15px;">Usa este código para verificar tu cuenta:</p>
      <p style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#b8860b;margin:24px 0;">${codigo}</p>
      <p style="color:#8a7862;font-size:13px;">El código vence en 15 minutos. Si no solicitaste esta cuenta, ignora este correo.</p>
    </div>
  </div>`;
}

/**
 * Envía el código de verificación.
 * @returns {Promise<{enviado: boolean, demo: boolean}>} demo=true si no hay SMTP.
 */
export async function enviarCodigoVerificacion(destino, codigo, nombre = '') {
  const asunto = `Tu código de verificación: ${codigo}`;
  const texto = `Hola ${nombre}, tu código de verificación de Apiario Digital es ${codigo}. Vence en 15 minutos.`;

  if (!correoConfigurado) {
    // Modo demo: sin SMTP solo registramos el código en consola.
    console.log(`\n[mailer:demo] Código de verificación para ${destino}: ${codigo}\n`);
    return { enviado: false, demo: true };
  }

  await transporte.sendMail({
    from: SMTP_FROM || SMTP_USER,
    to: destino,
    subject: asunto,
    text: texto,
    html: plantillaHtml(nombre, codigo),
  });
  return { enviado: true, demo: false };
}
