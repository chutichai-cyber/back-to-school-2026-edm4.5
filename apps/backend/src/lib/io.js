/**
 * Module-level Socket.IO singleton.
 * Set once in index.js after the SocketIO server is created,
 * then imported by routes that need to broadcast state changes.
 */
let _io = null

export function setIO(io) {
  _io = io
}

export function getIO() {
  return _io
}
