/**
 * Integración con la API externa Open-Meteo (sin API key).
 * https://open-meteo.com
 *
 * Se usa porque la actividad apícola depende del clima: con frío, lluvia
 * o viento las abejas no salen a pecorear y no conviene abrir la colmena.
 */
import { HttpError } from './httpError.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';

/** Códigos WMO -> descripción en español. */
const WMO = {
  0: 'Cielo despejado', 1: 'Mayormente despejado', 2: 'Parcialmente nublado',
  3: 'Nublado', 45: 'Niebla', 48: 'Niebla con escarcha', 51: 'Llovizna ligera',
  53: 'Llovizna moderada', 55: 'Llovizna intensa', 61: 'Lluvia ligera',
  63: 'Lluvia moderada', 65: 'Lluvia fuerte', 71: 'Nieve ligera',
  73: 'Nieve moderada', 75: 'Nieve fuerte', 80: 'Chubascos ligeros',
  81: 'Chubascos moderados', 82: 'Chubascos violentos', 95: 'Tormenta',
  96: 'Tormenta con granizo', 99: 'Tormenta fuerte con granizo',
};

const describe = (code) => WMO[code] || 'Condición desconocida';

/**
 * Evalúa si el clima es apto para inspeccionar colmenas.
 * Regla apícola: temperatura >= 15 °C, sin lluvia y viento moderado.
 */
function evaluarAptitud({ temp, precip, viento }) {
  if (precip > 0.2) {
    return { nivel: 'no_recomendado', mensaje: 'Hay precipitación: las abejas están resguardadas y se irritan al abrir la colmena.' };
  }
  if (temp < 15) {
    return { nivel: 'no_recomendado', mensaje: 'Temperatura por debajo de 15 °C: la cría se enfría y el pecoreo es nulo.' };
  }
  if (viento > 25) {
    return { nivel: 'precaucion', mensaje: 'Viento fuerte: abre la colmena poco tiempo y con humo suficiente.' };
  }
  if (temp >= 20 && temp <= 33 && viento <= 15) {
    return { nivel: 'optimo', mensaje: 'Condiciones óptimas para revisar y cosechar.' };
  }
  return { nivel: 'precaucion', mensaje: 'Condiciones aceptables, revisa rápido y sin excederte.' };
}

/**
 * Obtiene el clima actual y el pronóstico de 5 días para unas coordenadas.
 * @param {number} lat
 * @param {number} lng
 */
export async function getClima(lat, lng) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code',
    daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,weather_code',
    timezone: 'auto',
    forecast_days: '5',
  });

  let data;
  try {
    const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
    if (!res.ok) throw new Error(`Open-Meteo respondió ${res.status}`);
    data = await res.json();
  } catch (err) {
    throw new HttpError(502, 'No se pudo consultar el servicio de clima (Open-Meteo)', err.message);
  }

  const c = data.current;
  const actual = {
    temp: c.temperature_2m,
    humedad: c.relative_humidity_2m,
    precipitacion: c.precipitation,
    viento: c.wind_speed_10m,
    codigo: c.weather_code,
    descripcion: describe(c.weather_code),
  };

  const d = data.daily;
  const pronostico = d.time.map((fecha, i) => ({
    fecha,
    temp_max: d.temperature_2m_max[i],
    temp_min: d.temperature_2m_min[i],
    precipitacion: d.precipitation_sum[i],
    viento_max: d.wind_speed_10m_max[i],
    codigo: d.weather_code[i],
    descripcion: describe(d.weather_code[i]),
  }));

  return {
    ubicacion: { lat: data.latitude, lng: data.longitude, zona: data.timezone },
    actual,
    aptitud: evaluarAptitud(actual),
    pronostico,
  };
}
