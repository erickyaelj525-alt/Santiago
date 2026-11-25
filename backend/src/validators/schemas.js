/**
 * Esquemas de validación (Zod) reutilizables para toda la API.
 * Centraliza las reglas de entrada para que rutas y controladores compartan
 * una única fuente de verdad sobre qué datos son válidos y con qué rango.
 *
 * Convención: todos los mensajes de error están en español y los campos
 * opcionales aceptan "" / null (formularios HTML) sin romper la validación.
 */
import { z } from 'zod';

const MSG = {
  email: 'El correo electrónico no es válido',
  passwordCorta: 'La contraseña debe tener al menos 6 caracteres',
  fecha: 'La fecha debe tener el formato AAAA-MM-DD',
};

/**
 * Número opcional: convierte cadenas numéricas y "" / null en undefined,
 * de modo que un campo vacío no se convierta en 0 silenciosamente.
 */
const numeroOpcional = (min, max, msg) =>
  z.preprocess(
    (v) =>
      v === '' || v === null || v === undefined
        ? undefined
        : typeof v === 'string'
          ? Number(v)
          : v,
    z.number({ invalid_type_error: msg }).min(min, msg).max(max, msg).optional(),
  );

/** Entero obligatorio dentro de un rango [min, max]. */
const enteroRango = (min, max, msg) =>
  z.coerce.number({ invalid_type_error: msg }).int(msg).min(min, msg).max(max, msg);

/** Normaliza true/false/1/0/"1"/"0" a 0 o 1 (columnas TINYINT de MySQL). */
const booleano01 = z.preprocess(
  (v) => {
    if (v === true || v === 'true' || v === 1 || v === '1') return 1;
    if (v === false || v === 'false' || v === 0 || v === '0') return 0;
    return v;
  },
  z.union([z.literal(0), z.literal(1)], {
    errorMap: () => ({ message: 'Debe ser un valor de sí/no (0 o 1)' }),
  }),
);

/** Cadena de texto opcional con longitud máxima. */
const textoOpcional = (max, msg) => z.string().trim().max(max, msg).optional().nullable();

/** Fecha en formato AAAA-MM-DD (como lo espera MySQL y el frontend). */
const fechaSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, MSG.fecha);

/**
 * Coordenada obligatoria recibida por query string.
 * Acepta el texto numérico y reporta mensajes claros cuando falta o no es número.
 */
const coordenada = (nombre, min, max) =>
  z.preprocess(
    (v) => (v === undefined || v === '' ? undefined : Number(v)),
    z
      .number({
        required_error: `${nombre} es obligatorio`,
        invalid_type_error: `${nombre} debe ser un número`,
      })
      .min(min, `${nombre} está fuera de rango`)
      .max(max, `${nombre} está fuera de rango`),
  );

// ---------------------------------------------------------------------------
// Autenticación
// ---------------------------------------------------------------------------
/**
 * Registro público: SIEMPRE crea una cuenta de DUEÑO.
 * Las cuentas de trabajadores no se auto-registran: las crea el dueño
 * desde la sección "Equipo" (ver `trabajadorCrearSchema`).
 */
export const registroSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre es demasiado largo'),
  email: z.string().trim().toLowerCase().email(MSG.email).max(160, 'El correo es demasiado largo'),
  password: z.string().min(6, MSG.passwordCorta).max(72, 'La contraseña es demasiado larga'),
});

/** Verificación de la cuenta con el código enviado por correo. */
export const verificarSchema = z.object({
  email: z.string().trim().toLowerCase().email(MSG.email),
  codigo: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'El código debe tener 6 dígitos'),
});

/** Solicitar un nuevo código de verificación. */
export const reenviarCodigoSchema = z.object({
  email: z.string().trim().toLowerCase().email(MSG.email),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(MSG.email),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

/**
 * Cuenta de trabajador creada por el dueño.
 * Mismas reglas que el registro (nombre, correo válido y contraseña segura).
 */
export const trabajadorCrearSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre es demasiado largo'),
  email: z.string().trim().toLowerCase().email(MSG.email).max(160, 'El correo es demasiado largo'),
  password: z.string().min(6, MSG.passwordCorta).max(72, 'La contraseña es demasiado larga'),
});

// ---------------------------------------------------------------------------
// Apiarios
// ---------------------------------------------------------------------------
export const apiarioCrearSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(120, 'El nombre es demasiado largo'),
  descripcion: textoOpcional(255, 'La descripción es demasiado larga'),
  lat: numeroOpcional(-90, 90, 'La latitud debe estar entre -90 y 90'),
  lng: numeroOpcional(-180, 180, 'La longitud debe estar entre -180 y 180'),
  municipio: textoOpcional(120, 'El municipio es demasiado largo'),
});

