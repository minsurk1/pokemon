import { Server, Socket } from "socket.io";

// 게임 상태 타입
interface GameState {
  currentTurn: string;
  cardsPlayed: { [playerId: string]: any | null };
}

// 방 타입
interface Room {
  players: string[];
  ready: { [playerId: string]: boolean };
  gameState?: GameState;
}

// 전체 방 저장소
const rooms: { [roomCode: string]: Room } = {};

// 방 코드 생성
const generateRoomCode = (): string => {
  let code: string;
  do {
    code = Math.random().toString(36).substr(2, 6).toUpperCase();
  } while (rooms[code]);
  return code;
};

// 메인 소켓 설정 함수
export function setupRoomHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("🔌 클라이언트 연결됨:", socket.id);

    // 방 생성
    socket.on("createRoom", () => {
      const roomCode = generateRoomCode();
      rooms[roomCode] = { players: [], ready: {} };
      console.log(`✅ 방 생성됨: ${roomCode}`);
      socket.emit("roomCreated", roomCode);
    });

    // 방 참여
    socket.on("joinRoom", (roomCode: string) => {
      const room = rooms[roomCode];

      if (!room) {
        socket.emit("error", "방이 존재하지 않습니다.");
        return;
      }

      if (room.players.length >= 2) {
        socket.emit("error", "방이 가득 찼습니다.");
        return;
      }

      socket.join(roomCode);
      room.players.push(socket.id);
      room.ready[socket.id] = false;
      socket.emit("roomJoined", roomCode);

      console.log(`👤 ${socket.id} → 방 ${roomCode} 입장`);

      if (room.players.length === 2) {
        socket.to(roomCode).emit("opponentJoined");
      }
    });

    // 준비 완료 처리
    socket.on(
      "playerReady",
      ({ roomCode, isReady }: { roomCode: string; isReady: boolean }) => {
        const room = rooms[roomCode];
        if (!room) return;

        room.ready[socket.id] = isReady;
        socket.to(roomCode).emit("opponentReady", isReady);

        const allReady = Object.values(room.ready).every(Boolean);
        if (allReady && room.players.length === 2) {
          room.gameState = {
            currentTurn: room.players[0],
            cardsPlayed: {},
          };

          io.to(roomCode).emit("gameStart", {
            currentTurn: room.gameState.currentTurn,
          });

          console.log(
            `🎮 게임 시작! 방: ${roomCode}, 첫 턴: ${room.gameState.currentTurn}`
          );
        }
      }
    );

    // 카드 플레이
    socket.on("playCard", ({ roomCode, card }) => {
      const room = rooms[roomCode];
      if (!room) {
        socket.emit("error", "해당 방이 존재하지 않습니다.");
        return;
      }

      if (!room.gameState) {
        room.gameState = {
          currentTurn: room.players[0],
          cardsPlayed: {},
        };
      }

      if (room.gameState.currentTurn !== socket.id) {
        socket.emit("error", "지금은 당신의 턴이 아닙니다.");
        return;
      }

      room.gameState.cardsPlayed[socket.id] = card;
      socket.to(roomCode).emit("opponentPlayCard", card);

      console.log(`🃏 ${socket.id} → 카드 플레이:`, card);
    });

    // 턴 종료
    socket.on("endTurn", ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room || !room.gameState) {
        socket.emit("error", "게임이 시작되지 않았거나 방이 없습니다.");
        return;
      }

      if (room.gameState.currentTurn !== socket.id) {
        socket.emit("error", "지금은 당신의 턴이 아닙니다.");
        return;
      }

      const currentIndex = room.players.indexOf(socket.id);
      const nextIndex = (currentIndex + 1) % 2;
      const nextPlayer = room.players[nextIndex];
      room.gameState.currentTurn = nextPlayer;
      room.gameState.cardsPlayed = {};

      io.to(roomCode).emit("turnChanged", nextPlayer);
      console.log(`🔄 턴 변경: ${socket.id} → ${nextPlayer}`);
    });

    // 연결 해제
    socket.on("disconnect", () => {
      console.log(`❌ 연결 종료: ${socket.id}`);

      for (const roomCode in rooms) {
        const room = rooms[roomCode];
        const idx = room.players.indexOf(socket.id);

        if (idx !== -1) {
          room.players.splice(idx, 1);
          delete room.ready[socket.id];
          delete room.gameState;

          socket.to(roomCode).emit("opponentLeft");
          console.log(`🚪 ${socket.id} → 방 ${roomCode} 퇴장`);

          if (room.players.length === 0) {
            delete rooms[roomCode];
            console.log(`🗑 방 ${roomCode} 삭제됨`);
          }

          break;
        }
      }
    });
  });
}
