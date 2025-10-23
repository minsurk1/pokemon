import { Server, Socket } from "socket.io";
import { rooms } from "./room"; // ✅ room.ts의 rooms 공유
import { CardData, GameState, RoomInfo } from "../types/gameTypes"; // ✅ 공통 타입 사용

// ======================= 배틀 초기화 =======================
export function initializeBattle(io: Server, roomCode: string, room: RoomInfo) {
  const [player1, player2] = room.players;
  const initialHP = 2000;

  room.gameState = {
    currentTurn: player1,
    hp: {
      [player1]: initialHP,
      [player2]: initialHP,
    },
    cardsPlayed: {},
    cardsInZone: {
      [player1]: [],
      [player2]: [],
    },
    cost: {
      [player1]: 1,
      [player2]: 1,
    },
  };

  io.to(roomCode).emit("gameStart", {
    roomCode,
    currentTurn: player1,
    hp: room.gameState.hp,
  });

  room.players.forEach((pid) => {
    io.to(pid).emit("updateGameState", {
      currentTurn: room.gameState!.currentTurn,
      hp: room.gameState!.hp,
    });
    console.log(`📤 초기 턴 상태 전송 → ${pid}`);
  });

  console.log(`🎮 전투 시작: 방 ${roomCode}, 첫 턴 → ${player1}`);
}

