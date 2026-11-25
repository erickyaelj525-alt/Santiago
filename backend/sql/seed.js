/**
 * Script de datos de demostración (npm run db:seed).
 * Inserta un usuario demo, 3 apiarios reales de México, ~12 colmenas,
 * inspecciones de los últimos meses (con casos de varroa alto y celdas reales
 * para disparar alertas), cosechas que alimentan la gráfica de producción
 * mensual y algunos tratamientos (incluyendo uno abierto).
 *
 * Es idempotente: si el usuario demo ya existe, avisa y no vuelve a insertar.
 */
import bcrypt from 'bcryptjs';
import { query, pool } from '../src/config/db.js';

/** Fecha AAAA-MM-DD a N días de hoy (mediodía para evitar saltos de zona horaria). */
function fechaISO(diasAtras) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - diasAtras);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const EMAIL_DEMO = 'demo@apiario.mx';

// Apiarios en tres zonas apícolas reales de México.
const APIARIOS = [
  {
    nombre: 'Apiario La Sierra',
    descripcion: 'Colmenas entre bosque de oyamel y cultivos de maíz',
    lat: 19.1267,
    lng: -98.7667,
    municipio: 'Amecameca, Estado de México',
  },
  {
    nombre: 'Apiario Valle Dorado',
    descripcion: 'Huertos de agave y flora de temporal',
    lat: 20.8167,
    lng: -102.7667,
    municipio: 'Tepatitlán de Morelos, Jalisco',
  },
  {
    nombre: 'Apiario Costa Chica',
    descripcion: 'Zona cálida con floración de café y cítricos',
    lat: 20.0175,
    lng: -97.5214,
    municipio: 'Cuetzalan del Progreso, Puebla',
  },
];

// Colmenas por apiario (índice de APIARIOS) y su perfil de última inspección.
const COLMENAS = [
  { apiario: 0, codigo: 'LS-01', tipo: 'langstroth', estado: 'activa', reina_marcada: 1, notas: 'Colonia fuerte en producción' },
  { apiario: 0, codigo: 'LS-02', tipo: 'langstroth', estado: 'activa', reina_marcada: 1, notas: null },
  { apiario: 0, codigo: 'LS-03', tipo: 'langstroth', estado: 'activa', reina_marcada: 0, notas: null },
  { apiario: 0, codigo: 'LS-04', tipo: 'langstroth', estado: 'inactiva', reina_marcada: 0, notas: 'Colonia débil, en recuperación' },
  { apiario: 0, codigo: 'LS-05', tipo: 'top_bar', estado: 'activa', reina_marcada: 1, notas: null },
  { apiario: 1, codigo: 'VD-01', tipo: 'langstroth', estado: 'activa', reina_marcada: 1, notas: null },
  { apiario: 1, codigo: 'VD-02', tipo: 'langstroth', estado: 'activa', reina_marcada: 0, notas: null },
  { apiario: 1, codigo: 'VD-03', tipo: 'warre', estado: 'activa', reina_marcada: 0, notas: null },
  { apiario: 1, codigo: 'VD-04', tipo: 'langstroth', estado: 'perdida', reina_marcada: 0, notas: 'Colmena perdida por saqueo' },
  { apiario: 2, codigo: 'CC-01', tipo: 'langstroth', estado: 'activa', reina_marcada: 1, notas: null },
  { apiario: 2, codigo: 'CC-02', tipo: 'langstroth', estado: 'activa', reina_marcada: 1, notas: 'Revisar varroa con frecuencia' },
  { apiario: 2, codigo: 'CC-03', tipo: 'top_bar', estado: 'activa', reina_marcada: 0, notas: 'Recién instalada' },
];

