import { rooms } from "../socket/room"; // 방 관리 파일
import type { RoomInfo } from "../types/gameTypes";

const CLEAN_INTERVAL = 30 * 1000; // 30초마다 정리
const EMPTY_ROOM_TIMEOUT = 10 * 1000; // 🔥 10초 동안 플레이어 0명 → 삭제
const WAITING_TOO_LONG_TIMEOUT = 2 * 60 * 1000; // 2분
const GAME_END_TIMEOUT = 2 * 60 * 1000; // 2분

export function startRoomCleaner() {
  setInterval(() => {
    const now = Date.now();

    for (const roomCode in rooms) {
      const room: RoomInfo = rooms[roomCode];

      // ✅ 1) 플레이어가 0명 → 즉시 삭제 (유령방)
      if (room.players.length === 0) {
        delete rooms[roomCode];
        continue;
      }

      // ✅ 2) 1명만 남고 오래 기다림 → 삭제
      if (room.players.length === 1) {
        if (now - room.lastActivity > WAITING_TOO_LONG_TIMEOUT) {
          delete rooms[roomCode];
          continue;
        }
      }

      // ✅ 3) 게임이 끝났고 오래 유지되면 삭제
      if (!room.inGame) {
        if (now - room.lastActivity > GAME_END_TIMEOUT) {
          delete rooms[roomCode];
          continue;
        }
      }
    }
  }, CLEAN_INTERVAL);

  console.log("✅ 방 정리 로직 활성화됨.");
}
