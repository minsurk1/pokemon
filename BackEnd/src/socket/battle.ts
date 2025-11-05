import type { Server, Socket } from "socket.io";
import { rooms } from "./room"; // ✅ room.ts의 rooms 공유
import type { CardData, GameState, RoomInfo, Event } from "../types/gameTypes"; // ✅ 공통 타입 사용
import Card from "../models/Card"; // ✅ 추가
import crypto from "crypto";
import UserDeck from "../models/UserDeck"; // ✅ 덱 로딩용 추가
import { calcDamage } from "./battle/calcDamage";

// ======================= 🔁 공유 타이머 설정 =======================
const TURN_TIME = 30; // 한 턴당 제한 시간 (초 단위)

const MAX_HP = 2000;
const MAX_COST = 8;
const EVENT_REWARD = {
  bomb: { dmg: 200 },
  heal: { heal: 500 },
  cost: { inc: 3 },
};

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
  if (room.timer) clearInterval(room.timer); // 가드
  room.timer = null;

  // ✅ 새 타이머 시작
  room.timeLeft = TURN_TIME;
  io.to(roomCode).emit("timeUpdate", room.timeLeft);

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
  // ✅ 턴 바꾸기 전에 항상 기존 타이머 정지 (중복 방지)
  stopSharedTimer(room);

  const game = room.gameState;

  let currentIndex = room.players.indexOf(game.currentTurn);

  // ✅ 혹시 currentTurn 값이 플레이어 목록에 없을 때(예: 상대가 먼저 나간 경우)
  if (currentIndex === -1) {
    console.warn(`⚠️ currentTurn not in room.players. Defaulting to host.`);
    currentIndex = 0; // 방장 기준으로 리셋
    game.currentTurn = room.players[0];
  }

  const nextIndex = (currentIndex + 1) % room.players.length;
  const nextTurn = room.players[nextIndex];

  game.currentTurn = nextTurn;

  // ✅ 선공 기준으로만 turnCount 증가
  const hostId = room.players[0];
  if (nextTurn === hostId) {
    game.turnCount = (game.turnCount ?? 0) + 1;
    console.log(`📌 선공 턴 시작 → turnCount = ${game.turnCount}`);
  }

  const p1 = room.players[0];
  const p2 = room.players[1];
  game.cardsPlayed[p1] = [];
  game.cardsPlayed[p2] = [];

  // ✅ n턴이면 n 코스트 증가 (최대 8)
  if (!game.cost[nextTurn]) game.cost[nextTurn] = 0;
  const costGain = game.turnCount; // n턴 = n 증가
  game.cost[nextTurn] = Math.min(game.cost[nextTurn] + costGain, 8);

  // ✅ 다음 턴 시작하면 해당 유저 카드 모두 공격 가능 복구
  if (game.cardsInZone[nextTurn]) {
    game.cardsInZone[nextTurn].forEach((c) => (c.canAttack = true));
  }

  // ✅ 이벤트: 선공의 턴이고, turnCount가 5의 배수일 때 & 현재 이벤트가 없을 때만 생성
  // ✅ 5턴마다 이벤트 처리 (선공 턴 기준)
  if (nextTurn === hostId && game.turnCount > 0 && game.turnCount % 5 === 0) {
    const imageServerUrl = process.env.IMAGE_URL || "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/images";

    // ✅ 기존 이벤트가 살아있다면 강제 제거
    if (game.activeEvent) {
      io.to(roomCode).emit("eventEnded", { eventId: game.activeEvent.id });
      console.log(`⚠️ 기존 이벤트 제거됨 (턴 ${game.turnCount})`);
      game.activeEvent = null;
    }

    // ✅ 이벤트 타입 랜덤 (1=bomb, 2=heal, 3=cost)
    const eventType = Math.floor(Math.random() * 3) + 1;

    const EVENT_MAP: Record<number, { img: string; msg: string; hp: number }> = {
      1: { img: "bomb.png", msg: "폭발 몬스터 등장! 처치 시 상대 체력 감소!", hp: 400 },
      2: { img: "heal.png", msg: "치유 몬스터 등장! 처치 시 체력 회복!", hp: 300 },
      3: { img: "cost.png", msg: "에너지 몬스터 등장! 처치 시 코스트 +3!", hp: 350 },
    };
    const eventData = EVENT_MAP[eventType]; // ✅ TS가 이게 절대 undefined 아닐 걸 암

    const newEvent: Event = {
      id: Date.now(),
      type: eventType,
      image: `${imageServerUrl}/${eventData.img}`,
      message: eventData.msg,
      hp: eventData.hp,
      maxHp: eventData.hp,
      effect: () => {},
    };

    game.activeEvent = newEvent;
    io.to(roomCode).emit("eventTriggered", newEvent);

    console.log(`🔥 새 이벤트 생성! type=${eventType}, turn=${game.turnCount}`);
  }

  // ✅ 타이머 리셋
  room.timeLeft = TURN_TIME;

  // ✅ 턴 정보 브로드캐스트
  io.to(roomCode).emit("turnChanged", {
    currentTurn: nextTurn,
    cost: game.cost,
    hp: game.hp,
    timeLeft: TURN_TIME,
  });

  // ✅ 전체 상태 브로드캐스트
  io.to(roomCode).emit("updateGameState", {
    hp: game.hp,
    decks: game.decks,
    hands: game.hands,
    graveyards: game.graveyards,
    cost: game.cost,
    turnCount: game.turnCount,
    cardsInZone: game.cardsInZone,
    activeEvent: game.activeEvent,
    timeLeft: TURN_TIME,
  });

  console.log(`🔁 턴 전환 → ${nextTurn}, 턴: ${game.turnCount}`);

  // ✅ 타이머 다시 시작
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
    cardsPlayed: {
      // ✅ 두 플레이어 모두 배열로
      [player1]: [],
      [player2]: [],
    },
    cardsInZone: {
      [player1]: [],
      [player2]: [],
    },

    // ✅ 코스트
    cost: {
      [player1]: 0,
      [player2]: 0,
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
    activeEvent: null, // ✅ [추가] 이벤트 상태 초기화
  };

  // ✅ 전투 시작과 동시에 타이머용 잔여 시간 먼저 세팅
  room.timeLeft = TURN_TIME;

  // 1) 게임 시작 알림 (UI용 배너/사운드 등)
  io.to(roomCode).emit("gameStart", {
    roomCode,
    currentTurn: player1,
    hp: { ...room.gameState!.hp },
    cost: { ...room.gameState!.cost },
    turnCount: 1,
  });

  // ✅ 바로 다음에 추가 — 첫 턴 즉시 배포
  io.to(roomCode).emit("turnChanged", {
    currentTurn: player1,
    cost: room.gameState.cost,
    hp: room.gameState.hp,
    timeLeft: 30, // TURN_TIME
  });

  // 2) 각 플레이어에게 전체 스냅샷(복구용 정답 상태)
  room.players.forEach((pid) => {
    io.to(pid).emit("updateGameState", {
      hp: room.gameState!.hp,
      decks: room.gameState!.decks,
      hands: room.gameState!.hands,
      graveyards: room.gameState!.graveyards,
      cost: room.gameState!.cost,
      turnCount: room.gameState!.turnCount,
      cardsInZone: room.gameState!.cardsInZone,
      activeEvent: room.gameState!.activeEvent, // ✅ [추가] 이벤트 상태 전송
      timeLeft: room.timeLeft,
    });
  });

  // 3) 원하는 경우, 타이머 숫자만 한 번 더 푸시(선택)
  io.to(roomCode).emit("timeUpdate", room.timeLeft);

  // 4) 공유 타이머 시작 (tick마다 timeUpdate, 시간만료 시 turnChanged 발생)
  startSharedTimer(io, roomCode, room);

  // ✅ 선공(방장) 첫 턴 시작 시 코스트 +1
  room.gameState.cost[player1] = 1;

  console.log(`🎮 전투 시작: 방 ${roomCode}, 첫 턴 → ${player1}`);
}

