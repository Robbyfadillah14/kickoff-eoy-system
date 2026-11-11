"use client";
import { io } from "socket.io-client";

let socket = null;

export function getSocket() {
  // Jika di Vercel / Production dan tidak ada backend terpisah, 
  // kembalikan objek dummy/null agar tidak memicu error koneksi wss://
  if (process.env.NODE_ENV === "production" && !process.env.NEXT_PUBLIC_WS_URL) {
    return {
      on: () => {},
      off: () => {},
      emit: () => {},
      connected: false,
    };
  }

  if (!socket) {
    const SOCKET_URL = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";

    socket = io(SOCKET_URL, {
      transports: ["websocket", "polling"],
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
}