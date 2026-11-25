import { useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Centro por defecto: Ciudad de México.
export const CENTRO_CDMX = [19.4326, -99.1332];

// Icono personalizado (hexágono miel) para evitar depender de los assets
// por defecto de Leaflet, que suelen romperse con los bundlers.
const iconoApiario = L.divIcon({
  className: 'marcador-apiario',
  html:
    '<div style="background:#F2A93B;border:2px solid #2A2118;color:#2A2118;' +
    'width:26px;height:26px;border-radius:50%;display:grid;place-items:center;' +
    'font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.35)">🐝</div>',
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});

/** Ajusta la vista del mapa a las coordenadas disponibles. */
function AjustarVista({ puntos }) {
  const map = useMap();
  useEffect(() => {
    if (!puntos.length) return;
    if (puntos.length === 1) {
      map.setView(puntos[0], 13);
    } else {
      map.fitBounds(puntos, { padding: [40, 40], maxZoom: 14 });
    }
  }, [map, puntos]);
  return null;
}

/** Vuela hacia el apiario seleccionado (al hacer clic en un marcador/tarjeta). */
function VolarASeleccion({ seleccionado }) {
  const map = useMap();
  useEffect(() => {
    if (seleccionado) map.flyTo(seleccionado, 14, { duration: 0.6 });
  }, [map, seleccionado]);
  return null;
}

/**
 * Mapa Leaflet con un marcador por apiario que tenga coordenadas.
 * Al hacer clic en un marcador se notifica al padre (onSeleccionar).
 *
 * @param {object} props
 * @param {Array} props.apiarios
 * @param {number} [props.altura]
 * @param {[number,number]|null} [props.seleccionado] - coordenadas a enfocar
 * @param {(apiario:object)=>void} [props.onSeleccionar]
 */
export default function ApiarioMap({ apiarios = [], altura = 380, seleccionado = null, onSeleccionar }) {
  const puntos = useMemo(
    () =>
      apiarios
        .filter((a) => a.lat != null && a.lng != null)
        .map((a) => [Number(a.lat), Number(a.lng)]),
    [apiarios],
  );

  const centroInicial = puntos[0] || seleccionado || CENTRO_CDMX;

  const conCoordenadas = apiarios.filter((a) => a.lat != null && a.lng != null);

  return (
    <div className="mapa" style={{ height: altura }} aria-label="Mapa de apiarios">
      <MapContainer
        center={centroInicial}
        zoom={puntos.length ? 12 : 5}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AjustarVista puntos={puntos} />
        {seleccionado && <VolarASeleccion seleccionado={seleccionado} />}

        {conCoordenadas.map((a) => (
          <Marker
            key={a.id}
            position={[Number(a.lat), Number(a.lng)]}
            icon={iconoApiario}
            eventHandlers={{ click: () => onSeleccionar && onSeleccionar(a) }}
          >
            <Popup>
              <strong className="mapa-popup__titulo">{a.nombre}</strong>
              <br />
              {a.municipio && <span>{a.municipio}</span>}
              {a.total_colmenas != null && (
                <>
                  <br />
                  <span>{a.total_colmenas} colmenas</span>
                </>
              )}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
