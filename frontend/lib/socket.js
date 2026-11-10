"use client";
import { io } from "socket.io-client";

let socket;
export function getSocket() {
  if (!socket) {
    socket = io("http://localhost:5000", { 
      transports: ["websocket"],
      withCredentials: true 
    });
  }
  return socket;
}