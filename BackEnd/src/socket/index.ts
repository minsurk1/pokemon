import { Server } from "socket.io";
import { setupRoomHandlers } from "./room";
import { setupBattleHandlers } from "./battle";

export function setupSocketHandlers(io: Server) {
  setupRoomHandlers(io);
  setupBattleHandlers(io);
}
