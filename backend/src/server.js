/**
 * Punto de entrada del servidor. Levanta Express y verifica la BD.
 */
import { createApp } from './app.js';
import { env } from './config/env.js';
import { checkConnection } from './config/db.js';

const app = createApp();

app.listen(env.port, async () => {
  const ok = await checkConnection();
  console.log('--------------------------------------------------');
  console.log(`  Apiario Digital API escuchando en http://localhost:${env.port}`);
  console.log(`  Base de datos: ${ok ? 'CONECTADA ✔' : 'NO disponible ✘ (revisa XAMPP/MySQL)'}`);
  console.log('--------------------------------------------------');
});
