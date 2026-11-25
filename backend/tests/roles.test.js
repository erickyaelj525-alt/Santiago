/**
 * Pruebas de integración del sistema de roles (dueño / trabajador) contra la
 * base de datos real.
 *
 * Requieren que la BD esté sembrada (npm run db:seed): usan las cuentas demo
 * (demo@apiario.mx). Crean un trabajador con email aleatorio para no chocar
 * con datos existentes y lo eliminan al final.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { query, pool } from '../src/config/db.js';

const app = createApp();

const DEMO_EMAIL = 'demo@apiario.mx';
const DEMO_PASSWORD = 'demo1234';
const TRABAJADOR_EMAIL = `trab_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@apiario.test`;
const TRABAJADOR_PASSWORD = 'trabajador1234';

let tokenDueno;
let tokenTrabajador;
let trabajadorId;
let codigoTrabajador;
let apiarioId;

beforeAll(async () => {
  // Sesión del dueño demo (debe existir tras npm run db:seed).
  const loginDueno = await request(app)
    .post('/api/auth/login')
    .send({ email: DEMO_EMAIL, password: DEMO_PASSWORD });
  tokenDueno = loginDueno.body.token;

  // Guardamos un apiario del dueño para probar el DELETE restringido.
  const apiarios = await request(app)
    .get('/api/apiarios')
    .set('Authorization', `Bearer ${tokenDueno}`);
  apiarioId = apiarios.body[0]?.id;
});

afterAll(async () => {
  // Limpieza: elimina el trabajador creado por la prueba.
  await query('DELETE FROM usuarios WHERE email = ?', [TRABAJADOR_EMAIL]);
  await pool.end();
});

describe('Sistema de roles (dueño / trabajador)', () => {
  it('a) el dueño crea un trabajador sin verificar y con código enviado (201)', async () => {
    const res = await request(app)
      .post('/api/trabajadores')
      .set('Authorization', `Bearer ${tokenDueno}`)
      .send({
        nombre: 'Trabajador de Prueba',
        email: TRABAJADOR_EMAIL,
        password: TRABAJADOR_PASSWORD,
      });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: TRABAJADOR_EMAIL,
      rol: 'trabajador',
      email_verificado: 0,
    });
    expect(res.body.password_hash).toBeUndefined();
    // Sin Resend configurado, el backend expone el código en modo demo local.
    expect(res.body.codigo_demo).toMatch(/^\d{6}$/);
    codigoTrabajador = res.body.codigo_demo;
    trabajadorId = res.body.id;
  });

  it('b) el trabajador verifica su correo y ve los apiarios del dueño (200) pero no gestiona el equipo (403)', async () => {
    // La cuenta del trabajador nace sin verificar: primero confirma el código.
    const verificacion = await request(app)
      .post('/api/auth/verificar')
      .send({ email: TRABAJADOR_EMAIL, codigo: codigoTrabajador });
    expect(verificacion.status).toBe(200);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: TRABAJADOR_EMAIL, password: TRABAJADOR_PASSWORD });
    expect(login.status).toBe(200);
    tokenTrabajador = login.body.token;

    const apiarios = await request(app)
      .get('/api/apiarios')
      .set('Authorization', `Bearer ${tokenTrabajador}`);
    expect(apiarios.status).toBe(200);
    expect(apiarios.body.length).toBeGreaterThanOrEqual(1);

    const equipo = await request(app)
      .get('/api/trabajadores')
      .set('Authorization', `Bearer ${tokenTrabajador}`);
    expect(equipo.status).toBe(403);
  });

  it('c) el trabajador NO puede eliminar un apiario del dueño (403)', async () => {
    const res = await request(app)
      .delete(`/api/apiarios/${apiarioId}`)
      .set('Authorization', `Bearer ${tokenTrabajador}`);
    expect(res.status).toBe(403);
  });

  it('d) el dueño lista su equipo (200) e incluye al trabajador creado', async () => {
    const res = await request(app)
      .get('/api/trabajadores')
      .set('Authorization', `Bearer ${tokenDueno}`);
    expect(res.status).toBe(200);
    expect(res.body.some((u) => u.id === trabajadorId)).toBe(true);
    // El dueño aparece primero y nunca se expone el hash.
    expect(res.body[0].rol).toBe('dueno');
    expect(res.body.every((u) => u.password_hash === undefined)).toBe(true);
  });
});
