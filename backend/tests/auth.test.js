/**
 * Pruebas de integración de autenticación contra la base de datos real.
 * Usan createApp() + supertest (sin levantar el puerto) y un correo aleatorio
 * para no chocar con usuarios existentes. Al final eliminan el usuario creado.
 *
 * Flujo cubierto: registro (cuenta SIN verificar) -> código por correo
 * (en modo demo el backend lo devuelve en `codigo_demo`) -> verificación ->
 * login. El registro ya NO devuelve token: hay que verificar la cuenta.
 */
import { describe, it, expect, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { query, pool } from '../src/config/db.js';

const app = createApp();
const emailPrueba = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@apiario.test`;
const PASSWORD = 'secreto123';

afterAll(async () => {
  // Limpieza: elimina el usuario creado por la prueba.
  await query('DELETE FROM usuarios WHERE email = ?', [emailPrueba]);
  await pool.end();
});

describe('Autenticación (integración)', () => {
  let token;
  let codigoDemo;

  it('POST /api/auth/register responde 201 sin token y pide verificar el correo', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Usuario de Prueba', email: emailPrueba, password: PASSWORD });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeUndefined();
    expect(res.body.email).toBe(emailPrueba);
    // Sin Resend configurado, el backend expone el código en modo demo local.
    expect(res.body.codigo_demo).toMatch(/^\d{6}$/);
    codigoDemo = res.body.codigo_demo;
  });

  it('POST /api/auth/login responde 403 mientras la cuenta no está verificada', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: emailPrueba, password: PASSWORD });

    expect(res.status).toBe(403);
  });

  it('POST /api/auth/verificar activa la cuenta y devuelve token', async () => {
    const res = await request(app)
      .post('/api/auth/verificar')
      .send({ email: emailPrueba, codigo: codigoDemo });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario).toMatchObject({ email: emailPrueba, rol: 'dueno' });
    expect(res.body.usuario.password_hash).toBeUndefined();
    token = res.body.token;
  });

  it('POST /api/auth/verificar con un código incorrecto responde 400', async () => {
    const otro = `test_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@apiario.test`;
    await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Otro', email: otro, password: PASSWORD });

    const res = await request(app)
      .post('/api/auth/verificar')
      .send({ email: otro, codigo: '000000' });

    expect(res.status).toBe(400);
    await query('DELETE FROM usuarios WHERE email = ?', [otro]);
  });

  it('POST /api/auth/login responde 200 con token tras verificar', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: emailPrueba, password: PASSWORD });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.usuario.email).toBe(emailPrueba);
  });

  it('GET /api/auth/me responde 200 con el token', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.usuario.email).toBe(emailPrueba);
  });

  it('una ruta protegida sin token responde 401', async () => {
    const res = await request(app).get('/api/apiarios');
    expect(res.status).toBe(401);
  });
});