// ======================= 배틀 이벤트 핸들러 =======================
export default function battleHandler(io: Server, socket: Socket) {
  console.log(`⚔️ 배틀 소켓 연결됨: ${socket.id}`);

  // ✅ BattlePage 진입 시 현재 상태 즉시 동기화
  socket.on("joinRoom", async ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room) return;

    console.log(`📥 BattlePage joinRoom → ${socket.id}`);

    // 소켓을 다시 방에 넣어준다 (새 탭 / 새 페이지 고려)
    socket.join(roomCode);

    if (room.gameState && (!room.gameState.decks[socket.id] || room.gameState.decks[socket.id].length === 0)) {
      try {
        // 소켓에 저장된 userId를 사용 (로그인 시 저장되어 있어야 함)
        const userId = (socket as any).userId;
        if (userId) {
          const userDeck = await UserDeck.findOne({ user: userId }).populate({
            path: "cards.card",
            select: "cardName cardType tier attack hp maxhp cost image2D",
          });

          if (userDeck && userDeck.cards && userDeck.cards.length > 0) {
            const deckCards = userDeck.cards.map((c: any) => {
              const card = c.card; // ✅ populate된 실제 카드 데이터

              return {
                id: String(card._id),
                name: card.cardName,
                cardType: card.cardType,
                tier: card.tier,
                attack: card.attack,
                hp: card.hp,
                maxhp: card.hp,
                cost: card.cost,
                image2D: card.image2D, // ✅ DB의 원본 이미지 사용
                canAttack: true,
              };
            });

            // 덱 셔플
            const shuffled = [...deckCards].sort(() => Math.random() - 0.5);

            // 1코스트 카드 풀
            const oneCostPool = shuffled.filter((c) => Number(c.cost) === 1);

            let startingHand;
            if (oneCostPool.length > 0) {
              // 1코 카드 중 랜덤 1장
              const guaranteed = oneCostPool[Math.floor(Math.random() * oneCostPool.length)];

              // 나머지 덱에서 해당 카드 제외
              const pool = shuffled.filter((c) => c.id !== guaranteed.id);

              startingHand = [guaranteed, ...pool.slice(0, 2)];
              room.gameState.hands[socket.id] = startingHand;
              room.gameState.decks[socket.id] = pool.slice(2);
            } else {
              // 1코스트 없을 경우 일반 셔플
              startingHand = shuffled.slice(0, 3);
              room.gameState.hands[socket.id] = startingHand;
              room.gameState.decks[socket.id] = shuffled.slice(3);
            }

            console.log(`✅ ${socket.id} 덱 자동 로딩 완료: ${deckCards.length}장`);
            console.log("🎴 서버 덱 이미지 체크:", deckCards.map(c => ({
  name: c.name,
  image2D: c.image2D
})));

          }
        }
      } catch (error) {
        console.error(`❌ 덱 로딩 실패 (${socket.id}):`, error);
      }
    }

    // ✅ 덱은 있는데 손패가 비었으면 손패 생성 (재접속 처리)
if (room.gameState && room.gameState.decks[socket.id]?.length > 0 && room.gameState.hands[socket.id]?.length === 0) {
  const deck = room.gameState.decks[socket.id];

  // 🔍 로그 확인용 (디버깅)
  console.log(`🔁 재입장 감지 → ${socket.id}, 덱 ${deck.length}장, 손패 없음. 자동 손패 생성`);

  const oneCostPool = deck.filter((c: any) => Number(c.cost) === 1);

  let startingHand;
  if (oneCostPool.length > 0) {
    const guaranteed = oneCostPool[Math.floor(Math.random() * oneCostPool.length)];
    const pool = deck.filter((c: any) => c.id !== guaranteed.id);

    startingHand = [guaranteed, ...pool.slice(0, 2)];
    room.gameState.hands[socket.id] = startingHand;
    room.gameState.decks[socket.id] = pool.slice(2);
  } else {
    startingHand = deck.slice(0, 3);
    room.gameState.hands[socket.id] = startingHand;
    room.gameState.decks[socket.id] = deck.slice(3);
  }

  console.log(`♻️ 손패 재생성 완료:`, startingHand.map(c => c.name));
}


    // ✅ 게임 상태가 있으면 전체 상태 즉시 전달
    if (room.gameState) {
      const g = room.gameState;

      socket.emit("updateGameState", {
        hp: g.hp,
        decks: g.decks,
        hands: g.hands,
        graveyards: g.graveyards,
        cost: g.cost,
        turnCount: g.turnCount,
        cardsInZone: g.cardsInZone,
        activeEvent: g.activeEvent, // ✅ [추가] 이벤트 상태 전송
        timeLeft: room.timeLeft,
      });

      // ✅ 타이머 동기화
      if (room.timeLeft !== undefined) {
        socket.emit("timeUpdate", room.timeLeft);
      }

      if (!room.gameState || !room.gameState.currentTurn) return;
    }

    console.log(`✅ BattlePage 상태 동기화 완료 → ${socket.id}`);
  });

  // ✅ 클라이언트가 재접속했을 때 현재 상태 요청
  socket.on("getGameState", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const g = room.gameState;

    socket.emit("updateGameState", {
      hp: g.hp,
      decks: g.decks,
      hands: g.hands,
      graveyards: g.graveyards,
      cost: g.cost,
      turnCount: g.turnCount,
      cardsInZone: g.cardsInZone,
      activeEvent: g.activeEvent, // ✅ [추가] 이벤트 상태 전송
      timeLeft: room.timeLeft,
    });

    console.log(`🔁 ${socket.id} 요청 → 현재 게임 상태 재전송 완료`);
  });

  // ==================== (재접속 후) 덱 전송 ====================
  socket.on("sendDeck", ({ roomCode, deck }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    // 이미 덱 있는 플레이어가 재전송하면 무시
    if (room.gameState.decks[socket.id]?.length > 0) {
      console.log(`⚠️ ${socket.id} 덱이 이미 존재함. 중복 전송 무시.`);
      return;
    }

    // ObjectId만 들어오도록 보장 (문자열이면 문자열로 유지)
    room.gameState.decks[socket.id] = deck.map((c: any) => c.id ?? c);
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
      costValue = Number.parseInt(card.cost, 10);
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
    /*
    let dbCardData = null;
    if (!card || (!card.name && !card.cardName)) {
      socket.emit("error", "잘못된 카드 데이터입니다.");
      return;
    }

    const isValidObjectId = typeof card.id === "string" && /^[0-9a-fA-F]{24}$/.test(card.id);

if (isValidObjectId) {
  try {
    dbCardData = await Card.findById(card.id);
  } catch (err) {
    console.error("❌ DB 카드 조회 실패:", err);
  }
} else {
  console.log(`⚠️ '${card.id}' 은(는) ObjectId가 아님 → DB조회 생략`);
}
*/
    const summonedCard = {
      id: card.id,
  name: card.name,
  cardName: card.cardName,
  cardType: card.cardType,
  attack: card.attack,
  hp: card.hp,
  maxhp: card.maxhp,
  cost: card.cost,
  tier: card.tier,
  image2D: card.image2D, // ✅ 프론트 이미지 그대로 사용
  canAttack: true,
    };
    console.log("🃏 summonedCard:", summonedCard);

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

    const { damage, multiplier } = calcDamage(card, { cardType: "normal" });
    const prevHP = game.hp[opponentId] ?? 2000;
    const newHP = Math.max(0, prevHP - damage);
    game.hp[opponentId] = newHP;

    if (!Array.isArray(game.cardsPlayed[socket.id])) {
      game.cardsPlayed[socket.id] = [];
    }
    game.cardsPlayed[socket.id].push(card);

    io.to(roomCode).emit("cardPlayed", {
      playerId: socket.id,
      card,
      damage,
      multiplier,
      hp: game.hp,
    });

    console.log(`💥 ${socket.id} → ${opponentId} | 배율 x${multiplier} | 피해 ${damage}`);

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
      return;
    }

    // ✅ 공격 대상 찾기
    const target = opponentField.find((c) => c.id === targetId);
    if (!target) {
      socket.emit("error", "공격 대상 카드를 찾을 수 없습니다.");
      return;
    }

    // ✅ 공격 계산
    const { damage, multiplier } = calcDamage(attacker, target);

    const prevHP = Number(target.hp ?? 0);
    const newHP = Math.max(0, prevHP - damage);
    target.hp = newHP;

    // 효과 메시지 전달
    io.to(roomCode).emit("effectMessage", {
      attacker: attacker.name,
      defender: target.name,
      multiplier,
      damage,
    });

    // ✅ 공격 성공 → 공격권 소모
    attacker.canAttack = false;

    io.to(roomCode).emit("updateCardHP", { targetId, newHP });
    console.log(`⚔️ ${attacker.name} → ${target.name} | 배율 x${multiplier} | ${prevHP} → ${newHP} (-${damage})`);

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

    const { damage, multiplier } = calcDamage(attacker, { cardType: "normal" });
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

  // ✅ 클라이언트가 턴 요청 시 즉시 재전송
  socket.on("requestTurn", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const g = room.gameState;
    socket.emit("turnChanged", {
      currentTurn: g.currentTurn,
      cost: g.cost,
      hp: g.hp,
      timeLeft: room.timeLeft ?? 30,
    });
  });

  // ++++++++++++++++ [추가된 이벤트 공격 핸들러] ++++++++++++++++
  socket.on("attackEvent", ({ roomCode, attackerId, eventId }: { roomCode: string; attackerId: string; eventId: number }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;
    const game = room.gameState;
    const playerId = socket.id;

    if (playerId !== game.currentTurn) {
      return socket.emit("error", "당신의 턴이 아닙니다.");
    }

    // ✅ 1. 공격자 확인
    const attacker = game.cardsInZone[playerId]?.find((c) => c.id === attackerId);
    if (!attacker) {
      return socket.emit("error", "공격할 카드를 찾을 수 없습니다.");
    }
    if (!attacker.canAttack) {
      return socket.emit("error", `${attacker.name}은(는) 이미 공격했습니다.`);
    }

    // ✅ 2. 이벤트 확인
    if (!game.activeEvent || game.activeEvent.id !== eventId) {
      return socket.emit("error", "존재하지 않거나 만료된 이벤트입니다.");
    }

    const event = game.activeEvent as Event; // 타입 단언
    const atk = Math.max(0, Number(attacker.attack ?? 0));
    const prevHP = event.hp;
    const newHP = Math.max(0, prevHP - atk);

    event.hp = newHP;
    attacker.canAttack = false; // ✅ 공격권 소모

    // ✅ 모든 클라이언트에 이벤트 HP 갱신 알림
    io.to(roomCode).emit("eventHPUpdate", { eventId: event.id, newHP });
    console.log(`⚔️ ${attacker.name}(${atk}) → 이벤트(${event.id}) | HP ${prevHP} → ${newHP}`);

    // ✅ 이벤트가 파괴되었는지 확인
    if (newHP <= 0) {
      const eventType = event.type;
      const opponentId = room.players.find((id) => id !== playerId);
      if (!opponentId) return; // or throw error

      if (eventType === 1) {
        // ✅ 폭발 몬스터 → 상대 체력 감소
        const damage = 200;
        game.hp[opponentId] = Math.max(0, (game.hp[opponentId] ?? 0) - damage);

        io.to(roomCode).emit("directAttack", {
          attackerName: "이벤트 피해",
          damage,
          newHP: game.hp[opponentId],
        });
      } else if (eventType === 2) {
        // ✅ 치유 몬스터 → 내 체력 회복
        const heal = 500;
        game.hp[playerId] = Math.min(MAX_HP, (game.hp[playerId] ?? 0) + EVENT_REWARD.heal.heal);

        io.to(roomCode).emit("directAttack", {
          attackerName: "이벤트 회복",
          damage: -heal,
          newHP: game.hp[playerId],
        });
      } else if (eventType === 3) {
        // ✅ 에너지 몬스터 → 코스트 +3 (최대 8)
        game.cost[playerId] = Math.min(MAX_COST, (game.cost[playerId] ?? 0) + EVENT_REWARD.cost.inc);

        io.to(roomCode).emit("updateGameState", {
          hp: game.hp,
          decks: game.decks,
          hands: game.hands,
          graveyards: game.graveyards,
          cost: game.cost,
          turnCount: game.turnCount,
          cardsInZone: game.cardsInZone,
          activeEvent: game.activeEvent, // null
          timeLeft: room.timeLeft,
        });
      }

      // ✅ 이벤트 제거 및 알림
      const endedId = event.id;
      game.activeEvent = null;
      io.to(roomCode).emit("eventEnded", { eventId: endedId });

      console.log(`🎁 이벤트 완료! 타입 ${eventType} 보상 적용`);

      // ✅ 이벤트 종료 후 전체 상태 동기화
      io.to(roomCode).emit("updateGameState", {
        hp: game.hp,
        decks: game.decks,
        hands: game.hands,
        graveyards: game.graveyards,
        cost: game.cost,
        turnCount: game.turnCount,
        cardsInZone: game.cardsInZone,
        activeEvent: game.activeEvent, // null
        timeLeft: room.timeLeft,
      });
    }
  });
  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  // ==================== 🔁 턴 종료 ====================
  socket.on("endTurn", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    if (socket.id !== room.gameState.currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      return;
    }

    switchTurnAndRestartTimer(io, roomCode, room);
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