// Perfil de la inspección más reciente por código de colmena (null = nunca inspeccionada).
const PERFILES = {
  'LS-01': { ultimaDias: 6, varroa: 4, celdas: 0, poblacion: 4, temperamento: 3 },
  'LS-02': { ultimaDias: 5, varroa: 1, celdas: 0, poblacion: 4, temperamento: 2 },
  'LS-03': { ultimaDias: 4, varroa: 2, celdas: 1, poblacion: 3, temperamento: 4 },
  'LS-04': { ultimaDias: 30, varroa: 2, celdas: 0, poblacion: 2, temperamento: 3 },
  'LS-05': { ultimaDias: 25, varroa: 1, celdas: 0, poblacion: 3, temperamento: 2 },
  'VD-01': { ultimaDias: 8, varroa: 3, celdas: 0, poblacion: 4, temperamento: 3 },
  'VD-02': { ultimaDias: 7, varroa: 1, celdas: 0, poblacion: 3, temperamento: 2 },
  'VD-03': { ultimaDias: 12, varroa: 2, celdas: 0, poblacion: 3, temperamento: 2 },
  'VD-04': null,
  'CC-01': { ultimaDias: 9, varroa: 2, celdas: 0, poblacion: 4, temperamento: 3 },
  'CC-02': { ultimaDias: 10, varroa: 5, celdas: 1, poblacion: 5, temperamento: 4 },
  'CC-03': null,
};

const TIPOS_MIEL = ['Multifloral', 'Mezquite', 'Azahar', 'Café', 'Aguacate', 'Flor de mezquite'];

