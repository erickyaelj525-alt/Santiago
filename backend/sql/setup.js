/**
 * Script de creación de la base de datos (npm run db:setup).
 * Se conecta a MySQL SIN seleccionar base de datos, lee schema.sql y lo ejecuta
 * completo (DROP/CREATE DATABASE + tablas) usando multipleStatements.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.join(__dirname, 'schema.sql');

async function main() {
  console.log('» Configurando Apiario Digital...');

  if (!fs.existsSync(schemaPath)) {
    console.error(`✘ No se encontró el archivo de esquema: ${schemaPath}`);
    process.exit(1);
  }

  const sql = fs.readFileSync(schemaPath, 'utf8');

  let conexion;
  try {
    // Conexión sin `database`: el propio schema.sql hace CREATE DATABASE y USE.
    conexion = await mysql.createConnection({
      host: env.db.host,
      port: env.db.port,
      user: env.db.user,
      password: env.db.password,
      multipleStatements: true,
    });
  } catch (err) {
    console.error(`✘ No se pudo conectar a MySQL en ${env.db.host}:${env.db.port}`);
    console.error(`  Detalle: ${err.message}`);
    console.error('  Verifica que MySQL/MariaDB de XAMPP esté iniciado.');
    process.exit(1);
  }

  try {
    await conexion.query(sql);
    console.log(`✔ Base de datos "${env.db.name}" creada y esquema aplicado correctamente.`);
    console.log('  Siguiente paso: npm run db:seed');
  } catch (err) {
    console.error('✘ Error al ejecutar schema.sql:');
    console.error(`  ${err.message}`);
    process.exitCode = 1;
  } finally {
    await conexion.end();
  }
}

main();
