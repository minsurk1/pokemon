import { Server, Socket } from "socket.io";

interface GameState {
  currentTurn: string;
  cardsPlayed: { [playerId: string]: any | null };
}

interface Room {
  players: string[];
  ready: { [playerId: string]: boolean };
  hostId: string;
  gameState?: GameState;
}

const rooms: { [roomCode: string]: Room } = {};

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

    // 방 생성
    socket.on("createRoom", () => {
      const roomCode = generateRoomCode();
      rooms[roomCode] = {
        players: [socket.id],
        ready: { [socket.id]: false },
        hostId: socket.id,
      };
      socket.join(roomCode);
      console.log(`✅ 방 생성됨: ${roomCode}, 호스트: ${socket.id}`);

      // 객체로 전달
      socket.emit("roomCreated", { roomCode });
    });

    // 방 참여
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

      if (!room.players.includes(socket.id)) {
        if (room.players.length >= 2) {
          socket.emit("error", "방이 가득 찼습니다.");
          return;
        }
        socket.join(roomCode);
        room.players.push(socket.id);
        room.ready[socket.id] = false;
        socket.to(roomCode).emit("opponentJoined");
      }

      socket.join(roomCode);
      room.players.push(socket.id);
      room.ready[socket.id] = false;

      socket.emit("roomJoined", { roomCode, isHost: socket.id === room.hostId });
      console.log(`👤 ${socket.id} → 방 ${roomCode} 입장`);
    });

    // 준비 상태 처리
    socket.on("playerReady", ({ roomCode, isReady }: { roomCode: string; isReady: boolean }) => {
      const room = rooms[roomCode];
      if (!room) return;

      room.ready[socket.id] = isReady;

      // 상대방에게 준비 상태 전달
      const allReady = room.players.map(id => room.ready[id]);
      console.log(`💡 ${socket.id} 준비 상태: ${isReady}, 방: ${roomCode}, 전체 준비: ${allReady}`);
      socket.to(roomCode).emit("opponentReady", isReady);
    }
  );

    // 게임 시작
    socket.on("startGame", ({ roomCode }: { roomCode: string }) => {
      const room = rooms[roomCode];
      console.log("◀ startGame 수신", socket.id, roomCode);  // 추가
      
      if (!room) {
        socket.emit("error", "방이 존재하지 않습니다.");
        return;
      }

      if (socket.id !== room.hostId) {
        socket.emit("error", "방장만 시작할 수 있습니다.");
        return;
      }

      // 방 플레이어가 2명인지 확인
      if (room.players.length !== 2) {
        socket.emit("error", "플레이어가 2명 있어야 시작할 수 있습니다.");
        return;
      }

      // 모든 플레이어 준비 상태 확인
      const allReady = room.players.length === 2 && Object.values(room.ready).every(Boolean);
      if (!allReady) {
        socket.emit("error", "모든 플레이어가 준비 완료 상태여야 시작할 수 있습니다.");
        return;
      }

      // 게임 상태 초기화
      room.gameState = {
        currentTurn: room.players[0],
        cardsPlayed: {},
      };

      console.log(`▶ 게임 시작: 방 ${roomCode}, 턴: ${room.gameState.currentTurn}`);

      // 모든 클라이언트에게 게임 시작 알림
      io.to(roomCode).emit("gameStart", {
        roomCode,
        currentTurn: room.gameState.currentTurn,
      });
    });

    // 카드 플레이
    socket.on("playCard", ({ roomCode, card }) => {
      const room = rooms[roomCode];
      if (!room || !room.gameState) return;

      if (room.gameState.currentTurn !== socket.id) {
        socket.emit("error", "당신의 턴이 아닙니다.");
        return;
      }

      room.gameState.cardsPlayed[socket.id] = card;
      socket.to(roomCode).emit("opponentPlayCard", card);
    });

    // 턴 종료
    socket.on("endTurn", ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room || !room.gameState) return;

      const currentIndex = room.players.indexOf(socket.id);
      const nextIndex = (currentIndex + 1) % 2;
      room.gameState.currentTurn = room.players[nextIndex];
      room.gameState.cardsPlayed = {};

      io.to(roomCode).emit("turnChanged", room.players[nextIndex]);
    });

    // 연결 해제
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
