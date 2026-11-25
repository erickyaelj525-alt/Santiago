/**
 * Envío de correos de verificación mediante la API HTTP de Resend.
 *
 * En desarrollo, sin credenciales, se mantiene el modo demo. En producción
 * la falta de configuración es un error para no exponer códigos de verificación.
 */
const { RESEND_API_KEY, RESEND_FROM } = process.env;

/** true cuando hay configuración suficiente para enviar correos reales. */
export const correoConfigurado = Boolean(RESEND_API_KEY && RESEND_FROM);

function escaparHtml(valor) {
  return String(valor).replace(/[&<>"']/g, (caracter) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[caracter]);
}

/** Plantilla HTML sencilla del correo de verificación. */
function plantillaHtml(nombre, codigo) {
  return `
  <div style="font-family: Arial, Helvetica, sans-serif; background:#fdf8ef; padding:24px;">
    <div style="max-width:520px;margin:auto;background:#ffffff;border-radius:16px;padding:32px;border:1px solid #f0e2c8;">
      <h1 style="color:#7a4a1e;margin:0 0 8px;font-size:22px;">Apiario Digital</h1>
      <p style="color:#5b4a36;font-size:15px;">Hola ${escaparHtml(nombre)},</p>
      <p style="color:#5b4a36;font-size:15px;">Usa este código para verificar tu cuenta:</p>
      <p style="font-size:34px;letter-spacing:10px;font-weight:bold;color:#b8860b;margin:24px 0;">${escaparHtml(codigo)}</p>
      <p style="color:#8a7862;font-size:13px;">El código vence en 15 minutos. Si no solicitaste esta cuenta, ignora este correo.</p>
    </div>
  </div>`;
}

/**
 * Envía el código de verificación.
 * @returns {Promise<{enviado: boolean, demo: boolean}>} demo=true si no hay configuración.
 */
export async function enviarCodigoVerificacion(destino, codigo, nombre = '') {
  if (!correoConfigurado) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('El correo no está configurado. Define RESEND_API_KEY y RESEND_FROM en el backend.');
    }

    console.log(`\n[mailer:demo] Código de verificación para ${destino}: ${codigo}\n`);
    return { enviado: false, demo: true };
  }

  let respuesta;
  try {
    respuesta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: [destino],
        subject: `Tu código de verificación: ${codigo}`,
        text: `Hola ${nombre}, tu código de verificación de Apiario Digital es ${codigo}. Vence en 15 minutos.`,
        html: plantillaHtml(nombre, codigo),
      }),
    });
  } catch (error) {
    throw new Error('No se pudo conectar con Resend para enviar el correo.', { cause: error });
  }

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text();
    let detalle = cuerpo;
    try {
      const datos = JSON.parse(cuerpo);
      detalle = datos.message || datos.error || cuerpo;
    } catch {
      // Resend puede devolver una respuesta no JSON en caso de error.
    }
    throw new Error(`Resend rechazó el envío (${respuesta.status}): ${detalle || 'sin detalles'}`);
  }

  return { enviado: true, demo: false };
}
