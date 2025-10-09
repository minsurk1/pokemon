import { Server, Socket } from "socket.io";

export interface GameState {
  currentTurn: string;
  hp: Record<string, number>;
  cardsPlayed: Record<string, any>;
}

interface RoomInfo {
  players: string[];
  ready: Record<string, boolean>;
  hp: Record<string, number>;
  turnIndex: number;
  gameState?: GameState;
}

export const rooms: Record<string, RoomInfo> = {};

export default function roomHandler(io: Server, socket: Socket) {
  console.log(`🔵 새로운 클라이언트 연결: ${socket.id}`);

  /**
   * 🏠 방 참여
   */
  socket.on("joinRoom", (roomCode: string) => {
    console.log(`▶ joinRoom 수신 ${socket.id} -> ${roomCode}`);

    // === 방이 없으면 새로 생성
    if (!rooms[roomCode]) {
      rooms[roomCode] = {
        players: [socket.id],
        ready: {},
        hp: {},
        turnIndex: 0,
      };
      console.log(`✅ 방 생성됨: ${roomCode}, 호스트: ${socket.id}`);
    } else {
      const room = rooms[roomCode];

      // === 이미 방에 들어와 있는 경우 중복 입장 방지
      if (room.players.includes(socket.id)) {
        console.log(`⚠️ ${socket.id}는 이미 ${roomCode} 방에 있음 (중복 입장 차단)`);
        return;
      }

      // === 방이 가득 찼을 경우
      if (room.players.length >= 2) {
        console.log(`🚫 ${roomCode} 방이 가득 찼음`);
        socket.emit("roomFull");
        return;
      }

      // === 정상 입장 처리
      room.players.push(socket.id);
      console.log(`👤 ${socket.id} → 방 ${roomCode} 입장`);
    }

    socket.join(roomCode);

    const room = rooms[roomCode];
    const isHost = room.players[0] === socket.id;

    socket.emit("roomJoined", { roomCode, isHost });
    socket.to(roomCode).emit("opponentJoined");

    // 상태 출력
    console.log(
      `📊 방 상태 [${roomCode}]: ${room.players.length}명 (${room.players.join(", ")})`
    );
  });

  /**
   * ⚙️ 준비 상태 토글
   */
  socket.on("playerReady", ({ roomCode, isReady }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.ready[socket.id] = isReady;
    socket.to(roomCode).emit("opponentReady", isReady);

    console.log(`💡 ${socket.id} 준비 상태: ${isReady} (방: ${roomCode})`);
  });

  /**
   * ▶ 게임 시작
   */
  socket.on("startGame", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("error", "방이 존재하지 않습니다.");
      return;
    }

    const players = room.players;
    if (players.length < 2) {
      socket.emit("error", "플레이어가 2명이어야 합니다.");
      return;
    }

    const allReady = players.every((id: string) => room.ready[id]);
    if (!allReady) {
      socket.emit("error", "모든 플레이어가 준비되어야 합니다.");
      return;
    }

    // 이미 게임 상태가 존재한다면 중복 시작 방지
    if (room.gameState) {
      socket.emit("error", "이미 게임이 시작되었습니다.");
      return;
    }

    // HP 초기화
    players.forEach((id: string) => {
      room.hp[id] = 1000; // ✅ 초기 HP
    });

    room.turnIndex = 0;

    // 게임 상태 초기화
    room.gameState = {
      currentTurn: players[room.turnIndex],
      hp: { ...room.hp },
      cardsPlayed: {},
    };

    const currentTurn = room.gameState.currentTurn;

    io.to(roomCode).emit("gameStart", {
      roomCode,
      currentTurn,
      hp: room.hp,
    });

    console.log(`🎮 게임 시작: 방 ${roomCode}, 첫 턴 → ${currentTurn}`);
  });

  /**
   * 🃏 카드 사용
   */
  socket.on("playCard", ({ roomCode, card }) => {
    const room = rooms[roomCode];
    if (!room || !room.gameState) return;

    const { currentTurn } = room.gameState;
    if (socket.id !== currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      return;
    }

    console.log(`🃏 ${socket.id}가 ${card.name} 사용 in ${roomCode}`);
    socket.to(roomCode).emit("opponentPlayCard", card);
  });

  /**
   * 🔁 턴 종료
   */
  socket.on("endTurn", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.gameState) return;

    room.turnIndex = (room.turnIndex + 1) % room.players.length;
    room.gameState.currentTurn = room.players[room.turnIndex];
    room.gameState.cardsPlayed = {}; // 턴 교체 시 카드 기록 초기화

    const nextTurnId = room.gameState.currentTurn;

    io.to(roomCode).emit("turnChanged", nextTurnId);
    console.log(`🔄 턴 변경: ${socket.id} → ${nextTurnId}`);
  });

  /**
   * ❌ 연결 종료 처리
   */
  socket.on("disconnect", () => {
    console.log(`🔴 클라이언트 연결 해제: ${socket.id}`);

    for (const [roomCode, room] of Object.entries(rooms)) {
      if (!room.players.includes(socket.id)) continue;

      // 해당 socket 제거
      room.players = room.players.filter((id) => id !== socket.id);
      delete room.ready[socket.id];
      delete room.hp[socket.id];

      // 상대방에게 알림
      socket.to(roomCode).emit("opponentLeft");

      console.log(`🚪 ${socket.id} 방 ${roomCode} 퇴장`);

      // 방에 남은 인원 처리
      if (room.players.length === 0) {
        console.log(`🧹 방 ${roomCode} 삭제`);
        delete rooms[roomCode];
      } else {
        // 방장이 나갔으면 방장 교체
        if (room.players[0]) {
          console.log(`👑 새로운 방장: ${room.players[0]} (${roomCode})`);
        }
      }

      break;
    }
  });
}
