/**
 * Carga y centraliza las variables de entorno del backend.
 * Uso: importar `env` en lugar de leer process.env disperso por el código.
 */
import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'apiario_digital',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'secreto_de_desarrollo',
    expires: process.env.JWT_EXPIRES || '8h',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
};
