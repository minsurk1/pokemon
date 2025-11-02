import { Server, Socket } from "socket.io";
import { rooms } from "./room"; // ✅ room.ts의 rooms 공유
import { CardData, GameState, RoomInfo } from "../types/gameTypes"; // ✅ 공통 타입 사용
import Card from "../models/Card"; // ✅ 추가
import crypto from "crypto";

// ======================= 🔁 공유 타이머 설정 =======================
const TURN_TIME = 30; // 한 턴당 제한 시간 (초 단위)

// ✅ 기존 타이머 정지
function stopSharedTimer(room: RoomInfo) {
  if (room.timer) {
    clearInterval(room.timer);
    room.timer = null;
  }
  room.timeLeft = undefined;
}

// ✅ 타이머 시작 (모든 유저와 동기화)
function startSharedTimer(io: Server, roomCode: string, room: RoomInfo) {
  stopSharedTimer(room); // 혹시 이전 타이머가 있으면 정리
  if (room.timer) return; // ✅ 이미 타이머가 있으면 중복 방지
  room.timeLeft = TURN_TIME; // 타이머 리셋
  io.to(roomCode).emit("timeUpdate", room.timeLeft); // 즉시 한번 전송 (UI 초기화용)

  room.timer = setInterval(() => {
    if (!room.gameState) {
      stopSharedTimer(room);
      return;
    }

    room.timeLeft = Math.max(0, (room.timeLeft ?? TURN_TIME) - 1);
    io.to(roomCode).emit("timeUpdate", room.timeLeft);

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
  game.turnCount = (game.turnCount ?? 0) + 1;
  game.cardsPlayed = {};

  // ✅ 다음 턴 유저 코스트 1 증가 (최대 8)
  if (!game.cost[nextTurn]) game.cost[nextTurn] = 0;
  game.cost[nextTurn] = Math.min(game.cost[nextTurn] + 1, 8);

  // ✅ 턴이 바뀌면 새 턴 유저의 모든 카드를 다시 공격 가능 상태로 리셋
  if (game.cardsInZone[nextTurn]) {
    game.cardsInZone[nextTurn].forEach((card) => (card.canAttack = true));
  }

  // ✅ 변경 사항 모든 플레이어에 브로드캐스트
  io.to(roomCode).emit("turnChanged", {
    currentTurn: nextTurn,
    cost: game.cost,
    hp: game.hp,
    turnCount: game.turnCount,
    timeLeft: room.timeLeft ?? TURN_TIME,
  });
  console.log(`🔁 자동 턴 전환: ${nextTurn} (타이머 리셋됨)`);

  // ✅ 새 타이머 시작
  startSharedTimer(io, roomCode, room);
}

// ======================= 배틀 초기화 =======================
export function initializeBattle(io: Server, roomCode: string, room: RoomInfo) {
  if (room.players.length < 2) {
    console.error(`❌ 전투 초기화 실패: ${roomCode} 방에 플레이어가 2명 미만`);
    return;
  }
  const [player1, player2] = room.players;

  const initialHP = 2000;

  room.gameState = {
    currentTurn: player1,

    // ✅ 체력
    hp: {
      [player1]: initialHP,
      [player2]: initialHP,
    },

    // ✅ 필드 및 사용된 카드
    cardsPlayed: {},
    cardsInZone: {
      [player1]: [],
      [player2]: [],
    },

    // ✅ 코스트
    cost: {
      [player1]: 1,
      [player2]: 1,
    },

    // ✅ 새로 추가된 필드들
    decks: {
      [player1]: room.gameState?.decks?.[player1] || [],
      [player2]: room.gameState?.decks?.[player2] || [],
    },
    hands: {
      [player1]: [],
      [player2]: [],
    },
    graveyards: {
      [player1]: [],
      [player2]: [],
    },
    turnCount: 1, // 첫 턴은 1로 시작
  };

  io.to(roomCode).emit("gameStart", {
    roomCode,
    currentTurn: player1,
    hp: { ...room.gameState.hp },
    cost: { ...room.gameState.cost },
    turnCount: 1,
  });

  if (!room.gameState) return;

  room.players.forEach((pid) => {
    io.to(pid).emit("updateGameState", {
      currentTurn: room.gameState!.currentTurn,
      hp: room.gameState!.hp,
      decks: room.gameState!.decks,
      hands: room.gameState!.hands,
      graveyards: room.gameState!.graveyards,
      cost: room.gameState!.cost,
      turnCount: room.gameState!.turnCount,
      cardsInZone: room.gameState!.cardsInZone, // 이미 있는 데이터 포함
      timeLeft: room.timeLeft ?? TURN_TIME, // ✅ 타이머 포함
    });
    console.log(`📤 초기 턴 상태 전송 → ${pid}`);
  });

  console.log(`🎮 전투 시작: 방 ${roomCode}, 첫 턴 → ${player1}`);

  // ✅ 전투 시작과 동시에 타이머 시작
  room.timeLeft = TURN_TIME;
  startSharedTimer(io, roomCode, room);
}

// ======================= 배틀 이벤트 핸들러 =======================
export default function battleHandler(io: Server, socket: Socket) {
  console.log(`⚔️ 배틀 소켓 연결됨: ${socket.id}`);

  // === 재접속 시 동기화 ===
  for (const [code, room] of Object.entries(rooms)) {
    if (room.players.includes(socket.id) && room.gameState) {
      const g = room.gameState;
      socket.emit("updateGameState", {
        currentTurn: g.currentTurn,
        hp: g.hp,
        decks: g.decks,
        hands: g.hands,
        graveyards: g.graveyards,
        cost: g.cost,
        turnCount: g.turnCount,
        cardsInZone: g.cardsInZone,
      });

      // ✅ 타이머 시간도 정확히 동기화 (0초도 전송)
      if (room.timeLeft !== undefined) {
        socket.emit("timeUpdate", room.timeLeft);
      }

      console.log(`♻️ ${socket.id} 재연결 감지 → 방 ${code}`);
      break;
    }
  }

  // ==================== 재접속 후 상태 복구 ====================
  socket.on("getGameState", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    // ✅ 방 소켓 다시 join만 (ID 교체는 room.ts에서 함)
    socket.join(roomCode);

    // ✅ 상태만 전송 (ID 교체 X)
    if (room.gameState) {
      const g = room.gameState;
      socket.emit("updateGameState", {
        currentTurn: g.currentTurn,
        hp: g.hp,
        decks: g.decks,
        hands: g.hands,
        graveyards: g.graveyards,
        cost: g.cost,
        turnCount: g.turnCount,
        cardsInZone: g.cardsInZone,
      });
    }

    if (room.timeLeft !== undefined) {
      socket.emit("timeUpdate", room.timeLeft);
    }

    console.log(`♻️ 재접속 상태 동기화 완료 → ${roomCode}`);
  });

  // ==================== (재접속 후) 덱 전송 ====================
  socket.on("sendDeck", ({ roomCode, deck }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    // 이미 덱 있는 플레이어가 재전송하면 무시
    if (room.gameState.decks[socket.id]?.length > 0) {
      return;
    }

    room.gameState.decks[socket.id] = deck;
    console.log(`📥 덱 저장: ${socket.id}`, deck.length);
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
    if (!card || (!card.name && !card.cardName)) {
      socket.emit("error", "잘못된 카드 데이터입니다.");
      return;
    }

    try {
      dbCardData = await Card.findOne({
        cardName: card.name || card.cardName,
      });
    } catch (err) {
      console.error("❌ DB 카드 조회 실패:", err);
    }

    const summonedCard = {
      ...card,
      id: card.id ?? crypto.randomUUID(), // ✅ 서버에서 id 보장
      cost: costValue,
      cardType: dbCardData?.cardType ?? card.cardType ?? "normal",
      image2D: dbCardData?.image2D ?? card.image2D ?? "default.png",
      canAttack: true, // ✅ 기본값 추가
    };

    game.cardsInZone[playerId].push(summonedCard);

    // ✅ 7. 모든 플레이어에게 최신 상태 전송
    io.to(roomCode).emit("cardSummoned", {
      playerId,
      card: summonedCard,
      updatedCost: game.cost[playerId],
      cost: { ...game.cost },
    });

    // 타이머 상태 즉시 다시 전송 (UX 부드럽게)
    io.to(roomCode).emit("timeUpdate", room.timeLeft);

    console.log(
      `🃏 ${playerId} → ${roomCode}에 ${
        summonedCard.name || summonedCard.cardName || "Unknown"
      } 소환 (코스트 ${costValue}), 남은 코스트: ${game.cost[playerId]}`
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
      stopSharedTimer(room);
      room.gameState = null; // ✅ 안전하고 TypeScript에 완벽히 호환하게 게임 상태 초기화
    }
  });

  // ==================== ⚔️ 카드 간 공격 (또는 직접 공격) ====================
  socket.on("attackCard", ({ roomCode, attackerId, targetId }: { roomCode: string; attackerId: string; targetId?: string }) => {
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
    if (!attacker) {
      socket.emit("error", "공격할 카드 정보를 찾을 수 없습니다.");
      return;
    }

    // ✅ 이미 공격한 카드면 다시 공격 불가
    if (!attacker.canAttack) {
      socket.emit("error", `${attacker.name}은(는) 이미 이번 턴에 공격했습니다.`);
      return;
    }

    // ✅ 상대 필드 확인
    const opponentField = game.cardsInZone[opponentId] ?? [];
    if (opponentField.length === 0) {
      socket.emit("error", "상대 필드가 비어 있습니다. 직접 공격을 시도하세요.");
      return; // 아직 공격권 소모하지 않음
    }

    // ✅ 공격 대상 찾기
    const target = opponentField.find((c) => c.id === targetId);
    if (!target) {
      socket.emit("error", "공격 대상 카드를 찾을 수 없습니다.");
      return;
    }

    // ✅ 공격 계산
    const atk = Math.max(0, Number(attacker.attack ?? 0));
    const prevHP = Number(target.hp ?? 0);
    const newHP = Math.max(0, prevHP - atk);
    target.hp = newHP;

    // ✅ 공격 성공 → 공격권 소모
    attacker.canAttack = false;

    io.to(roomCode).emit("updateCardHP", { targetId, newHP });
    console.log(`⚔️ ${attacker.name}(${atk}) → ${target.name} | HP ${prevHP} → ${newHP}`);

    // ✅ 카드 사망 처리
    if (newHP <= 0) {
      if (!game.graveyards[opponentId]) game.graveyards[opponentId] = [];
      game.graveyards[opponentId].push(target);
      game.cardsInZone[opponentId] = game.cardsInZone[opponentId].filter((c) => c.id !== targetId);

      io.to(roomCode).emit("cardDestroyed", {
        targetId,
        ownerId: opponentId,
      });
      console.log(`💀 ${target.name}이(가) 쓰러져 묘지로 이동했습니다.`);
    }

    // ✅ 상대 필드가 전부 사라졌다면 — 다음 공격부터 직접 공격 가능
    if (game.cardsInZone[opponentId].length === 0) {
      io.to(roomCode).emit("opponentFieldEmpty", { opponentId });
      console.log(`⚠️ ${opponentId}의 필드가 비었습니다. 다음 공격부터 직접 공격 가능`);
    }

    // ✅ 승패 조건 확인 (플레이어 HP가 0 이하인 경우)
    const remainingHP = game.hp[opponentId] ?? 2000;
    if (remainingHP <= 0) {
      io.to(roomCode).emit("gameOver", {
        winnerId: playerId,
        loserId: opponentId,
      });
      stopSharedTimer(room);
      room.gameState = null;
      console.log(`🏁 ${playerId} 승리 (상대 카드 전멸 후 게임 종료)`);
    }
  });

  // ==================== ⚔️ 직접 공격 ====================
  socket.on("directAttack", ({ roomCode, attackerId }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState;
    const playerId = socket.id;
    const opponentId = room.players.find((id) => id !== playerId);
    if (!opponentId) return;

    if (playerId !== game.currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      return;
    }

    const attacker = game.cardsInZone[playerId]?.find((c) => c.id === attackerId);
    if (!attacker) {
      socket.emit("error", "공격할 카드를 찾을 수 없습니다.");
      return;
    }

    // ✅ 공격 여부 확인
    if (!attacker.canAttack) {
      socket.emit("error", `${attacker.name}은(는) 이미 이번 턴에 공격했습니다.`);
      return;
    }

    // ✅ 공격 후 공격 불가로 변경
    attacker.canAttack = false;

    const damage = Math.max(0, Number(attacker.attack ?? 0));
    const prevHP = game.hp[opponentId] ?? 2000;
    const newHP = Math.max(0, prevHP - damage);
    game.hp[opponentId] = newHP;

    io.to(roomCode).emit("directAttack", {
      attackerName: attacker.name,
      damage,
      newHP,
    });

    if (newHP <= 0) {
      io.to(roomCode).emit("gameOver", {
        winnerId: playerId,
        loserId: opponentId,
      });
      stopSharedTimer(room);
      room.gameState = null;
      console.log(`🏁 ${playerId} 승리 (직접 공격으로 게임 종료)`);
    }

    console.log(`⚡ ${attacker.name} → 직접 공격 (${damage} 피해)`);
  });

  // ==================== 🔁 턴 종료 ====================
  socket.on("endTurn", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    if (socket.id !== room.gameState.currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      return;
    }

    switchTurnAndRestartTimer(io, roomCode, room); // ✅ turnCount 증가, canAttack 리셋, 코스트 증가, 타이머 재시작 모두 포함
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

      if (room.gameState) stopSharedTimer(room);

      socket.to(roomCode).emit("opponentLeft");

      if (room.players.length === 0) {
        setTimeout(() => {
          if (room.players.length === 0) {
            stopSharedTimer(room);
            delete rooms[roomCode];
          }
        }, 5000);
      }
    }
  });
}
