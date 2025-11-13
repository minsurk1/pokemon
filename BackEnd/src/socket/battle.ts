import type { Server, Socket } from "socket.io";
import { rooms } from "./room"; // ✅ room.ts의 rooms 공유
import type { CardData, GameState, RoomInfo, Event } from "../types/gameTypes"; // ✅ 공통 타입 사용
import Card from "../models/Card"; // ✅ 추가
import crypto from "crypto";
import UserDeck from "../models/UserDeck"; // ✅ 덱 로딩용 추가
import { calcDamage } from "./battle/calcDamage";
import { detectTypeByName } from "../utils/detectTypeByName";

// ======================= 🔁 공유 타이머 설정 =======================
const TURN_TIME = 30; // 한 턴당 제한 시간 (초 단위)

const MAX_HP = 2000;
const MAX_COST = 10;
const EVENT_REWARD = {
  bomb: { dmg: 200 },
  heal: { heal: 300 },
  cost: { inc: 3 },
};

// ======================= ⚙️ Graveyard Shuffle Constants =======================
const SHUFFLE_PENALTY_HP = 300; // HP 감소량
const SHUFFLE_MIN_GRAVE = 10; // 최소 묘지 카드 수
const SHUFFLE_SUCCESS_RATE = 0.8; // 덱에 돌아올 확률 (0.0 ~ 1.0)

// 카드의 총합 개수를 계산하는 함수
function verifyCardTotal(game: GameState, playerId: string) {
  const total =
    (game.decks[playerId]?.length || 0) +
    (game.hands[playerId]?.length || 0) +
    (game.cardsInZone[playerId]?.length || 0) +
    (game.graveyards[playerId]?.length || 0);

  console.log(`🧮 ${playerId} 총 카드 수 = ${total}`);
}

/** 성장 단계 방식: 턴 구간별 코스트 증가 계산 */
function getCostIncrease(turn: number): number {
  if (turn <= 3) return 1; // 1~3턴
  if (turn <= 7) return 2; // 3~7턴
  if (turn <= 12) return 3; // 8~12턴
  if (turn <= 18) return 4; // 13~18턴
  return 5; // 19턴 이후
}

function getEffectMessage(multiplier: number): string {
  if (multiplier >= 2.0) return "효과가 굉장하다!";
  if (multiplier > 1.0) return "효과가 좋다.";
  if (multiplier === 1.0) return "보통 효과다.";
  if (multiplier < 1.0 && multiplier > 0.5) return "효과가 별로다...";
  return "효과가 거의 없다...";
}

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
  // 디버깅 로그
  console.log(`⏱ 타이머 시작: ${roomCode}`);

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

  // ✅ 성장 단계 방식 코스트 증가
  if (!game.cost[nextTurn]) game.cost[nextTurn] = 0;

  const costGain = getCostIncrease(game.turnCount);
  game.cost[nextTurn] = Math.min(game.cost[nextTurn] + costGain, MAX_COST);

  console.log(`⚡ 코스트 증가: turn=${game.turnCount} → +${costGain}`);

  // ✅ 다음 턴 시작하면 해당 유저 카드 모두 공격 가능 복구
  if (!game.cardsInZone[nextTurn]) game.cardsInZone[nextTurn] = [];
  game.cardsInZone[nextTurn].forEach((c) => (c.canAttack = true));

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
      1: {
        img: "bomb.png",
        msg: "폭발 몬스터 등장! 처치 시 상대 체력 감소!",
        hp: 400,
      },
      2: {
        img: "heal.png",
        msg: "치유 몬스터 등장! 처치 시 체력 회복!",
        hp: 300,
      },
      3: {
        img: "cost.png",
        msg: "에너지 몬스터 등장! 처치 시 코스트 +3!",
        hp: 350,
      },
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

    serverTime: Date.now(),
  });

  console.log(`🔁 턴 전환 → ${nextTurn}, 턴: ${game.turnCount}`);

  // ✅ 타이머 다시 시작
  startSharedTimer(io, roomCode, room);
}

