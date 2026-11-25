import useFetch from '../hooks/useFetch.js';
import Loader from './Loader.jsx';
import Badge from './Badge.jsx';
import { formatearFecha } from '../utils/format.js';

/** Coordenadas por defecto: Ciudad de México. */
const DEFECTO = { lat: 19.4326, lng: -99.1332 };

/** Emoji aproximado según el código WMO que devuelve Open-Meteo. */
function emojiClima(codigo) {
  if (codigo == null) return '🌤️';
  if (codigo === 0) return '☀️';
  if (codigo <= 2) return '🌤️';
  if (codigo === 3) return '☁️';
  if (codigo === 45 || codigo === 48) return '🌫️';
  if (codigo >= 51 && codigo <= 57) return '🌦️';
  if (codigo >= 61 && codigo <= 67) return '🌧️';
  if (codigo >= 71 && codigo <= 77) return '❄️';
  if (codigo >= 80 && codigo <= 82) return '🌧️';
  if (codigo >= 95) return '⛈️';
  return '🌤️';
}

const textoAptitud = {
  optimo: { etiqueta: 'Óptimo para inspeccionar', variante: 'ok' },
  precaucion: { etiqueta: 'Precaución', variante: 'alerta' },
  no_recomendado: { etiqueta: 'No recomendado', variante: 'peligro' },
};

/**
 * Widget de clima (consume GET /clima — API externa Open-Meteo vía backend).
 * Indica si el clima es apto para inspeccionar colmenas.
 *
 * @param {object} props
 * @param {number} [props.lat]
 * @param {number} [props.lng]
 * @param {string} [props.ubicacionNombre]
 */
export default function WeatherWidget({ lat, lng, ubicacionNombre }) {
  const usarLat = lat ?? DEFECTO.lat;
  const usarLng = lng ?? DEFECTO.lng;
  const ruta = `/clima?lat=${usarLat}&lng=${usarLng}`;

  const { datos, cargando, error } = useFetch(ruta);

  if (cargando) return <Loader mensaje="Consultando el clima…" />;

  if (error) {
    return (
      <div className="aviso aviso--error" role="alert">
        No se pudo obtener el clima: {error.message}
      </div>
    );
  }

  if (!datos) return null;

  const { actual, aptitud, pronostico } = datos;
  const info = textoAptitud[aptitud?.nivel] || { etiqueta: aptitud?.nivel, variante: 'neutro' };

  return (
    <div className="pila">
      <div className="clima__actual">
        <span style={{ fontSize: '3rem' }} aria-hidden="true">{emojiClima(actual.codigo)}</span>
        <div>
          <div className="clima__temp">{Math.round(actual.temp)}°C</div>
          <div className="texto-suave texto-pequeno">{actual.descripcion}</div>
          {ubicacionNombre && <div className="texto-pequeno">{ubicacionNombre}</div>}
        </div>
      </div>

      <div className="fila fila--wrap">
        <span className="clima__chip">💧 {actual.humedad}% humedad</span>
        <span className="clima__chip">🌬️ {actual.viento} km/h</span>
        <span className="clima__chip">🌧️ {actual.precipitacion} mm</span>
      </div>

      <div className={`aptitud aptitud--${aptitud?.nivel}`} role="status">
        <Badge variante={info.variante}>{info.etiqueta}</Badge>
        <span style={{ marginLeft: '0.6rem' }}>{aptitud?.mensaje}</span>
      </div>

      {pronostico?.length > 0 && (
        <div>
          <h4 className="texto-pequeno texto-suave" style={{ marginBottom: '0.4rem' }}>
            Pronóstico 5 días
          </h4>
          <div className="clima__pronostico">
            {pronostico.map((d) => (
              <div className="clima__dia" key={d.fecha}>
                <div className="texto-pequeno texto-suave">{formatearFecha(d.fecha)}</div>
                <div style={{ fontSize: '1.5rem' }} aria-hidden="true">{emojiClima(d.codigo)}</div>
                <div className="texto-pequeno">
                  <strong>{Math.round(d.temp_max)}°</strong> / {Math.round(d.temp_min)}°
                </div>
                <div className="texto-pequeno texto-suave" title={d.descripcion}>
                  {d.precipitacion > 0 ? `🌧️ ${d.precipitacion}mm` : '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
