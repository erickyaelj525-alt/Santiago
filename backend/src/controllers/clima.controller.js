/**
 * Controlador de clima.
 * Recibe lat/lng por query string (ya validados como números por el esquema zod),
 * consulta Open-Meteo mediante getClima() y reenvía el resultado al cliente.
 */
import { getClima } from '../utils/weather.js';

/** GET /api/clima?lat=..&lng=.. */
export async function get(req, res, next) {
  try {
    const { lat, lng } = req.query;
    const datos = await getClima(lat, lng);
    res.json(datos);
  } catch (err) {
    next(err);
  }
}
