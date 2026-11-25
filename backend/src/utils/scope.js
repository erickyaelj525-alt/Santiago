/**
 * Alcance de datos por rol.
 *
 * Los apiarios/colmenas pertenecen al DUEÑO de la operación. Un trabajador
 * no tiene datos propios: comparte los de su dueño. Por eso, para saber qué
 * filas puede ver o modificar un usuario, primero resolvemos su dueño.
 */

/**
 * Devuelve el id del dueño cuyos datos debe usar la petición.
 * - Si el usuario es trabajador -> el id de su dueño (req.user.duenoId).
 * - Si el usuario es dueño       -> su propio id.
 */
export function propietarioId(req) {
  return req.user.rol === 'trabajador' ? req.user.duenoId : req.user.id;
}

/** true si el usuario autenticado es el dueño de la operación. */
export const esDueno = (req) => req.user.rol === 'dueno';
