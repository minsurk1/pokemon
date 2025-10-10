import { Server, Socket } from "socket.io";
import { rooms } from "./room"; // ✅ room.ts의 rooms 공유

interface GameState {
  currentTurn: string;
  hp: Record<string, number>;
  cardsPlayed: Record<string, any>;
}

/**
 * ✅ 전투 초기화 함수 (room.ts에서 startGame 시 호출)
 */
export function initializeBattle(io: Server, roomCode: string, room: any) {
  const [player1, player2] = room.players;

  room.gameState = {
    currentTurn: player1, // 항상 첫 번째 플레이어부터 시작
    hp: {
      [player1]: 2000,
      [player2]: 2000,
    },
    cardsPlayed: {},
  };

  // ✅ 모든 플레이어에게 게임 시작 이벤트 전송
  io.to(roomCode).emit("gameStart", {
    roomCode,
    currentTurn: player1,
    hp: room.gameState.hp,
  });

  // ✅ 각 플레이어별로 자신의 턴 상태를 즉시 전송 (동기화 강화)
  room.players.forEach((pid: string) => {
    io.to(pid).emit("updateGameState", {
      currentTurn: room.gameState.currentTurn,
      hp: room.gameState.hp,
    });
    console.log(`📤 초기 턴 상태 전송 → ${pid}`);
  });

  console.log(
    `🎮 전투 시작: 방 ${roomCode}, 첫 턴 → ${player1} / 플레이어: ${player1}, ${player2}`
  );
}

/**
 * ✅ 배틀 이벤트 핸들러
 */
export default function battleHandler(io: Server, socket: Socket) {
  console.log(`⚔️ 배틀 소켓 연결됨: ${socket.id}`);

  /**
   * ✅ 새로 연결된 클라이언트가 자신의 방 상태 자동 수신
   *    (새로고침 or 재접속 시)
   */
  for (const [code, room] of Object.entries(rooms)) {
    if (room.players.includes(socket.id) && room.gameState) {
      socket.emit("updateGameState", {
        currentTurn: room.gameState.currentTurn,
        hp: room.gameState.hp,
      });
      console.log(`♻️ ${socket.id} 재연결 감지 → 방 ${code} 상태 자동 전송`);
      break;
    }
  }

  /**
   * 📡 클라이언트가 명시적으로 요청할 때 현재 게임 상태 전송
   */
  socket.on("getGameState", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.gameState) {
      console.log(`⚠️ [getGameState] 유효하지 않은 방: ${roomCode}`);
      return;
    }

    socket.emit("updateGameState", {
      currentTurn: room.gameState.currentTurn,
      hp: room.gameState.hp,
    });

    console.log(
      `📨 ${socket.id}이(가) ${roomCode}의 현재 상태 요청 → 턴 ${room.gameState.currentTurn}`
    );
  });

  /**
   * 🃏 카드 사용 이벤트
   */
  socket.on("playCard", ({ roomCode, card }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState as GameState;
    const currentTurn = game.currentTurn;

    // 🔒 턴 확인
    if (socket.id !== currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      console.log(`🚫 [턴 오류] ${socket.id}의 턴 아님 → 현재 턴: ${currentTurn}`);
      return;
    }

    // ✅ 상대 찾기
    const opponentId = room.players.find((id: string) => id !== socket.id);
    if (!opponentId) return;

    // ✅ 데미지 계산
    const damage = Math.max(0, Number(card.attack ?? card.damage ?? 0));
    const prevHP = game.hp[opponentId] ?? 2000;
    const newHP = Math.max(0, prevHP - damage);
    game.hp[opponentId] = newHP;

    game.cardsPlayed[socket.id] = card;

    io.to(roomCode).emit("cardPlayed", {
      playerId: socket.id,
      card,
      damage,
      hp: game.hp,
    });

    console.log(
      `💥 ${socket.id} (${room.players.indexOf(socket.id) === 0 ? "Player1" : "Player2"}) → ${opponentId}에게 ${damage} 피해`
    );

    // ✅ 게임 종료 처리
    if (newHP <= 0) {
      io.to(roomCode).emit("gameOver", {
        winnerId: socket.id,
        loserId: opponentId,
      });
      console.log(`🏁 게임 종료: ${socket.id} 승리 (${roomCode})`);
      delete room.gameState;
    }
  });

  /**
   * 🔁 턴 종료
   */
  socket.on("endTurn", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState as GameState;
    const currentIndex = room.players.indexOf(socket.id);

    if (socket.id !== game.currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      console.log(`🚫 [턴 종료 오류] ${socket.id}의 턴이 아님`);
      return;
    }

    // ✅ 턴 교체
    const nextIndex = (currentIndex + 1) % room.players.length;
    const nextTurn = room.players[nextIndex];
    game.currentTurn = nextTurn;
    game.cardsPlayed = {};

    io.to(roomCode).emit("turnChanged", nextTurn);
    console.log(`🔄 턴 변경: ${socket.id} → ${nextTurn} (${roomCode})`);
  });

  /**
   * 📡 현재 턴 요청 (새로고침 시 동기화용)
   */
  socket.on("getCurrentTurn", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;
    socket.emit("currentTurnSync", {
      currentTurn: room.gameState.currentTurn,
      hp: room.gameState.hp,
    });
    console.log(`📡 ${socket.id}가 턴 상태 요청 → ${room.gameState.currentTurn}`);
  });

  /**
   * 🚪 연결 해제 처리
   */
  socket.on("disconnecting", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      if (!room.players.includes(socket.id)) continue;

      // ✅ 방에 남은 플레이어에게 알림
      if (room.gameState) {
        socket.to(roomCode).emit("opponentLeft");
        delete room.gameState;
        console.log(`🚪 ${socket.id} 퇴장 → ${roomCode} 게임 종료`);
      }

      // ✅ 플레이어 제거
      room.players = room.players.filter((id: string) => id !== socket.id);
      if (room.players.length === 0) {
        delete rooms[roomCode];
        console.log(`🧹 빈 방 삭제: ${roomCode}`);
      }
    }
  });
}
