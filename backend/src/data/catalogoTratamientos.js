/**
 * Catálogo de referencia de sanidad apícola: tratamientos de las principales
 * plagas y enfermedades de la colmena, más los cuidados base para mantenerlas
 * sanas. Es información de apoyo (no sustituye la asesoría de un veterinario
 * ni la etiqueta del producto).
 *
 * El campo `tipo` usa el mismo ENUM que la tabla `tratamientos`
 * ('varroa' | 'nosema' | 'loque' | 'otro') para poder precargar el formulario.
 *
 * IMPORTANTE (México): verifica que el producto esté autorizado por SENASICA/
 * COFEPRIS y respeta los tiempos de retiro antes de cosechar miel.
 */

export const CATALOGO_TRATAMIENTOS = [
  // ------------------------------- VARROA --------------------------------
  {
    id: 'varroa-acido-oxalico',
    tipo: 'varroa',
    problema: 'Varroa (ácaro Varroa destructor)',
    producto: 'Ácido oxálico',
    principioActivo: 'Ácido oxálico dihidratado',
    dosis: 'Goteo: ~5 ml por colmena (solución al 3.5%). Vaporización: ~2 g por colmena.',
    cuando: 'Otoño/invierno o cuando NO haya cría operculada. Máximo 3–4 aplicaciones al año.',
    precauciones:
      'No aplicar con temperaturas mayores a 25 °C ni con cría operculada. Usa equipo de protección (guantes, lentes, mascarilla).',
  },
  {
    id: 'varroa-acido-formico',
    tipo: 'varroa',
    problema: 'Varroa (ácaro Varroa destructor)',
    producto: 'Ácido fórmico (tiras tipo MAQS)',
    principioActivo: 'Ácido fórmico',
    dosis: '1–2 tiras por colmena según la fuerza de la colonia, siguiendo la etiqueta.',
    cuando: 'Primavera/verano con temperaturas entre 15 y 30 °C. Penetra la cría operculada.',
    precauciones:
      'Muy corrosivo: evita contacto con piel y ojos. No usar en temperaturas extremas; puede matar cría abierta.',
  },
  {
    id: 'varroa-timol',
    tipo: 'varroa',
    problema: 'Varroa (ácaro Varroa destructor)',
    producto: 'Timol (gel o tiras)',
    principioActivo: 'Timol',
    dosis: '1 aplicación de 50 g sobre los cuadros; repetir a las 2 semanas según etiqueta.',
    cuando: 'Temperaturas superiores a 15 °C. Alternar con otros principios para evitar resistencia.',
    precauciones:
      'Evita aplicar durante la mielada (deja olor en la miel). No usar con temperaturas bajas.',
  },
  {
    id: 'varroa-amitraz',
    tipo: 'varroa',
    problema: 'Varroa (ácaro Varroa destructor)',
    producto: 'Tiras de amitraz',
    principioActivo: 'Amitraz',
    dosis: '2 tiras por cada 10 cuadros cubiertos por abejas, de 6 a 10 semanas.',
    cuando: 'Preferentemente sin alzas de miel. Rota este principio con los orgánicos.',
    precauciones:
      'Evita su uso durante la producción de miel. La varroa puede desarrollar resistencia: no encadenar aplicaciones.',
  },
  {
    id: 'varroa-monitoreo',
    tipo: 'varroa',
    problema: 'Varroa (ácaro Varroa destructor)',
    producto: 'Monitoreo: lavado con alcohol o azúcar glas',
    principioActivo: '—',
    dosis: 'Muestra de ~300 abejas; tratar cuando supere 3 ácaros por 100 abejas.',
    cuando: 'Cada 1–2 meses y antes/después de cada tratamiento.',
    precauciones:
      'Es la base del control: sin monitoreo no sabes si necesitas tratar ni si el tratamiento funcionó.',
  },

  // ------------------------------- NOSEMA --------------------------------
  {
    id: 'nosema-fumagilina',
    tipo: 'nosema',
    problema: 'Nosemosis (Nosema apis / N. ceranae)',
    producto: 'Fumagilina (Fumidil‑B) donde esté autorizada',
    principioActivo: 'Fumagilina B',
    dosis: 'En jarabe según etiqueta; suele requerir varios ciclos.',
    cuando: 'Ante diarrea, colonias débiles o después de temporadas húmedas/frías.',
    precauciones:
      'No está autorizada en muchos países. Prioriza medidas de manejo; consulta a la autoridad sanitaria local.',
  },
  {
    id: 'nosema-manejo',
    tipo: 'nosema',
    problema: 'Nosemosis (Nosema apis / N. ceranae)',
    producto: 'Manejo: renovar reina y mejorar la colmena',
    principioActivo: '—',
    dosis: 'Sustituir la reina, reducir humedad y renovar marcos viejos.',
    cuando: 'Combinar con el tratamiento; es clave para cortar el ciclo.',
    precauciones:
      'Desinfecta material y evita mezclar cuadros de colmenas enfermas con colmenas sanas.',
  },

  // -------------------------------- LOQUE --------------------------------
  {
    id: 'loque-americana',
    tipo: 'loque',
    problema: 'Loque americana (Paenibacillus larvae)',
    producto: 'Cuarentena + renovación de cera (y oxitetraciclina solo si está autorizada)',
    principioActivo: 'Oxitetraciclina (uso restringido)',
    dosis: 'Uso restringido: solo con prescripción y nunca durante la mielada.',
    cuando: 'Ante larvas muertas color café y olor fétido. Aísla la colmena de inmediato.',
    precauciones:
      'Las esporas duran años: quema marcos afectados, no intercambies material y desinfecta herramientas.',
  },
  {
    id: 'loque-europea',
    tipo: 'loque',
    problema: 'Loque europea (Melissococcus plutonius)',
    producto: 'Renovación de reina y manejo del estrés',
    principioActivo: '—',
    dosis: 'Sustituir la reina y reforzar la colonia; retirar cuadros muy afectados.',
    cuando: 'Colonias débiles o tras estrés por clima/alimento.',
    precauciones:
      'Mejora ventilación y alimento; evita el trasiego de cuadros entre colmenas.',
  },

  // ------------------------------ OTRAS PLAGAS ---------------------------
  {
    id: 'polilla-cera',
    tipo: 'otro',
    problema: 'Polilla de la cera (Galleria mellonella)',
    producto: 'Bacillus thuringiensis var. aizawai (para cera almacenada)',
    principioActivo: 'Bacillus thuringiensis',
    dosis: 'Aplicar en marcos/cuadros almacenados según etiqueta.',
    cuando: 'Al guardar alzas y cuadros fuera de temporada.',
    precauciones:
      'Almacena con buena ventilación y luz, en lugar seco, y congela marcos 24–48 h para eliminar huevos y larvas.',
  },
  {
    id: 'escarabajo-colmena',
    tipo: 'otro',
    problema: 'Pequeño escarabajo de la colmena (Aethina tumida)',
    producto: 'Trampas para escarabajo + manejo sanitario',
    principioActivo: '—',
    dosis: 'Instalar trampas en el piso y mantener limpio el fondo de la colmena.',
    cuando: 'Zonas cálidas y húmedas; revisa los fondos con frecuencia.',
    precauciones:
      'No dejes cuadros de miel sin abejas (atrae al escarabajo). Mantén colonias fuertes.',
  },
  {
    id: 'hormigas',
    tipo: 'otro',
    problema: 'Hormigas y otros invasores (arañas, comejen)',
    producto: 'Barreras físicas en las bases del apiario',
    principioActivo: '—',
    dosis: 'Coloca las bases sobre horquillas con aceite/mineral o grasa para aislar.',
    cuando: 'De forma preventiva todo el año, con más énfasis en temporada cálida.',
    precauciones:
      'Evita insecticidas cerca de las colmenas: matan a las abejas. Mantén la vegetación despejada.',
  },
];

