/**
 * Pruebas de integración del CRUD de apiarios y colmenas contra la BD real.
 * Crea un usuario temporal, ejecuta CREATE -> READ -> UPDATE -> DELETE y limpia al final.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { query, pool } from '../src/config/db.js';

const app = createApp();
const emailPrueba = `crud_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@apiario.test`;

let token;
let apiarioId;
let colmenaId;

beforeAll(async () => {
  // Registro + verificación del código (el registro ya no devuelve token).
  const registro = await request(app)
    .post('/api/auth/register')
    .send({ nombre: 'Usuario CRUD', email: emailPrueba, password: 'secreto123' });

  const verificacion = await request(app)
    .post('/api/auth/verificar')
    .send({ email: emailPrueba, codigo: registro.body.codigo_demo });

  token = verificacion.body.token;
});

afterAll(async () => {
  await query('DELETE FROM usuarios WHERE email = ?', [emailPrueba]);
  await pool.end();
});

describe('CRUD de Apiarios y Colmenas (integración)', () => {
  it('POST /api/apiarios crea un apiario', async () => {
    const res = await request(app)
      .post('/api/apiarios')
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Apiario Norte', municipio: 'Zapopan', lat: 20.72, lng: -103.39 });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.nombre).toBe('Apiario Norte');
    apiarioId = res.body.id;
  });

  it('GET /api/apiarios/:id obtiene el apiario creado', async () => {
    const res = await request(app)
      .get(`/api/apiarios/${apiarioId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Apiario Norte');
    expect(Array.isArray(res.body.colmenas)).toBe(true);
  });

  it('PUT /api/apiarios/:id actualiza el apiario', async () => {
    const res = await request(app)
      .put(`/api/apiarios/${apiarioId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ nombre: 'Apiario Norte Actualizado' });

    expect(res.status).toBe(200);
    expect(res.body.nombre).toBe('Apiario Norte Actualizado');
  });

  it('POST /api/colmenas crea una colmena dentro del apiario', async () => {
    const res = await request(app)
      .post('/api/colmenas')
      .set('Authorization', `Bearer ${token}`)
      .send({ apiario_id: apiarioId, codigo: 'C-01', tipo: 'langstroth', estado: 'activa' });

    expect(res.status).toBe(201);
    expect(res.body.codigo).toBe('C-01');
    colmenaId = res.body.id;
  });

  it('DELETE /api/colmenas/:id y DELETE /api/apiarios/:id eliminan los recursos', async () => {
    const delColmena = await request(app)
      .delete(`/api/colmenas/${colmenaId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delColmena.status).toBe(204);

    const delApiario = await request(app)
      .delete(`/api/apiarios/${apiarioId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(delApiario.status).toBe(204);
  });
});
