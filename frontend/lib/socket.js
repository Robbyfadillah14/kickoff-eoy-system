"use client";
import { io } from "socket.io-client";

let socket;
export function getSocket() {
  if (!socket) {
    // Jika di production (Vercel), gunakan domain saat ini atau kosongkan, 
    // jika di lokal, arahkan ke http://localhost:5000
    const SOCKET_URL = process.env.NODE_ENV === "production" 
      ? "" 
      : "http://localhost:5000";

    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"], // Ditambah polling agar lebih stabil
      withCredentials: true,
    });
  }
  return socket;
}