// ======================= 배틀 초기화 =======================
export function initializeBattle(io: Server, roomCode: string, room: RoomInfo) {
  console.log(`🎯 initializeBattle 실행됨 (${roomCode})`);
  console.log("🧩 room.players =", room.players);

  if (room.players.length < 2) {
    console.error(`❌ 전투 초기화 실패: ${roomCode} 방에 플레이어가 2명 미만`);
    return;
  }

  const [player1, player2] = room.players;

  // ✅ 기존 gameState가 있으면 유지
  if (!room.gameState) {
    room.gameState = {
      currentTurn: player1,
      hp: { [player1]: MAX_HP, [player2]: MAX_HP },
      cardsInZone: { [player1]: [], [player2]: [] },
      cost: { [player1]: 0, [player2]: 0 },
      decks: { [player1]: [], [player2]: [] },
      hands: { [player1]: [], [player2]: [] },
      graveyards: { [player1]: [], [player2]: [] },
      turnCount: 1,
      activeEvent: null,
      lastShuffleTurn: {},
    };
  }

  if (!room.gameState.decks[player1]) room.gameState.decks[player1] = [];
  if (!room.gameState.decks[player2]) room.gameState.decks[player2] = [];

  const game = room.gameState;

  // ✅ 초기 손패 생성 (덱이 있고, 손패가 비었을 때만)
  for (const pid of [player1, player2]) {
    const fullDeck = [...(game.decks[pid] || [])];

    if (fullDeck.length === 0) {
      console.warn(`⚠️ ${pid}의 덱이 비어 있습니다. (sendDeck이 먼저 와야 할 수도 있음)`);
      continue;
    }

    if (!game.hands[pid] || game.hands[pid].length === 0) {
      // 1코스트 카드 필터링
      const lowCostCards = fullDeck.filter((c: any) => Number(c.cost) === 1);
      const guaranteedLowCost = lowCostCards.length > 0 ? [lowCostCards[Math.floor(Math.random() * lowCostCards.length)]] : [];

      const remainingCards = fullDeck.filter((c) => !guaranteedLowCost.includes(c));
      const otherDraws = remainingCards.sort(() => Math.random() - 0.5).slice(0, 2);
      const drawnCards = [...guaranteedLowCost, ...otherDraws];

      game.hands[pid] = drawnCards;
      game.decks[pid] = fullDeck.filter((c) => !drawnCards.some((h) => h.id === c.id));

      console.log(
        `🎴 초기 손패 (${pid}):`,
        drawnCards.map((c) => c.name)
      );
    } else {
      console.log(`🟢 ${pid}는 이미 손패가 존재함 (패스)`);
    }
  }

  // ✅ 전투 시작 시점 타이머 초기화
  if (room.timeLeft === undefined) room.timeLeft = TURN_TIME;

  // ✅ UI용 게임 시작 알림
  io.to(roomCode).emit("gameStart", {
    roomCode,
    currentTurn: player1,
    hp: { ...game.hp },
    cost: { ...game.cost },
    turnCount: 1,
  });

  // ✅ 첫 턴 정보 배포
  io.to(roomCode).emit("turnChanged", {
    currentTurn: player1,
    cost: game.cost,
    hp: game.hp,
    timeLeft: TURN_TIME,
  });

  // ✅ 전체 상태 동기화
  io.to(roomCode).emit("updateGameState", {
    hp: game.hp,
    decks: game.decks,
    hands: game.hands,
    graveyards: game.graveyards,
    cost: game.cost,
    turnCount: game.turnCount,
    cardsInZone: game.cardsInZone,
    activeEvent: game.activeEvent,
    timeLeft: room.timeLeft,

    serverTime: Date.now(),
  });

  // ✅ 타이머 시작
  startSharedTimer(io, roomCode, room);

  // ✅ 첫 턴 코스트 +1
  game.cost[player1] = 1;

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
        if (!userId) console.warn("⚠️ userId 없음 - 덱 자동 로딩 불가");
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
            console.log(
              "🎴 서버 덱 이미지 체크:",
              deckCards.map((c) => ({
                name: c.name,
                image2D: c.image2D,
              }))
            );
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

      console.log(
        `♻️ 손패 재생성 완료:`,
        startingHand.map((c) => c.name)
      );
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

        serverTime: Date.now(),
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

      serverTime: Date.now(),
    });

    console.log(`🔁 ${socket.id} 요청 → 현재 게임 상태 재전송 완료`);
  });

  // ==================== (재접속 후) 덱 전송 ====================
  socket.on("sendDeck", ({ roomCode, deck }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    // ✅ game을 최상단에서 선언 (이게 핵심!)
    const game = room.gameState!;
    const playerId = socket.id;
    const existingDeck = game.decks[playerId] || [];

    // 이미 덱이 있는 경우
    if (existingDeck.length > 0) {
      console.log(`⚠️ ${playerId}의 덱이 이미 존재함. 중복 전송 무시.`);

      // ✅ 손패가 비어 있다면 여기서 바로 생성
      if (!game.hands[playerId] || game.hands[playerId].length === 0) {
        const fullDeck = [...existingDeck];
        const costOneCards = fullDeck.filter((c) => Number(c.cost) === 1);
        const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

        let hand: any[] = [];
        if (costOneCards.length > 0) {
          const guaranteed = shuffle(costOneCards)[0];
          const remainingPool = fullDeck.filter((c) => c.id !== guaranteed.id);
          const randomTwo = shuffle(remainingPool).slice(0, 2);
          hand = [guaranteed, ...randomTwo];
        } else {
          hand = shuffle(fullDeck).slice(0, 3);
        }

        const handIds = new Set(hand.map((c) => c.id));
        const remainingDeck = fullDeck.filter((c) => !handIds.has(c.id));

        game.hands[playerId] = hand;
        game.decks[playerId] = remainingDeck;

        // ✅ 내 화면 업데이트
        io.to(playerId).emit("updateGameState", {
          decks: game.decks,
          hands: game.hands,
          graveyards: game.graveyards,
          cost: game.cost,
          hp: game.hp,
        });

        // ✅ 전체 싱크 (여기서 game 참조 오류 해결됨)
        io.to(roomCode).emit("updateGameState", {
          hp: game.hp,
          decks: game.decks,
          hands: game.hands,
          graveyards: game.graveyards,
          cost: game.cost,
          turnCount: game.turnCount,
          cardsInZone: game.cardsInZone,
          activeEvent: game.activeEvent,
          timeLeft: room.timeLeft,

          serverTime: Date.now(),
        });
      }

      return;
    }

    // ✅ 1️⃣ 덱 전체 저장
    game.decks[playerId] = deck.map((c: any) => ({
      id: String(c.id ?? c._id ?? c.cardId ?? "unknown"),
      name: String(c.name ?? c.cardName ?? "Unknown"),
      cardType: c.cardType ?? detectTypeByName(c.name) ?? "normal",
      attack: Number(c.attack ?? 0),
      hp: Number(c.hp ?? 0),
      maxhp: Number(c.maxhp ?? c.hp ?? 0),
      cost: Number(c.cost ?? c.tier ?? 1),
      tier: Number(c.tier ?? 1),
      image2D: c.image2D ?? null,
      canAttack: true,
    }));

    const fullDeck = [...game.decks[playerId]];

    // ✅ 2️⃣ 덱 유효성 검사
    if (fullDeck.length < 3) {
      io.to(playerId).emit("message", "덱에 카드가 3장 이상 있어야 게임을 시작할 수 있습니다!");
      console.warn(`⚠️ ${playerId}의 덱이 너무 작음 (${fullDeck.length}장) → 게임 불가`);
      return;
    }

    // ✅ 3️⃣ 손패 구성
    const costOneCards = fullDeck.filter((c) => Number(c.cost) === 1);
    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    let hand: any[] = [];
    if (costOneCards.length > 0) {
      const guaranteed = shuffle(costOneCards)[0];
      const remainingPool = fullDeck.filter((c) => c.id !== guaranteed.id);
      const randomTwo = shuffle(remainingPool).slice(0, 2);
      hand = [guaranteed, ...randomTwo];
    } else {
      hand = shuffle(fullDeck).slice(0, 3);
    }

    const handIds = new Set(hand.map((c) => c.id));
    const remainingDeck = fullDeck.filter((c) => !handIds.has(c.id));

    game.hands[playerId] = hand;
    game.decks[playerId] = remainingDeck;

    console.log(`📥 ${playerId}의 덱 저장 완료 (${deck.length}장)`);
    console.log(`🎴 시작 손패: ${hand.map((c) => c.name).join(", ")} / 남은 덱: ${remainingDeck.length}장`);

    // ✅ 4️⃣ 클라이언트에 즉시 반영
    io.to(playerId).emit("updateGameState", {
      hp: game.hp,
      decks: game.decks,
      hands: game.hands,
      graveyards: game.graveyards,
      cost: game.cost,
      turnCount: game.turnCount,
      cardsInZone: game.cardsInZone,
      activeEvent: game.activeEvent,
      timeLeft: room.timeLeft,
    });

    // ✅ 5️⃣ 전체 싱크
    io.to(roomCode).emit("updateGameState", {
      hp: game.hp,
      decks: game.decks,
      hands: game.hands,
      graveyards: game.graveyards,
      cost: game.cost,
      turnCount: game.turnCount,
      cardsInZone: game.cardsInZone,
      activeEvent: game.activeEvent,
      timeLeft: room.timeLeft,

      serverTime: Date.now(),
    });
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
    const img = card.image2D ?? card.image ?? `${card.cardType}Tier${card.tier}.png`;
    const instanceId = `${card.id}:${playerId}:${crypto.randomUUID()}`;

    console.log(`🎯 [타입 보정 확인] ${card.name} → 받은 cardType=${card.cardType}, 감지된=${detectTypeByName(card.name)}`);
    const summonedCard = {
      id: instanceId, // ← 매 소환마다 유일
      name: card.name,
      cardName: card.cardName,
      cardType: card.cardType ?? detectTypeByName(card.name) ?? "normal", // ✅ 타입 누락 시 자동 보정
      attack: card.attack,
      hp: card.hp,
      maxhp: card.maxhp ?? card.hp ?? 0,
      cost: card.cost,
      tier: card.tier,
      image2D: img, // ✅ 무조건 값 존재
      image: img, // ✅ 프론트 fallback 방지
      canAttack: true,
    };

    console.log("🃏 summonedCard:", summonedCard);

    // ✅ 손패에서 제거
    game.hands[playerId] = game.hands[playerId].filter((c) => c.id !== card.id);

    // ✅ 전장에 추가
    game.cardsInZone[playerId].push(summonedCard);

    // ✅ 카드 총합 검증 (덱 + 손패 + 전장 + 묘지)
    verifyCardTotal(game, playerId);

    // ✅ 7. 모든 플레이어에게 최신 상태 전송
    io.to(roomCode).emit("cardSummoned", {
      ownerId: playerId,
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

    const { damage, multiplier, message } = calcDamage(card, {
      type: "player",
      isPlayer: true,
    });
    const prevHP = game.hp[opponentId] ?? MAX_HP;
    const newHP = Math.max(0, prevHP - damage);
    game.hp[opponentId] = newHP;

    io.to(roomCode).emit("cardPlayed", {
      playerId: socket.id,
      card,
      damage,
      multiplier,
      hp: game.hp,
      message,
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

  // ==================== ⚔️ 카드 간 공격 ====================
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

    // ✅ 상대 필드가 비어 있으면 직접 공격을 안내
    if (opponentField.length === 0) {
      socket.emit("error", "상대 필드가 비어 있습니다. 카드를 선택한 뒤 플레이어를 직접 클릭해 공격하세요!");
      return;
    }

    // ✅ 공격 대상 찾기
    const target = opponentField.find((c) => c.id === targetId);
    if (!target) {
      socket.emit("error", "공격 대상 카드를 찾을 수 없습니다.");
      return;
    }

    // ✅ 타입 보정 (묘지 복귀 등으로 타입 누락될 경우 대비)
    attacker.cardType = attacker.cardType ?? detectTypeByName(attacker.name);
    target.cardType = target.cardType ?? detectTypeByName(target.name);

    console.log(`🧪 상성 검사: ${attacker.name}(${attacker.cardType}) → ${target.name}(${target.cardType})`);

    // ✅ 데미지 계산
    const { damage, multiplier, message } = calcDamage(attacker, target);

    const prevHP = Number(target.hp ?? 0);
    const newHP = Math.max(0, prevHP - damage);
    target.hp = newHP;

    // ✅ 결과 전송
    io.to(roomCode).emit("attackResult", {
      attacker: attacker.name,
      defender: target.name,
      multiplier,
      damage,
      message,
    });

    // ✅ 공격권 소모
    attacker.canAttack = false;

    // ✅ HP 갱신
    io.to(roomCode).emit("updateCardHP", {
      targetId,
      ownerId: opponentId,
      newHP,
    });
    console.log(`⚔️ ${attacker.name} → ${target.name} | 배율 x${multiplier} | ${prevHP} → ${newHP} (-${damage})`);

    // 🔥 피격 애니메이션 신호 추가
    io.to(roomCode).emit("hit", {
      targetOwner: opponentId,
      targetId,
      damage,
      multiplier,
    });

    io.to(roomCode).emit("attackAnimation", {
      attackerOwner: playerId,
      attackerId: attacker.id,
      targetType: "card",
      targetOwner: opponentId,
      targetId: target.id,
      eventId: null,
    });

    // ✅ 카드 간 전투 로그 추가
    const effectMsg = getEffectMessage(multiplier);

    io.to(roomCode).emit("addBattleLog", {
      type: "card-attack",
      attackerName: attacker.name,
      defenderName: target.name,
      damage,
      multiplier,
      effectMsg,
      prevHP,
      newHP,
    });

    // ✅ 카드 사망 처리
    if (newHP <= 0) {
      if (!game.graveyards[opponentId]) game.graveyards[opponentId] = [];
      game.graveyards[opponentId].push(target);
      verifyCardTotal(game, opponentId);
      game.cardsInZone[opponentId] = game.cardsInZone[opponentId].filter((c) => c.id !== targetId);

      io.to(roomCode).emit("cardDestroyed", {
        playerId: opponentId,
        card: target,
        graveCount: game.graveyards[opponentId].length,
      });
      console.log(`💀 ${target.name}이(가) 쓰러져 묘지로 이동했습니다.`);
    }

    // ✅ 상대 필드 비면 안내
    if (game.cardsInZone[opponentId].length === 0) {
      io.to(roomCode).emit("opponentFieldEmpty", { opponentId });
      console.log(`⚠️ ${opponentId}의 필드가 비었습니다. 다음 공격부터 직접 공격 가능`);
    }

    // ✅ 게임 종료 조건 검사
    const remainingHP = game.hp[opponentId] ?? MAX_HP;
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

  // ==================== ⚡ 직접 공격 ====================
  socket.on("directAttack", ({ roomCode, attackerId }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState;
    const playerId = socket.id;
    const opponentId = room.players.find((id) => id !== playerId);
    if (!opponentId) return;

    // ✅ 턴 확인
    if (playerId !== game.currentTurn) {
      socket.emit("error", "당신의 턴이 아닙니다.");
      return;
    }

    // ✅ 🔒 추가된 룰: 1턴에는 직접 공격 불가
    if (game.turnCount <= 1) {
      socket.emit("error", "❌ 1턴에는 직접 공격할 수 없습니다!");
      return;
    }

    // ✅ 공격자 카드 찾기
    const attacker = game.cardsInZone[playerId]?.find((c) => c.id === attackerId);
    if (!attacker) {
      socket.emit("error", "공격할 카드를 찾을 수 없습니다.");
      return;
    }

    // ✅ 이미 공격한 카드면 중복 불가
    if (!attacker.canAttack) {
      socket.emit("error", `${attacker.name}은(는) 이미 이번 턴에 공격했습니다.`);
      return;
    }

    // ✅ 공격권 소모
    attacker.canAttack = false;

    // ✅ 플레이어 직접 공격 (상성 무시)
    const { damage, multiplier, message } = calcDamage(attacker, {
      type: "player",
      isPlayer: true,
    });

    const prevHP = game.hp[opponentId] ?? MAX_HP;
    const newHP = Math.max(0, prevHP - damage);
    game.hp[opponentId] = newHP;

    console.log(`⚡ [Direct Attack] ${attacker.name} → ${opponentId} | 피해 ${damage} | 배율 x${multiplier} | HP ${prevHP} → ${newHP}`);

    io.to(roomCode).emit("attackAnimation", {
      attackerOwner: playerId,
      attackerId: attacker.id,
      targetType: "player",
      targetOwner: opponentId,
      targetId: null,
      eventId: null,
    });

    // ✅ 브로드캐스트 (모든 클라이언트)
    io.to(roomCode).emit("directAttack", {
      attackerName: attacker.name,
      attackerId: playerId,
      defenderId: opponentId,
      damage,
      newHP,
      multiplier,
      message,
    });

    // ✅ HP 업데이트 전송 (프론트 HP바 즉시 반영)
    io.to(roomCode).emit("updateHP", { hp: game.hp });

    // 🔥 피격 애니메이션 신호 (플레이어 직접 공격)
    io.to(roomCode).emit("hit", {
      targetOwner: opponentId,
      targetId: null,
      damage,
      multiplier,
    });

    // ✅ HP 0 → 게임 종료
    if (newHP <= 0) {
      io.to(roomCode).emit("gameOver", {
        winnerId: playerId,
        loserId: opponentId,
      });
      stopSharedTimer(room);
      room.gameState = null;
      console.log(`🏁 ${playerId} 승리 (직접 공격으로 게임 종료)`);
    }
  });

  // ==================== 🃏 카드 드로우 ====================
  socket.on("drawCard", ({ roomCode }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;
    const playerId = socket.id;
    const game = room.gameState;
    const deck = game.decks[playerId];
    const hand = game.hands[playerId];

    if (!deck || deck.length === 0) {
      io.to(playerId).emit("message", "덱이 비어 있습니다!");
      return;
    }

    if (hand.length >= 10) {
      io.to(playerId).emit("message", "손패가 가득 찼습니다!");
      return;
    }

    const drawnCard = deck.shift(); // 맨 위 카드 한 장
    if (!drawnCard) return;

    hand.push(drawnCard);

    console.log(`🃏 ${playerId} 드로우: ${drawnCard.name} / 남은덱 ${deck.length}`);
    io.to(playerId).emit("cardDrawn", {
      card: drawnCard, // ✅ 항상 { card: {...} } 구조
      decks: game.decks,
      hands: game.hands,
    });

    // ✅ 덱/손패 최신 반영
    game.decks[playerId] = deck;
    game.hands[playerId] = hand;

    // ✅ 검증 로그
    verifyCardTotal(game, playerId);

    // ✅ 프론트 동기화 (activeEvent 포함)
    io.to(roomCode).emit("updateGameState", {
      hp: game.hp,
      decks: game.decks,
      hands: game.hands,
      graveyards: game.graveyards,
      cardsInZone: game.cardsInZone,
      cost: game.cost,
      turnCount: game.turnCount,
      activeEvent: game.activeEvent, // ✅ 핵심
      timeLeft: room.timeLeft,

      serverTime: Date.now(),
    });
  });

  // ==================== 💀 카드 파괴 ====================
  socket.on("destroyCard", ({ roomCode, playerId, cardId }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const game = room.gameState;
    const field = game.cardsInZone[playerId];
    const grave = game.graveyards[playerId];

    const index = field.findIndex((c) => c.id === cardId);
    if (index === -1) return;

    const [destroyedCard] = field.splice(index, 1);
    grave.push(destroyedCard);

    io.to(roomCode).emit("cardDestroyed", {
      playerId,
      card: destroyedCard,
      graveCount: grave.length,
    });

    console.log(`💀 ${destroyedCard.name}이(가) 묘지로 이동`);

    // ✅ 카드 총합 검증
    verifyCardTotal(game, playerId);
  });

  // ==================== ♻️ 묘지 셔플 ====================
  socket.on("shuffleGraveyard", ({ roomCode }) => {
    console.log("📨 shuffleGraveyard 수신:", { roomCode, from: socket.id });

    const room = rooms[roomCode];
    if (!room) {
      console.log("⚠️ room 없음:", roomCode);
      socket.emit("message", "방을 찾을 수 없습니다!");
      return;
    }
    if (!room.gameState) {
      console.log("⚠️ gameState 없음:", roomCode);
      socket.emit("message", "게임이 아직 시작되지 않았습니다!");
      return;
    }

    const game = room.gameState;
    const playerId = socket.id;

    if (!game.graveyards[playerId]) game.graveyards[playerId] = [];
    if (!game.decks[playerId]) game.decks[playerId] = [];
    if (game.hp[playerId] === undefined) game.hp[playerId] = MAX_HP;

    const grave = game.graveyards[playerId];
    const deck = game.decks[playerId];

    if (!grave || !deck) {
      console.log("⚠️ grave/deck 누락:", {
        hasGrave: !!grave,
        hasDeck: !!deck,
      });
      socket.emit("message", "묘지 또는 덱 정보를 찾을 수 없습니다!");
      return;
    }

    if (!game.lastShuffleTurn) game.lastShuffleTurn = {};
    if (game.lastShuffleTurn[playerId] === game.turnCount) {
      console.log("⛔ 동일 턴 중복 요청 차단:", {
        playerId,
        turn: game.turnCount,
      });
      socket.emit("message", "이 턴에는 이미 묘지를 셔플했습니다!");
      return;
    }

    if (grave.length < SHUFFLE_MIN_GRAVE) {
      console.log("⛔ 최소 장수 미달:", {
        len: grave.length,
        need: SHUFFLE_MIN_GRAVE,
      });
      socket.emit("message", `묘지가 ${grave.length}장입니다. 최소 ${SHUFFLE_MIN_GRAVE}장 이상일 때만 셔플할 수 있습니다!`);
      return;
    }

    // ===== 실제 처리 =====
    const penaltyHP = SHUFFLE_PENALTY_HP;
    game.hp[playerId] = Math.max(0, (game.hp[playerId] ?? 0) - penaltyHP);

    const successRate = SHUFFLE_SUCCESS_RATE;
    // ✅ 1️⃣ 성공한 카드는 HP 복구 후 반환
    const returnedCards = grave
      .filter((c) => Math.random() < successRate)
      .map((c) => ({
        ...c,
        hp: c.maxhp ?? c.hp ?? 0,
        // ✅ 타입 보정 추가
        cardType: c.cardType ?? detectTypeByName(c.name) ?? "normal",
      }));

    // ✅ 2️⃣ 실패한 카드는 그대로 묘지에 남김
    const returnedIds = new Set(returnedCards.map((c) => c.id));
    const failedCards = grave.filter((c) => !returnedIds.has(c.id));

    // ✅ 3️⃣ 덱에 복구 카드 합치기
    const combined = [...deck, ...returnedCards];
    const shuffled = combined.sort(() => Math.random() - 0.5);

    game.graveyards[playerId] = [...failedCards]; // ✅ 실패 카드 유지
    game.decks[playerId] = [...shuffled]; // ✅ 덱 갱신

    // 카드 총합 검증 (안전하게 한 번만)
    if (typeof verifyCardTotal === "function") {
      try {
        verifyCardTotal(game, playerId);
      } catch (e) {
        console.log("⚠️ verifyCardTotal 에러:", e);
      }
    }

    game.lastShuffleTurn[playerId] = game.turnCount;

    // ✅ 요청자에게 먼저 응답 (묘지 정보 포함)
    socket.emit("graveyardShuffled", {
      deckCount: shuffled.length,
      returned: returnedCards.length,
      failed: failedCards.length,
      penaltyHP,
      graveyards: game.graveyards[playerId], // ✅ 남은 묘지 카드 정보 직접 전달
    });

    // ✅ 약간의 지연 후 전체 broadcast (순서 문제 방지)
    setTimeout(() => {
      io.to(roomCode).emit("updateGameState", {
        hp: game.hp,
        decks: game.decks,
        hands: game.hands,
        graveyards: game.graveyards,
        cost: game.cost,
        turnCount: game.turnCount,
        cardsInZone: game.cardsInZone,
        activeEvent: game.activeEvent,
        timeLeft: room.timeLeft,

        serverTime: Date.now(),
      });
    }, 50); // 30~50ms 사이면 충분

    console.log(`♻️ ${playerId} 묘지 셔플: ${returnedCards.length}/${grave.length} 성공 / ${failedCards.length}장 실패 / (HP -${penaltyHP})`);

    if (game.hp[playerId] <= 0) {
      const opponentId = room.players.find((id) => id !== playerId);
      if (opponentId) {
        io.to(roomCode).emit("gameOver", {
          winnerId: opponentId,
          loserId: playerId,
        });
        console.log(`💀 ${playerId} 체력 0 → ${opponentId} 승리`);
        stopSharedTimer(room);
        room.gameState = null;
      }
    }
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
    // ✅ 이벤트 공격 시 calcDamage 호출 (상성 무시)
    const { damage } = calcDamage(attacker, { type: "event", isEvent: true });

    // ✅ 💬 로그 추가 — 타입과 데미지 확인용
    console.log(`🎯 이벤트 공격: ${attacker.name}(${attacker.cardType}) → Event(${event.type}) | Damage ${damage}`);

    const prevHP = event.hp;
    const clampedHP = Math.max(0, prevHP - damage);
    const newHP = Math.max(0, prevHP - damage);
    event.hp = clampedHP; // ✅ 안전 보정

    attacker.canAttack = false; // ✅ 공격권 소모

    io.to(roomCode).emit("attackAnimation", {
      attackerOwner: playerId,
      attackerId: attacker.id,
      targetType: "event",
      targetOwner: null,
      targetId: null,
      eventId: event.id,
    });

    // ✅ 모든 클라이언트에 이벤트 HP 갱신 알림
    io.to(roomCode).emit("eventHPUpdate", {
      eventId: event.id,
      newHP: clampedHP,
    });
    console.log(`⚔️ ${attacker.name}(${damage}) → 이벤트(${event.id}) | HP ${prevHP} → ${clampedHP}`);

    // 🔥 이벤트 피격 애니메이션 신호
    io.to(roomCode).emit("hit", {
      targetOwner: null,
      targetId: event.id,
      damage,
      multiplier: 1,
    });

    // ✅ 이벤트가 파괴되었는지 확인
    if (newHP <= 0) {
      const eventType = event.type;
      const opponentId = room.players.find((id) => id !== playerId);
      if (!opponentId) return;

      // ✅ 이벤트별 효과 처리
      if (eventType === 1) {
        // 💥 폭발 몬스터 → 상대 HP 감소
        const dmg = EVENT_REWARD.bomb.dmg;
        game.hp[opponentId] = Math.max(0, (game.hp[opponentId] ?? 0) - dmg);

        io.to(roomCode).emit("directAttack", {
          attackerName: "이벤트 피해",
          damage: dmg,
          newHP: game.hp[opponentId],
        });
      } else if (eventType === 2) {
        // 💚 치유 몬스터 → 내 HP 회복
        const heal = EVENT_REWARD.heal.heal;
        game.hp[playerId] = Math.min(MAX_HP, (game.hp[playerId] ?? 0) + heal);

        io.to(roomCode).emit("directAttack", {
          attackerName: "이벤트 회복",
          damage: -heal,
          newHP: game.hp[playerId],
        });
      } else if (eventType === 3) {
        // ⚡ 에너지 몬스터 → 코스트 +3 (최대 8)
        const inc = EVENT_REWARD.cost.inc;
        game.cost[playerId] = Math.min(MAX_COST, (game.cost[playerId] ?? 0) + inc);
      }

      // ✅ 이벤트 종료 처리
      const endedId = event.id;
      if (game.activeEvent && game.activeEvent.id === eventId) {
        game.activeEvent = null;
      }
      io.to(roomCode).emit("eventEnded", { eventId: endedId });

      console.log(`🎁 이벤트 완료! 타입 ${eventType} 보상 적용`);

      // ✅ 전체 상태 동기화 (모든 클라이언트)
      io.to(roomCode).emit("updateGameState", {
        hp: game.hp,
        decks: game.decks,
        hands: game.hands,
        graveyards: game.graveyards,
        cost: game.cost,
        turnCount: game.turnCount,
        cardsInZone: game.cardsInZone,
        activeEvent: game.activeEvent,
        timeLeft: room.timeLeft,

        serverTime: Date.now(),
      });
    }
  });
  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

  // 배틀 내 채팅 기능
  socket.on("roomChat", ({ roomCode, id, userId, name, text, ts }) => {
    io.to(roomCode).emit("roomChat", {
      id,
      userId,
      name,
      text,
      ts,
    });
  });

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

  // ==================== 🏳️ 항복 ====================
  socket.on("surrender", ({ roomCode, playerId }) => {
    const room = rooms[roomCode];
    if (!room?.gameState) return;

    const surrenderingId = playerId ?? socket.id;
    const opponentId = room.players.find((id) => id !== surrenderingId);
    if (!opponentId) return;

    console.log(`🏳️ ${surrenderingId} 항복 → ${opponentId} 승리`);

    // ✅ 즉시 브로드캐스트
    io.to(roomCode).emit("gameOver", {
      winnerId: opponentId,
      loserId: surrenderingId,
      reason: "surrender",
    });

    // ✅ gameState 즉시 초기화 금지!!
    //    -> 이벤트가 먼저 클라이언트에 안전하게 전달되어야 함
    setTimeout(() => {
      stopSharedTimer(room);
      room.gameState = null;
    }, 300); // 0~300ms 사이면 충분 (전송 안정)
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
