import { Server, Socket } from "socket.io";
import { rooms } from "./room"; // ✅ room.ts의 rooms 공유
import { CardData, GameState, RoomInfo } from "../types/gameTypes"; // ✅ 공통 타입 사용
import Card from "../models/Card"; // ✅ 추가

// ======================= 🔁 공유 타이머 설정 =======================
const TURN_TIME = 30; // 한 턴당 제한 시간 (초 단위)

// ✅ 기존 타이머 정지
function stopSharedTimer(room: RoomInfo) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
}

// ✅ 타이머 시작 (모든 유저와 동기화)
function startSharedTimer(io: Server, roomCode: string, room: RoomInfo) {
  stopSharedTimer(room); // 혹시 이전 타이머가 있으면 정리
  room.timeLeft = TURN_TIME; // 타이머 리셋
  io.to(roomCode).emit("timeUpdate", room.timeLeft); // 즉시 한번 전송 (UI 초기화용)

  room.timer = setInterval(() => {
    if (!room.gameState) {
      stopSharedTimer(room);
      return;
    }

    if (room.timeLeft === undefined) room.timeLeft = TURN_TIME;
    room.timeLeft = Math.max(0, (room.timeLeft ?? TURN_TIME) - 1);

    // 모든 플레이어에게 남은 시간 브로드캐스트
    io.to(roomCode).emit("timeUpdate", room.timeLeft);

    // 0초 도달 → 자동 턴 종료 처리
    if (room.timeLeft <= 0) {
      stopSharedTimer(room);
      io.to(roomCode).emit("turnTimeout");
      switchTurnAndRestartTimer(io, roomCode, room);
    }
  }, 1000);
}

// ✅ 턴 교체 + 타이머 재시작
function switchTurnAndRestartTimer(io: Server, roomCode: string, room: RoomInfo) {
  if (!room?.gameState) return;
  const game = room.gameState;

  const currentIndex = room.players.indexOf(game.currentTurn);
  const nextIndex = (currentIndex + 1) % room.players.length;
  const nextTurn = room.players[nextIndex];

  game.currentTurn = nextTurn;
  game.cardsPlayed = {};

  // ✅ 다음 턴 유저 코스트 1 증가 (최대 8)
  if (!game.cost[nextTurn]) game.cost[nextTurn] = 0;
  game.cost[nextTurn] = Math.min(game.cost[nextTurn] + 1, 8);

  // ✅ 변경 사항 모든 플레이어에 브로드캐스트
  io.to(roomCode).emit("turnChanged", {
    currentTurn: nextTurn,
    cost: game.cost,
    hp: game.hp,
  });

  console.log(`🔁 자동 턴 전환: ${nextTurn} (타이머 리셋됨)`);

  // ✅ 새 타이머 시작
  startSharedTimer(io, roomCode, room);
}

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

  // ✅ 전투 시작과 동시에 타이머 시작
  startSharedTimer(io, roomCode, room);
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
      // ✅ 재접속 시 타이머 시간도 동기화
      if (room.timeLeft !== undefined) {
        socket.emit("timeUpdate", room.timeLeft);
      }
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

    // ✅ 요청 시 타이머 동기화
    if (room.timeLeft !== undefined) {
      socket.emit("timeUpdate", room.timeLeft);
    }

    console.log(`📨 ${socket.id} → ${roomCode} 상태 요청`);
  });

  // ==================== 🃏 카드 소환 ====================
  socket.on("summonCard", async ({ roomCode, card }: { roomCode: string; card: any }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState;
    const playerId = socket.id;

    // ✅ 1. cost 안전 변환
    let costValue = 0;
    if (card && card.cost !== undefined) {
      costValue = parseInt(card.cost, 10);
      if (isNaN(costValue)) costValue = 0;
    }

    // ✅ 2. 턴 검사
    if (playerId !== game.currentTurn) {
      socket.emit("error", "지금은 당신의 턴이 아닙니다.");
      return;
    }

    // ✅ 3. 코스트 검사
    const playerCost = game.cost[playerId] ?? 0;
    if (playerCost < costValue) {
      socket.emit("error", "코스트가 부족합니다!");
      return;
    }

    // ✅ 4. 카드존 검사
    if (!game.cardsInZone[playerId]) game.cardsInZone[playerId] = [];
    if (game.cardsInZone[playerId].length >= 5) {
      socket.emit("error", "필드가 가득 찼습니다! (최대 5장)");
      return;
    }

    // ✅ 5. 코스트 차감
    game.cost[playerId] = Math.max(0, playerCost - costValue);

    // ✅ 6. DB에서 카드 세부정보 보강
    let dbCardData = null;
    try {
      dbCardData = await Card.findOne({ cardName: card.name || card.cardName });
    } catch (err) {
      console.error("❌ DB 카드 조회 실패:", err);
    }

    const summonedCard = {
      ...card,
      cost: costValue,
      cardType: dbCardData?.cardType ?? card.cardType ?? "normal",
      image2D: dbCardData?.image2D ?? card.image2D ?? "default.png",
    };

    game.cardsInZone[playerId].push(summonedCard);

    // ✅ 7. 모든 플레이어에게 최신 상태 전송
    io.to(roomCode).emit("cardSummoned", {
      playerId,
      card: summonedCard,
      updatedCost: game.cost[playerId],
      cost: { ...game.cost },
    });

    console.log(
      `🃏 ${playerId} → ${roomCode}에 ${summonedCard.name || summonedCard.cardName || "Unknown"} 소환 (코스트 ${costValue}), 남은 코스트: ${
        game.cost[playerId]
      }`
    );
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
      stopSharedTimer(room); // ✅ 타이머 정지
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

    // ✅ 수동 턴 종료 시에도 타이머 재시작
    const nextIndex = (currentIndex + 1) % room.players.length;
    const nextTurn = room.players[nextIndex];
    game.currentTurn = nextTurn;
    game.cardsPlayed = {};

    if (!game.cost[nextTurn]) game.cost[nextTurn] = 0;
    game.cost[nextTurn] = Math.min(game.cost[nextTurn] + 1, 8);

    io.to(roomCode).emit("turnChanged", {
      currentTurn: nextTurn,
      cost: game.cost,
      hp: game.hp,
    });

    console.log(`🔄 턴 변경: ${socket.id} → ${nextTurn} | 코스트 갱신: ${JSON.stringify(game.cost)}`);

    // ✅ 타이머 리셋 후 재시작
    startSharedTimer(io, roomCode, room);
  });

  // ==================== 📡 현재 턴 요청 ====================
  socket.on("getCurrentTurn", ({ roomCode }: { roomCode: string }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    socket.emit("currentTurnSync", {
      currentTurn: room.gameState.currentTurn,
      hp: room.gameState.hp,
    });

    if (room.timeLeft !== undefined) {
      socket.emit("timeUpdate", room.timeLeft);
    }
  });

  // ==================== 🚪 연결 해제 ====================
  socket.on("disconnecting", () => {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      if (!room.players.includes(socket.id)) continue;

      if (room.gameState) {
        socket.to(roomCode).emit("opponentLeft");
        stopSharedTimer(room); // ✅ 타이머 정지
        delete room.gameState;
        console.log(`🚪 ${socket.id} 퇴장 → ${roomCode} 게임 종료`);
      }

      room.players = room.players.filter((id) => id !== socket.id);
      if (room.players.length === 0) {
        stopSharedTimer(room); // ✅ 방 삭제 전 타이머 정리
        delete rooms[roomCode];
        console.log(`🧹 빈 방 삭제: ${roomCode}`);
      }
    }
  });
}
