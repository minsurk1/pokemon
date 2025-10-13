import { Server } from "socket.io";
import roomHandler from "./room";
import battleHandler from "./battle";

export function setupSocketHandlers(io: Server) {
  io.on("connection", (socket) => {
    console.log("🔌 새 소켓 연결:", socket.id);
    roomHandler(io, socket);   // ✅ 방 생성 및 대기실 로직
    battleHandler(io, socket); // ✅ 배틀 로직
  });
}