/**
 * Cuidados base para mantener las colmenas sanas (prevención).
 * No son tratamientos puntuales, sino hábitos de manejo.
 */
export const CUIDADOS_BASE = [
  {
    id: 'alimentacion',
    titulo: 'Alimentación adecuada',
    detalle:
      'Jarabe 1:1 (azúcar:agua) para estímulo en primavera y 2:1 para reservas en otoño. Ofrece sustituto de polen cuando escasee.',
  },
  {
    id: 'agua',
    titulo: 'Agua limpia y sombra',
    detalle:
      'Fuente de agua cercana y confiable, y sombra parcial en verano para evitar el estrés por calor.',
  },
  {
    id: 'monitoreo-varroa',
    titulo: 'Monitorear la varroa',
    detalle:
      'Lavado con alcohol o azúcar glas cada 1–2 meses. Tratar si supera ~3 ácaros por 100 abejas.',
  },
  {
    id: 'renovacion-reina',
    titulo: 'Renovar reinas',
    detalle:
      'Sustituir la reina cada 1–2 años (o antes si baja la postura) para mantener colonias vigorosas.',
  },
  {
    id: 'inspecciones',
    titulo: 'Inspecciones periódicas',
    detalle:
      'Revisar cada 7–14 días: postura, alimento, sanidad y espacio. Registra todo en Apiario Digital.',
  },
  {
    id: 'ventilacion',
    titulo: 'Ventilación y espacio',
    detalle:
      'Asegura ventilación y espacio suficiente; evita la sobrepoblación y la humedad dentro de la colmena.',
  },
  {
    id: 'cera-marcos',
    titulo: 'Buen manejo de cera y marcos',
    detalle:
      'Renueva cera oscura, guarda marcos protegidos de la polilla y no intercambies material entre apiarios.',
  },
  {
    id: 'apiario-limpio',
    titulo: 'Apiario limpio y sin insecticidas',
    detalle:
      'Mantén despejado el entorno y evita el uso de pesticidas agrícolas cerca de las colmenas.',
  },
];
