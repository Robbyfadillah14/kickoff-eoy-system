// Socket.io: broadcast event real-time (approval, revisi, update laporan)
// supaya presentation mode & dashboard manager ter-update tanpa refresh/delay.
function initSockets(io) {
  io.on("connection", (socket) => {
    socket.on("join_room", (room) => socket.join(room)); // room = `plant:<id>` atau `year:<n>`
    socket.on("disconnect", () => {});
  });
}

// Dipanggil dari controller setelah aksi penting terjadi
function emitReportEvent(io, eventName, payload) {
  io.emit(eventName, payload); // simple broadcast; bisa dipersempit ke room tertentu
}

module.exports = { initSockets, emitReportEvent };