async function main() {
  console.log('» Insertando datos de demostración...');

  const existentes = await query('SELECT id FROM usuarios WHERE email = ?', [EMAIL_DEMO]);
  if (existentes.length > 0) {
    console.log('⚠ El usuario demo ya existe; no se insertaron datos duplicados.');
    console.log('  Para regenerar: ejecuta "npm run db:setup" y luego "npm run db:seed".');
    await pool.end();
    return;
  }

  // 1) Usuario demo ---------------------------------------------------------
  const passwordHash = await bcrypt.hash('demo1234', 10);
  const usuarioRes = await query(
    'INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)',
    ['Apicultor Demo', EMAIL_DEMO, passwordHash, 'apicultor'],
  );
  const usuarioId = usuarioRes.insertId;
  console.log(`✔ Usuario demo creado (${EMAIL_DEMO} / demo1234)`);

  // 2) Apiarios -------------------------------------------------------------
  const apiarioIds = [];
  for (const a of APIARIOS) {
    const res = await query(
      `INSERT INTO apiarios (usuario_id, nombre, descripcion, lat, lng, municipio)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [usuarioId, a.nombre, a.descripcion, a.lat, a.lng, a.municipio],
    );
    apiarioIds.push(res.insertId);
  }
  console.log(`✔ ${APIARIOS.length} apiarios creados`);

  // 3) Colmenas + inspecciones + cosechas + tratamientos --------------------
  let totalInspecciones = 0;
  let totalCosechas = 0;
  let totalTratamientos = 0;

  for (let i = 0; i < COLMENAS.length; i += 1) {
    const col = COLMENAS[i];
    const colsRes = await query(
      `INSERT INTO colmenas (apiario_id, codigo, tipo, fecha_instalacion, estado, reina_marcada, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        apiarioIds[col.apiario],
        col.codigo,
        col.tipo,
        fechaISO(400 + i * 10),
        col.estado,
        col.reina_marcada,
        col.notas,
      ],
    );
    const colmenaId = colsRes.insertId;

    // Inspecciones: la más reciente con el perfil definido y dos anteriores normales.
    const perfil = PERFILES[col.codigo];
    if (perfil) {
      const visitas = [
        { dias: perfil.ultimaDias, varroa: perfil.varroa, celdas: perfil.celdas, poblacion: perfil.poblacion, temperamento: perfil.temperamento },
        { dias: perfil.ultimaDias + 35, varroa: Math.max(0, perfil.varroa - 2), celdas: 0, poblacion: Math.max(1, perfil.poblacion - 1), temperamento: perfil.temperamento },
        { dias: perfil.ultimaDias + 70, varroa: Math.max(0, perfil.varroa - 3), celdas: 0, poblacion: Math.max(1, perfil.poblacion - 1), temperamento: perfil.temperamento },
      ];
      for (const v of visitas) {
        await query(
          `INSERT INTO inspecciones
             (colmena_id, fecha, poblacion, temperamento, presencia_reina, celdas_reales,
              nivel_varroa, alimento_miel, alimento_polen, clima_temp, notas)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            colmenaId,
            fechaISO(v.dias),
            v.poblacion,
            v.temperamento,
            1,
            v.celdas,
            v.varroa,
            1,
            v.dias % 2 === 0 ? 1 : 0,
            18 + (i % 8),
            v.celdas ? 'Se observaron celdas reales, vigilar enjambrazón' : null,
          ],
        );
        totalInspecciones += 1;
      }
    }

    // Cosechas: solo colmenas activas, aproximadamente cada dos meses durante el último año.
    if (col.estado === 'activa') {
      for (let k = 0; k < 6; k += 1) {
        const kg = Number((6 + ((i + k) % 5) * 2.5 + (k % 2) * 1.3).toFixed(2));
        await query(
          `INSERT INTO cosechas (colmena_id, fecha, kg_miel, tipo_miel, humedad_pct, notas)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            colmenaId,
            fechaISO(15 + k * 60),
            kg,
            TIPOS_MIEL[(i + k) % TIPOS_MIEL.length],
            Number((17 + (k % 3) * 0.5).toFixed(1)),
            null,
          ],
        );
        totalCosechas += 1;
      }
    }

    // Tratamientos específicos para generar variedad (incluye uno o dos abiertos).
    if (col.codigo === 'VD-01') {
      await query(
        `INSERT INTO tratamientos (colmena_id, tipo, producto, dosis, fecha_inicio, fecha_fin, notas)
         VALUES (?, 'varroa', 'Ácido oxálico', '35 ml por colmena', ?, NULL, ?)`,
        [colmenaId, fechaISO(10), 'Tratamiento en curso'],
      );
      totalTratamientos += 1;
    }
    if (col.codigo === 'CC-02') {
      await query(
        `INSERT INTO tratamientos (colmena_id, tipo, producto, dosis, fecha_inicio, fecha_fin, notas)
         VALUES (?, 'varroa', 'Timol gel', '1 placa', ?, NULL, ?)`,
        [colmenaId, fechaISO(4), 'Varroa elevada, tratamiento en curso'],
      );
      totalTratamientos += 1;
    }
    if (col.codigo === 'LS-01') {
      await query(
        `INSERT INTO tratamientos (colmena_id, tipo, producto, dosis, fecha_inicio, fecha_fin, notas)
         VALUES (?, 'varroa', 'Apiguard', '1 placa', ?, ?, ?)`,
        [colmenaId, fechaISO(60), fechaISO(45), 'Tratamiento de otoño finalizado'],
      );
      totalTratamientos += 1;
    }
    if (col.codigo === 'LS-04') {
      await query(
        `INSERT INTO tratamientos (colmena_id, tipo, producto, dosis, fecha_inicio, fecha_fin, notas)
         VALUES (?, 'nosema', 'Fumagilina', '1 g por litro', ?, ?, ?)`,
        [colmenaId, fechaISO(40), fechaISO(35), 'Control de nosema finalizado'],
      );
      totalTratamientos += 1;
    }
  }

  console.log(`✔ ${COLMENAS.length} colmenas creadas`);
  console.log(`✔ ${totalInspecciones} inspecciones creadas`);
  console.log(`✔ ${totalCosechas} cosechas creadas`);
  console.log(`✔ ${totalTratamientos} tratamientos creados`);
  console.log('--------------------------------------------------');
  console.log('  Datos demo listos. Inicia sesión con:');
  console.log('    email:    demo@apiario.mx');
  console.log('    password: demo1234');
  console.log('--------------------------------------------------');

  await pool.end();
}

main().catch(async (err) => {
  console.error('✘ Error al insertar los datos demo:', err.message);
  try {
    await pool.end();
  } catch {
    /* ignore */
  }
  process.exitCode = 1;
});