// ======================= 배틀 이벤트 핸들러 =======================
export default function battleHandler(io: Server, socket: Socket) {
  console.log(`⚔️ 배틀 소켓 연결됨: ${socket.id}`);

  // === 재접속 시 동기화 ===
  for (const [code, room] of Object.entries(rooms)) {
    if (room.players.includes(socket.id) && room.gameState) {
      socket.emit("updateGameState", {
        currentTurn: room.gameState.currentTurn,
        hp: room.gameState.hp,
      });
      console.log(`♻️ ${socket.id} 재연결 감지 → 방 ${code}`);
      break;
    }
  }

  // === 현재 상태 요청 ===
  socket.on("getGameState", ({ roomCode }: { roomCode: string }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    socket.emit("updateGameState", {
      currentTurn: room.gameState.currentTurn,
      hp: room.gameState.hp,
    });

    console.log(`📨 ${socket.id} → ${roomCode} 상태 요청`);
  });

  // ==================== 🃏 카드 소환 ====================
  socket.on("summonCard", ({ roomCode, card }: { roomCode: string; card: any }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState;
    const playerId = socket.id;

    // ✅ cost 안전 처리
    const costValue = typeof card.cost === "number" && !isNaN(card.cost) ? Math.max(0, card.cost) : 0;

    // ✅ 턴 검사
    if (playerId !== game.currentTurn) {
      socket.emit("error", "지금은 당신의 턴이 아닙니다.");
      return;
    }

    // ✅ 코스트 검사
    const playerCost = game.cost[playerId] ?? 0;
    if (playerCost < costValue) {
      socket.emit("error", "코스트가 부족합니다!");
      return;
    }

    // ✅ 카드존 검사
    if (!game.cardsInZone[playerId]) game.cardsInZone[playerId] = [];
    if (game.cardsInZone[playerId].length >= 5) {
      socket.emit("error", "필드가 가득 찼습니다! (최대 5장)");
      return;
    }

    // ✅ ① 코스트 차감 (🔥 여기서 확실하게 반영)
    game.cost[playerId] = Math.max(0, playerCost - costValue);

    // ✅ ② 카드 소환 처리
    game.cardsInZone[playerId].push({
      ...card,
      cost: costValue,
    });

    // ✅ ③ 모든 플레이어에게 최신 상태 전송 (🔥 cost 동기화 추가)
    io.to(roomCode).emit("cardSummoned", {
      playerId,
      card,
      updatedCost: game.cost[playerId], // 🔥 플레이어별 최신 코스트 값
      cost: { ...game.cost }, // 전체 cost 동기화용
    });

    console.log(`🃏 ${playerId} → ${roomCode}에 ${card.name} 소환 (코스트 ${costValue}), 남은 코스트: ${game.cost[playerId]}`);
  });

  // ==================== 💥 공격 / 피해 ====================
  socket.on("playCard", ({ roomCode, card }: { roomCode: string; card: CardData }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState;
    const currentTurn = game.currentTurn;

    if (socket.id !== currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      return;
    }

    const opponentId = room.players.find((id) => id !== socket.id);
    if (!opponentId) return;

    const damage = Math.max(0, Number(card.attack ?? 0));
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

    console.log(`💥 ${socket.id} → ${opponentId}에게 ${damage} 피해`);

    if (newHP <= 0) {
      io.to(roomCode).emit("gameOver", {
        winnerId: socket.id,
        loserId: opponentId,
      });
      console.log(`🏁 게임 종료: ${socket.id} 승리`);
      delete room.gameState;
    }
  });

  // ==================== ⚔️ 카드 간 공격 ====================
  socket.on("attackCard", ({ roomCode, attackerId, targetId }: { roomCode: string; attackerId: string; targetId: string }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState;
    const playerId = socket.id;
    const opponentId = room.players.find((id) => id !== playerId);
    if (!opponentId) return;

    // ✅ 턴 검사
    if (playerId !== game.currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      return;
    }

    const attacker = game.cardsInZone[playerId]?.find((c) => c.id === attackerId);
    const target = game.cardsInZone[opponentId]?.find((c) => c.id === targetId);

    if (!attacker || !target) {
      socket.emit("error", "공격자 또는 대상 카드를 찾을 수 없습니다.");
      return;
    }

    // ✅ 체력 감소 처리
    const prevHP = target.hp ?? 0;
    const newHP = Math.max(0, prevHP - attacker.attack);
    target.hp = newHP;

    // ✅ 브로드캐스트: 카드 체력 업데이트
    io.to(roomCode).emit("updateCardHP", {
      targetId,
      newHP,
    });

    console.log(`⚔️ ${attacker.name}(${attacker.attack}) → ${target.name} | HP ${prevHP} → ${newHP}`);

    // ✅ 카드 사망 처리
    if (newHP <= 0) {
      game.cardsInZone[opponentId] = game.cardsInZone[opponentId].filter((c) => c.id !== targetId);

      io.to(roomCode).emit("cardDestroyed", {
        targetId,
        ownerId: opponentId,
      });

      console.log(`💀 ${target.name}이(가) 쓰러졌습니다.`);
    }
  });

  // ==================== 🔁 턴 종료 ====================
  socket.on("endTurn", ({ roomCode }: { roomCode: string }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState;
    const currentIndex = room.players.indexOf(socket.id);

    if (socket.id !== game.currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      return;
    }

    // ✅ 턴 교체
    const nextIndex = (currentIndex + 1) % room.players.length;
    const nextTurn = room.players[nextIndex];
    game.currentTurn = nextTurn;
    game.cardsPlayed = {};

    // ✅ 턴을 넘길 때, 모든 플레이어의 코스트를 +1 (최대 8)
    for (const pid of room.players) {
      if (!game.cost[pid]) game.cost[pid] = 0;
      game.cost[pid] = Math.min(game.cost[pid] + 1, 8);
    }

    // ✅ 프론트에 동기화 (hp, cost, currentTurn)
    io.to(roomCode).emit("turnChanged", {
      currentTurn: nextTurn,
      cost: game.cost,
      hp: game.hp,
    });

    console.log(`🔄 턴 변경: ${socket.id} → ${nextTurn} | 코스트 갱신: ${JSON.stringify(game.cost)}`);
  });

  // ==================== 📡 현재 턴 요청 ====================
  socket.on("getCurrentTurn", ({ roomCode }: { roomCode: string }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    socket.emit("currentTurnSync", {
      currentTurn: room.gameState.currentTurn,
      hp: room.gameState.hp,
    });
  });

  // ==================== 🚪 연결 해제 ====================
  socket.on("disconnecting", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      if (!room.players.includes(socket.id)) continue;

      if (room.gameState) {
        socket.to(roomCode).emit("opponentLeft");
        delete room.gameState;
        console.log(`🚪 ${socket.id} 퇴장 → ${roomCode} 게임 종료`);
      }

      room.players = room.players.filter((id) => id !== socket.id);
      if (room.players.length === 0) {
        delete rooms[roomCode];
        console.log(`🧹 빈 방 삭제: ${roomCode}`);
      }
    }
  });
}