export const apiarioActualizarSchema = apiarioCrearSchema.partial();

// ---------------------------------------------------------------------------
// Colmenas
// ---------------------------------------------------------------------------
const TIPOS_COLMENA = ['langstroth', 'top_bar', 'warre', 'otro'];
const ESTADOS_COLMENA = ['activa', 'débil', 'reina_nueva', 'vacía', 'enferma', 'muerta'];

export const colmenaCrearSchema = z.object({
  apiario_id: z.coerce
    .number({ invalid_type_error: 'El apiario es obligatorio' })
    .int('El apiario no es válido')
    .positive('El apiario es obligatorio'),
  codigo: z
    .string()
    .trim()
    .min(1, 'El código es obligatorio')
    .max(40, 'El código es demasiado largo'),
  tipo: z
    .enum(TIPOS_COLMENA, { errorMap: () => ({ message: 'Tipo de colmena no válido' }) })
    .default('langstroth'),
  fecha_instalacion: fechaSchema.optional().nullable(),
  estado: z
    .enum(ESTADOS_COLMENA, { errorMap: () => ({ message: 'Estado de colmena no válido' }) })
    .default('activa'),
  reina_marcada: booleano01.optional(),
  notas: textoOpcional(255, 'Las notas son demasiado largas'),
});

export const colmenaActualizarSchema = colmenaCrearSchema.partial();

// ---------------------------------------------------------------------------
// Inspecciones
// ---------------------------------------------------------------------------
export const inspeccionCrearSchema = z.object({
  colmena_id: z.coerce
    .number({ invalid_type_error: 'La colmena es obligatoria' })
    .int('La colmena no es válida')
    .positive('La colmena es obligatoria'),
  fecha: fechaSchema,
  poblacion: enteroRango(1, 5, 'La población debe estar entre 1 y 5'),
  temperamento: enteroRango(1, 5, 'El temperamento debe estar entre 1 y 5'),
  presencia_reina: booleano01,
  celdas_reales: booleano01,
  nivel_varroa: enteroRango(0, 5, 'El nivel de varroa debe estar entre 0 y 5'),
  alimento_miel: booleano01,
  alimento_polen: booleano01,
  clima_temp: numeroOpcional(-50, 60, 'La temperatura debe estar entre -50 y 60'),
  notas: textoOpcional(500, 'Las notas son demasiado largas'),
});

export const inspeccionActualizarSchema = inspeccionCrearSchema.partial();

// ---------------------------------------------------------------------------
// Cosechas
// ---------------------------------------------------------------------------
export const cosechaCrearSchema = z.object({
  colmena_id: z.coerce
    .number({ invalid_type_error: 'La colmena es obligatoria' })
    .int('La colmena no es válida')
    .positive('La colmena es obligatoria'),
  fecha: fechaSchema,
  kg_miel: z.coerce
    .number({ invalid_type_error: 'Los kilogramos son obligatorios' })
    .min(0, 'Los kilogramos no pueden ser negativos')
    .max(9999.99, 'Los kilogramos son demasiado altos'),
  tipo_miel: textoOpcional(80, 'El tipo de miel es demasiado largo'),
  humedad_pct: numeroOpcional(0, 100, 'La humedad debe estar entre 0 y 100'),
  notas: textoOpcional(255, 'Las notas son demasiado largas'),
});

export const cosechaActualizarSchema = cosechaCrearSchema.partial();

// ---------------------------------------------------------------------------
// Tratamientos
// ---------------------------------------------------------------------------
const TIPOS_TRATAMIENTO = ['varroa', 'nosema', 'loque', 'otro'];

export const tratamientoCrearSchema = z.object({
  colmena_id: z.coerce
    .number({ invalid_type_error: 'La colmena es obligatoria' })
    .int('La colmena no es válida')
    .positive('La colmena es obligatoria'),
  tipo: z
    .enum(TIPOS_TRATAMIENTO, { errorMap: () => ({ message: 'Tipo de tratamiento no válido' }) })
    .default('varroa'),
  producto: z
    .string()
    .trim()
    .min(1, 'El producto es obligatorio')
    .max(120, 'El producto es demasiado largo'),
  dosis: textoOpcional(80, 'La dosis es demasiado larga'),
  fecha_inicio: fechaSchema,
  fecha_fin: fechaSchema.optional().nullable(),
  notas: textoOpcional(255, 'Las notas son demasiado largas'),
});

export const tratamientoActualizarSchema = tratamientoCrearSchema.partial();

// ---------------------------------------------------------------------------
// Clima (parámetros de query string)
// ---------------------------------------------------------------------------
export const climaQuerySchema = z.object({
  lat: coordenada('lat', -90, 90),
  lng: coordenada('lng', -180, 180),
});
