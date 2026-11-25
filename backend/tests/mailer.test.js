import { afterEach, describe, expect, it, vi } from 'vitest';

async function cargarMailer({ apiKey = 're_test', remitente = 'Apiario <test@example.com>', entorno = 'test' } = {}) {
  vi.resetModules();
  vi.stubEnv('RESEND_API_KEY', apiKey);
  vi.stubEnv('RESEND_FROM', remitente);
  vi.stubEnv('NODE_ENV', entorno);
  return import('../src/utils/mailer.js');
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('Envío de correo de verificación', () => {
  it('envía el código a Resend usando HTTPS y escapa el nombre en el HTML', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal('fetch', fetchMock);
    const { enviarCodigoVerificacion } = await cargarMailer();

    await expect(enviarCodigoVerificacion('persona@example.com', '123456', '<Ana>'))
      .resolves.toEqual({ enviado: true, demo: false });

    expect(fetchMock).toHaveBeenCalledWith('https://api.resend.com/emails', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ Authorization: 'Bearer re_test' }),
    }));
    const payload = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(payload.to).toEqual(['persona@example.com']);
    expect(payload.html).toContain('&lt;Ana&gt;');
  });

  it('devuelve un error explícito si Resend rechaza el envío', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => JSON.stringify({ message: 'Invalid API key' }),
    }));
    const { enviarCodigoVerificacion } = await cargarMailer();

    await expect(enviarCodigoVerificacion('persona@example.com', '123456'))
      .rejects.toThrow('Resend rechazó el envío (401): Invalid API key');
  });

  it('no habilita el modo demo en producción si falta la configuración', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { enviarCodigoVerificacion, correoConfigurado } = await cargarMailer({
      apiKey: '',
      remitente: '',
      entorno: 'production',
    });

    expect(correoConfigurado).toBe(false);
    await expect(enviarCodigoVerificacion('persona@example.com', '123456'))
      .rejects.toThrow('Define RESEND_API_KEY y RESEND_FROM');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
