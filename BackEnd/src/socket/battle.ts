import { Server, Socket } from "socket.io";
import { rooms } from "./room"; // ✅ room.ts의 rooms 공유

interface GameState {
  currentTurn: string;
  hp: Record<string, number>;
  cardsPlayed: Record<string, any>;
}

/**
 * ✅ 전투 초기화 함수 (room.ts에서 startGame 시 호출 가능)
 */
export function initializeBattle(io: Server, roomCode: string, room: any) {
  room.gameState = {
    currentTurn: room.players[0],
    hp: {
      [room.players[0]]: 100,
      [room.players[1]]: 100,
    },
    cardsPlayed: {},
  };

  io.to(roomCode).emit("gameStart", {
    roomCode,
    currentTurn: room.gameState.currentTurn,
    hp: room.gameState.hp,
  });

  console.log(`🎮 전투 시작: 방 ${roomCode}, 첫 턴 ${room.gameState.currentTurn}`);
}

/**
 * ✅ 배틀 핸들러 (default export)
 */
export default function battleHandler(io: Server, socket: Socket) {
  console.log(`⚔️ 배틀 소켓 연결됨: ${socket.id}`);

  /**
   * 🃏 카드 사용
   */
  socket.on("playCard", ({ roomCode, card }) => {
    const room = rooms[roomCode];
    if (!room || !room.gameState) return;

    const game = room.gameState as GameState;

    if (game.currentTurn !== socket.id) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      return;
    }

    const opponentId = room.players.find((id: string) => id !== socket.id);
    if (!opponentId) return;

    const damage = Math.max(0, Number(card.damage ?? 0));
    const prevHP = game.hp[opponentId] ?? 100;
    const newHP = Math.max(0, prevHP - damage);
    game.hp[opponentId] = newHP;

    game.cardsPlayed[socket.id] = card;

    io.to(roomCode).emit("cardPlayed", {
      playerId: socket.id,
      card,
      damage,
      hp: game.hp,
    });

    console.log(`💥 ${socket.id} → ${opponentId}에게 ${damage} 데미지 (${card.name})`);

    if (newHP <= 0) {
      io.to(roomCode).emit("gameOver", {
        winnerId: socket.id,
        loserId: opponentId,
      });
      console.log(`🏁 게임 종료: ${socket.id} 승리`);
      delete room.gameState;
    }
  });

  /**
   * 🔁 턴 종료
   */
  socket.on("endTurn", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room || !room.gameState) return;

    const game = room.gameState as GameState;

    const currentIndex = room.players.indexOf(socket.id);
    const nextIndex = (currentIndex + 1) % room.players.length;
    game.currentTurn = room.players[nextIndex];
    game.cardsPlayed = {};

    io.to(roomCode).emit("turnChanged", game.currentTurn);
    console.log(`🔄 턴 변경: ${socket.id} → ${game.currentTurn}`);
  });

  /**
   * 🚪 연결 해제 처리
   */
  socket.on("disconnecting", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      if (!room.players.includes(socket.id)) continue;

      if (room.gameState) {
        socket.to(roomCode).emit("opponentLeft");
        delete room.gameState;
        console.log(`🚪 ${socket.id} 퇴장 → ${roomCode} 게임 종료`);
      }
    }
  });
}
