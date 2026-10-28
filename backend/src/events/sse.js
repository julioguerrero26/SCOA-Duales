/**
 * Sistema de Server-Sent Events (SSE) para SCOA.
 * Mantiene conexiones activas por usuario y permite publicar eventos segmentados.
 */

// Map de conexiones activas: userId -> Set de objetos response
const conexiones = new Map();

// Contador de eventos para Last-Event-ID
let eventIdCounter = 0;

/**
 * Registrar una nueva conexión SSE.
 */
export function registrarConexion(userId, res) {
  if (!conexiones.has(userId)) {
    conexiones.set(userId, new Set());
  }
  conexiones.get(userId).add(res);

  // Limpiar al desconectarse
  res.on('close', () => {
    const userConns = conexiones.get(userId);
    if (userConns) {
      userConns.delete(res);
      if (userConns.size === 0) {
        conexiones.delete(userId);
      }
    }
  });
}

/**
 * Publicar un evento a un usuario específico.
 */
export function publicarEvento(userId, tipo, datos) {
  const userConns = conexiones.get(userId);
  if (!userConns) return;

  eventIdCounter++;
  const eventData = JSON.stringify(datos);

  for (const res of userConns) {
    res.write(`id: ${eventIdCounter}\n`);
    res.write(`event: ${tipo}\n`);
    res.write(`data: ${eventData}\n\n`);
  }
}

/**
 * Publicar un evento a múltiples usuarios.
 */
export function publicarEventoMultiple(userIds, tipo, datos) {
  for (const userId of userIds) {
    publicarEvento(userId, tipo, datos);
  }
}

/**
 * Obtener número de conexiones activas.
 */
export function obtenerConexionesActivas() {
  let total = 0;
  for (const conns of conexiones.values()) {
    total += conns.size;
  }
  return total;
}
