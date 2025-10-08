import { Server, Socket } from "socket.io";
import { rooms } from "./room"; // room.ts에서 export한 rooms 상태 공유

interface GameState {
  currentTurn: string;
  hp: Record<string, number>;
  cardsPlayed: Record<string, any>;
}

/**
 * ✅ 전투 시작 시 초기화 함수
 * room.ts → startGame 이벤트에서 호출됨
 */
export function initializeBattle(io: Server, roomCode: string, room: any) {
  room.gameState = {
    currentTurn: room.players[0], // 첫 번째 플레이어부터 시작
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
 * ✅ 배틀 관련 이벤트 핸들러 등록
 * server.ts에서 setupBattleHandlers(io)로 호출됨
 */
export function setupBattleHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log(`⚔️ 배틀 핸들러 연결됨: ${socket.id}`);

    /**
     * 🃏 카드 사용
     */
    socket.on("playCard", ({ roomCode, card }) => {
      const room = rooms[roomCode];
      if (!room || !room.gameState) return;

      const game = room.gameState as GameState;

      // 자기 턴이 아닐 경우
      if (game.currentTurn !== socket.id) {
        socket.emit("error", "당신의 턴이 아닙니다.");
        return;
      }

      const opponentId = room.players.find((id) => id !== socket.id)!;
      const damage = Math.max(0, Number(card.damage ?? 0));

      // 상대 HP 감소
      const prevHP = game.hp[opponentId] ?? 100;
      const newHP = Math.max(0, prevHP - damage);
      game.hp[opponentId] = newHP;

      // 카드 사용 기록
      game.cardsPlayed[socket.id] = card;

      // 모든 플레이어에게 결과 전송
      io.to(roomCode).emit("cardPlayed", {
        playerId: socket.id,
        card,
        damage,
        hp: game.hp,
      });

      console.log(`💥 ${socket.id}가 ${card.name} 사용 (${damage} 데미지) → ${opponentId}`);

      // 승패 판정
      if (newHP <= 0) {
        io.to(roomCode).emit("gameOver", { winnerId: socket.id, loserId: opponentId });
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
      const nextIndex = (currentIndex + 1) % 2;
      game.currentTurn = room.players[nextIndex];
      game.cardsPlayed = {}; // 사용 카드 초기화

      io.to(roomCode).emit("turnChanged", game.currentTurn);
      console.log(`🔄 턴 변경: ${socket.id} → ${game.currentTurn}`);
    });

    /**
     * 🧹 방 나가기 / 연결 해제 처리
     */
    socket.on("disconnecting", () => {
      for (const roomCode in rooms) {
        const room = rooms[roomCode];
        if (!room.players.includes(socket.id)) continue;

        // 게임 중이라면 상대에게 알림
        if (room.gameState) {
          socket.to(roomCode).emit("opponentLeft");
          delete room.gameState;
          console.log(`🚪 ${socket.id} 퇴장 → ${roomCode} 게임 종료`);
        }
      }
    });
  });
}
