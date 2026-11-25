/**
 * Pruebas unitarias SIN base de datos.
 * Verifican los esquemas de validación (Zod) y las utilidades de JWT.
 */
import { describe, it, expect } from 'vitest';
import {
  registroSchema,
  inspeccionCrearSchema,
  cosechaCrearSchema,
  colmenaCrearSchema,
  apiarioCrearSchema,
} from '../src/validators/schemas.js';
import { signToken, verifyToken } from '../src/utils/jwt.js';

describe('Validación de registro', () => {
  it('rechaza un correo inválido', () => {
    const r = registroSchema.safeParse({ nombre: 'Ana', email: 'no-es-correo', password: 'secreto1' });
    expect(r.success).toBe(false);
  });

  it('rechaza una contraseña de menos de 6 caracteres', () => {
    const r = registroSchema.safeParse({ nombre: 'Ana', email: 'ana@apiario.mx', password: '123' });
    expect(r.success).toBe(false);
  });

  it('acepta datos válidos y normaliza el correo a minúsculas', () => {
    const r = registroSchema.safeParse({
      nombre: '  Ana López  ',
      email: 'ANA@Apiario.MX',
      password: 'secreto1',
    });
    expect(r.success).toBe(true);
    expect(r.data.email).toBe('ana@apiario.mx');
    expect(r.data.nombre).toBe('Ana López');
  });
});

describe('Validación de inspección', () => {
  const base = {
    colmena_id: 1,
    fecha: '2026-08-15',
    poblacion: 3,
    temperamento: 3,
    presencia_reina: 1,
    celdas_reales: 0,
    nivel_varroa: 2,
    alimento_miel: 1,
    alimento_polen: 1,
  };

  it('rechaza poblacion fuera del rango 1..5', () => {
    const r = inspeccionCrearSchema.safeParse({ ...base, poblacion: 9 });
    expect(r.success).toBe(false);
  });

  it('rechaza fecha con formato incorrecto', () => {
    const r = inspeccionCrearSchema.safeParse({ ...base, fecha: '15/08/2026' });
    expect(r.success).toBe(false);
  });

  it('acepta una inspección válida y convierte los booleanos a 0/1', () => {
    const r = inspeccionCrearSchema.safeParse({ ...base, presencia_reina: true, celdas_reales: '1' });
    expect(r.success).toBe(true);
    expect(r.data.presencia_reina).toBe(1);
    expect(r.data.celdas_reales).toBe(1);
  });
});

describe('Validación de otras entidades', () => {
  it('rechaza kg_miel negativo en cosechas', () => {
    const r = cosechaCrearSchema.safeParse({ colmena_id: 1, fecha: '2026-08-01', kg_miel: -3 });
    expect(r.success).toBe(false);
  });

  it('rechaza un estado de colmena no permitido', () => {
    const r = colmenaCrearSchema.safeParse({ apiario_id: 1, codigo: 'A-1', estado: 'volando' });
    expect(r.success).toBe(false);
  });

  it('rechaza una latitud fuera de rango en apiario', () => {
    const r = apiarioCrearSchema.safeParse({ nombre: 'Apiario', lat: 120 });
    expect(r.success).toBe(false);
  });
});

describe('Utilidades JWT', () => {
  it('firma y verifica un token conservando el payload', () => {
    const token = signToken({ id: 7, rol: 'apicultor' });
    const payload = verifyToken(token);
    expect(payload.id).toBe(7);
    expect(payload.rol).toBe('apicultor');
  });

  it('lanza al verificar un token inválido', () => {
    expect(() => verifyToken('token.falso.invalido')).toThrow();
  });
});
