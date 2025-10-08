import { Server, Socket } from "socket.io";
import { initializeBattle } from "./battle"; // ✅ startGame 이후 전투 초기화 로직을 별도 파일로 위임

interface Room {
  players: string[];
  ready: { [playerId: string]: boolean };
  hostId: string;
  gameState?: any;
}

export const rooms: { [roomCode: string]: Room } = {}; // ✅ 다른 모듈에서도 접근해야 하므로 export

const generateRoomCode = (): string => {
  let code: string;
  do {
    code = Math.random().toString(36).substr(2, 6).toUpperCase();
  } while (rooms[code]);
  return code;
};

export function setupRoomHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("🔌 클라이언트 연결됨:", socket.id);

    // ✅ 방 생성
    socket.on("createRoom", () => {
      const roomCode = generateRoomCode();
      rooms[roomCode] = {
        players: [socket.id],
        ready: { [socket.id]: false },
        hostId: socket.id,
      };
      socket.join(roomCode);
      console.log(`✅ 방 생성됨: ${roomCode}, 호스트: ${socket.id}`);

      socket.emit("roomCreated", { roomCode });
    });

    // ✅ 방 참여
    socket.on("joinRoom", (roomCode: string) => {
      console.log(`▶ joinRoom 수신 ${socket.id} -> ${roomCode}`);

      if (typeof roomCode !== "string") {
        socket.emit("error", "잘못된 방 코드 형식입니다.");
        return;
      }

      const room = rooms[roomCode];
      if (!room) {
        socket.emit("error", "방이 존재하지 않습니다.");
        return;
      }

      if (room.players.length >= 2 && !room.players.includes(socket.id)) {
        socket.emit("error", "방이 가득 찼습니다.");
        return;
      }

      if (!room.players.includes(socket.id)) {
        room.players.push(socket.id);
        room.ready[socket.id] = false;
        socket.join(roomCode);
        socket.to(roomCode).emit("opponentJoined");
      }

      socket.emit("roomJoined", {
        roomCode,
        isHost: socket.id === room.hostId,
      });

      console.log(`👤 ${socket.id} → 방 ${roomCode} 입장`);
    });

    // ✅ 준비 상태
    socket.on("playerReady", ({ roomCode, isReady }: { roomCode: string; isReady: boolean }) => {
      const room = rooms[roomCode];
      if (!room) return;

      room.ready[socket.id] = isReady;

      const allReady = room.players.map((id) => room.ready[id]);
      console.log(`💡 ${socket.id} 준비 상태: ${isReady}, 방: ${roomCode}, 전체 준비: ${allReady}`);
      socket.to(roomCode).emit("opponentReady", isReady);
    });

    // ✅ 게임 시작 (전투 초기화 호출)
    socket.on("startGame", ({ roomCode }: { roomCode: string }) => {
      const room = rooms[roomCode];
      console.log("◀ startGame 수신", socket.id, roomCode);

      if (!room) {
        socket.emit("error", "방이 존재하지 않습니다.");
        return;
      }

      if (socket.id !== room.hostId) {
        socket.emit("error", "방장만 시작할 수 있습니다.");
        return;
      }

      if (room.players.length !== 2) {
        socket.emit("error", "플레이어가 2명 있어야 시작할 수 있습니다.");
        return;
      }

      const allReady = room.players.length === 2 && Object.values(room.ready).every(Boolean);
      if (!allReady) {
        socket.emit("error", "모든 플레이어가 준비 완료 상태여야 시작할 수 있습니다.");
        return;
      }

      // ✅ 전투 모듈에서 게임 상태 초기화 및 이벤트 전송 담당
      initializeBattle(io, roomCode, room);
    });

    // ✅ 연결 해제 처리
    socket.on("disconnecting", () => {
      for (const roomCode in rooms) {
        const room = rooms[roomCode];
        const idx = room.players.indexOf(socket.id);

        if (idx !== -1) {
          room.players.splice(idx, 1);
          delete room.ready[socket.id];
          delete room.gameState;

          socket.to(roomCode).emit("opponentLeft");

          if (room.players.length === 0) {
            delete rooms[roomCode];
          } else if (room.hostId === socket.id) {
            room.hostId = room.players[0];
            io.to(roomCode).emit("newHost", room.hostId);
          }
          break;
        }
      }
    });
  });
}
