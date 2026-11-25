/**
 * Pool de conexiones a MySQL/MariaDB usando mysql2/promise.
 * Se usa un pool para reutilizar conexiones y usar consultas preparadas.
 */
import mysql from 'mysql2/promise';
import { env } from './env.js';

export const pool = mysql.createPool({
  host: env.db.host,
  port: env.db.port,
  user: env.db.user,
  password: env.db.password,
  database: env.db.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // Devolver los DECIMAL como número para simplificar el frontend.
  decimalNumbers: true,
});

/**
 * Ejecuta una consulta preparada.
 * @param {string} sql  Sentencia con marcadores "?"
 * @param {Array}  params Valores a escapar (previene inyección SQL)
 */
export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

/** Comprueba que la base de datos responde. Devuelve true/false. */
export async function checkConnection() {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch (err) {
    return false;
  }
}
