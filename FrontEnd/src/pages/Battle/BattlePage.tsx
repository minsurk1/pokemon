// BattlePage.tsx 전체 코드
"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { CiClock1 } from "react-icons/ci";

import "./BattlePage.css";
// import MessageBox from "../../components/common/MessageBox"; // 1. MessageBox 제거
import GameOverScreen from "../../components/battle/GameOverScreen";
import CircularTimer from "../../components/battle/CircularTimer"; 
import BurnLineComponent from "../../components/battle/BurnLineComponent";
import { Card } from "../../types/Card";
import { CiFlag1 } from "react-icons/ci";

// ===================== 🔥 이벤트 시스템 추가 =====================
import EventItem from "../../components/battle/Eventitem"; 
import { detectTypeByName } from "../../utils/detectTypeByName";

interface TurnPayload {
  currentTurn?: string | null;
  cost?: Record<string, number>;
  hp?: Record<string, number>;
  timeLeft?: number;
}

// ✅ Event 인터페이스 (gameTypes.ts와 동일)
interface Event {
  id: number;
  type: number;
  image: string;
  message: string;
  hp: number;
  maxHp: number;
}

// ===================== 상수 =====================
const INITIAL_TIME = 30;
const IMAGE_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/images";

// ===================== 게임 밸런스 상수 =====================
const MAX_HP = 2000;
const MAX_COST = 10;
const EVENT_REWARD = {
  bomb: { dmg: 200 },
  heal: { heal: 300 },
  cost: { inc: 3 },
};
const GRAVEYARD_PENALTY_HP = 300;

// 🔧 DEBUG 토글
const DEBUG = false;
const dlog = (...args: any[]) => {
  if (DEBUG) console.log(...args);
};

// ✅ 파일명 추출 함수
const pickFileName = (p?: string) => {
  if (!p) return "";
  try {
    if (p.startsWith("http")) {
      const u = new URL(p);
      const seg = u.pathname.split("/").filter(Boolean);
      return seg[seg.length - 1] || "";
    }
  } catch {}
  const seg = p.split("/").filter(Boolean);
  return seg[seg.length - 1] || "";
};

// ✅ 이미지 URL 정리 함수
const getImageUrl = (imagePath: any) => {
  const p = imagePath?.image2D ?? imagePath?.image ?? imagePath ?? "";
  if (!p) return `${IMAGE_URL}/default.png`;
  if (typeof p === "string" && p.startsWith("http")) return p;
  const fname = pickFileName(p);
  return `${IMAGE_URL}/${fname || "default.png"}`;
};

// ✅ 카드 표준화 함수 (서버 → 프론트 카드 정리)
const normalizeCard = (card: any) => {
  const name = String(card.name ?? card.cardName ?? card.card?.cardName ?? "Unknown").trim();
  const detectedType = detectTypeByName(name);
  const realType = detectedType || card.cardType || card.type || card.card?.cardType || "normal";
  const img = card.image2D || card.image || card.card?.image2D || `${realType}Tier${card.tier ?? 1}.png`;

  return {
    id: String(card.id ?? card._id ?? card.cardId ?? card.card?._id ?? "unknown"),
    name,
    cardType: realType,
    tier: Number(card.tier ?? card.card?.tier ?? 1),
    attack: Number(card.attack ?? card.card?.attack ?? 0),
    hp: Number(card.hp ?? card.card?.hp ?? 0),
    maxhp: Number(card.maxhp ?? card.card?.maxhp ?? card.hp ?? 0),
    cost: Number(card.cost ?? card.card?.cost ?? 1),
    image2D: card.image2D ?? card.card?.image2D ?? null,
    image: img.startsWith("http") ? img : `https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/images/${img}`,
    canAttack: card.canAttack ?? true,
  };
};

// ✅ 카드 형태 통일 함수 (서버·클라이언트 혼합 대응)
const keepCardShape = (c: any): Card => {
  if (!c) {
    console.warn("⚠️ keepCardShape: undefined 카드 데이터 수신", c);
    return {
      id: "unknown",
      name: "Unknown",
      cardType: "normal",
      tier: 1,
      attack: 0,
      hp: 0,
      maxhp: 0,
      cost: 1,
      image: `${IMAGE_URL}/default.png`,
      canAttack: true,
    };
  }
  const base = typeof c.card === "object" && c.card !== null && !Array.isArray(c.card) ? c.card : c;
  const name = String(base.cardName ?? base.name ?? c.cardName ?? c.name ?? "Unknown").trim();
  const detectedType = detectTypeByName(name);
  const cardType = detectedType || base.cardType || c.cardType || "normal";
  const tier = Number(base.tier ?? c.tier ?? 1);
  const imagePath = base.image2D ?? base.image ?? c.image2D ?? c.image ?? `${cardType}Tier${tier}.png`;
  const finalImage = imagePath.startsWith("http") ? imagePath : `${IMAGE_URL}/${imagePath.split("/").pop()}`;

  return {
    id: String(base._id ?? base.id ?? c.id ?? crypto.randomUUID()),
    name,
    cardType,
    tier,
    attack: Number(base.attack ?? c.attack ?? 0),
    hp: Number(base.hp ?? c.hp ?? 0),
    maxhp: Number(base.maxhp ?? base.hp ?? c.maxhp ?? c.hp ?? 0),
    cost: Number(base.cost ?? c.cost ?? tier),
    image: finalImage,
    canAttack: base.canAttack ?? c.canAttack ?? true,
  };
};

// ===================== BattlePage =====================
function BattlePage({ selectedDeck }: { selectedDeck: Card[] }) {
  const socket = useSocket();
  const myId = socket.id ?? "";

  const navigate = useNavigate();
  const location = useLocation() as any;
  const roomCode: string = location?.state?.roomCode || "defaultRoomCode";

  // === 상태 ===
  const [mySocketId, setMySocketId] = useState<string | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turn, setTurn] = useState(1);
  const [showHand, setShowHand] = useState(false);
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [enemyHP, setEnemyHP] = useState(MAX_HP);
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [handCards, setHandCards] = useState<Card[]>([]);
  const [myCardsInZone, setMyCardsInZone] = useState<Card[]>([]);
  const [enemyCardsInZone, setEnemyCardsInZone] = useState<Card[]>([]);
  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);
  const [playerCostIcons, setPlayerCostIcons] = useState<number>(1);
  const [opponentCostIcons, setOpponentCostIcons] = useState<number>(1);

  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");
  const [isVictory, setIsVictory] = useState(false); 
  const [lastPlayedCardId, setLastPlayedCardId] = useState<string | null>(null);
  const [lastEnemyCardId, setLastEnemyCardId] = useState<string | null>(null);
  const [turnTime, setTurnTime] = useState(INITIAL_TIME);
  const [enemyHandCount, setEnemyHandCount] = useState<number>(8);
  const [hasShuffledThisTurn, setHasShuffledThisTurn] = useState(false);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [deckLoaded, setDeckLoaded] = useState(false);
  const [graveCount, setGraveCount] = useState(0); 
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; image: string } | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isHoldingCard, setIsHoldingCard] = useState(false);
  const [heldCard, setHeldCard] = useState<Card | null>(null);
  const pendingTurnPayload = useRef<TurnPayload | string | null>(null);
  const isMyTurnRef = useRef(isMyTurn);
  const currentTurnIdRef = useRef(currentTurnId);
  const lastTurnIdRef = useRef<string | null>(null);
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const chatHistoryRef = useRef<HTMLDivElement>(null); 

  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);
  useEffect(() => {
    currentTurnIdRef.current = currentTurnId;
  }, [currentTurnId]);
  useEffect(() => {
    if (isMyTurn) setHasShuffledThisTurn(false);
  }, [isMyTurn]);

  const addMessageToLog = useCallback((newMessage: string) => {
    if (!newMessage) return;
    const time = new Date().toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
    // 2줄로 나오는 \n을 공백으로 치환
    const singleLineMessage = newMessage.replace('\n', ' ');
    setMessageHistory(prev => [`[${time}] ${singleLineMessage}`, ...prev].slice(0, 100)); 
  }, []);

  useEffect(() => {
    if (isChatOpen && chatHistoryRef.current) {
      chatHistoryRef.current.scrollTop = 0;
    }
  }, [isChatOpen, messageHistory]);

  const applyTurnChange = useCallback(
    (payload: TurnPayload | string) => {
      console.log("✅ applyTurnChange 실행:", payload);
      const myId = socket.id;
      if (!myId) return;
      const curr = typeof payload === "string" ? payload : payload.currentTurn ?? null;
      if (curr !== null && lastTurnIdRef.current === curr) {
        console.log("⏩ 동일 턴 이벤트 무시:", curr);
        return;
      }
      lastTurnIdRef.current = curr;
      setHasDrawnThisTurn(false);
      
      if (typeof payload === "string") {
        const mine = payload === myId;
        setCurrentTurnId(payload);
        setIsMyTurn(mine);
        if (mine) {
          setMyCardsInZone((prev) => prev.map((c) => ({ ...c, canAttack: true })));
        }
        addMessageToLog(mine ? "🔵 내 턴입니다!" : "🔴 상대 턴입니다.");
        return;
      }

      const { currentTurn, cost, hp, timeLeft } = payload;
      const mine = currentTurn === myId;
      setCurrentTurnId(currentTurn ?? null);
      setIsMyTurn(mine);
      setTurnTime(timeLeft ?? INITIAL_TIME);

      if (cost) {
        setPlayerCostIcons(Number(cost[myId]) || 0);
        const oppId = Object.keys(cost).find((id) => id !== myId);
        if (oppId) setOpponentCostIcons(Number(cost[oppId]) || 0);
      }
      if (hp) {
        setPlayerHP(hp[myId] ?? MAX_HP);
        const oppId = Object.keys(hp).find((id) => id !== myId);
        if (oppId) setEnemyHP(hp[oppId] ?? MAX_HP);
      }
      if (mine) {
        setMyCardsInZone((prev) => prev.map((c) => ({ ...c, canAttack: true })));
      }
      addMessageToLog(mine ? "🔵 내 턴입니다!" : "🔴 상대 턴입니다.");
    },
    [socket.id, addMessageToLog]
  );

  useEffect(() => {
    const initTurn = (location?.state as any)?.initialTurn as string | undefined;
    const initTime = (location?.state as any)?.timeLeft as number | undefined;
    if (initTurn && !currentTurnIdRef.current) {
      applyTurnChange({ currentTurn: initTurn, timeLeft: initTime ?? INITIAL_TIME });
      dlog("⚡ 첫 턴 부트스트랩 from location.state:", initTurn, initTime);
    }
  }, [location?.state, applyTurnChange]);

  useEffect(() => {
    if (socket.connected && socket.id) {
      setMySocketId(socket.id);
    }
  }, [socket.connected, socket.id]);

  useEffect(() => {
    if (deckLoaded) return; 
    const looksLikeIds = Array.isArray(selectedDeck) && selectedDeck.length > 0 && typeof selectedDeck[0] === "string";

    if (!selectedDeck || selectedDeck.length === 0 || looksLikeIds) {
      (async () => {
        try {
          const token = localStorage.getItem("token");
          const res = await fetch("https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api/userdeck/single", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await res.json();
          if (data?.deck?.cards?.length) {
            const cards = data.deck.cards.map(keepCardShape);
            const shuffled = [...cards].sort(() => Math.random() - 0.5);
            const costOneCards = shuffled.filter((c) => Number(c.cost) === 1);
            let startingHand: Card[] = [];
            let restDeck: Card[] = [];
            if (costOneCards.length > 0) {
              const oneCost = costOneCards[Math.floor(Math.random() * costOneCards.length)];
              const pool = shuffled.filter((c) => c.id !== oneCost.id);
              const rest = pool.slice(0, 2);
              startingHand = [oneCost, ...rest];
              restDeck = pool.slice(2);
            } else {
              startingHand = shuffled.slice(0, 3);
              restDeck = shuffled.slice(3);
            }
            setHandCards(startingHand);
            setDeckCards(restDeck);
            setDeckLoaded(true);
          } else {
            console.warn("⚠️ 덱 데이터가 없습니다.");
          }
        } catch (e) {
          console.error("❌ 덱 불러오기 실패:", e);
        }
      })();
    } else {
      const cards = selectedDeck.map(keepCardShape);
      console.log("✅ 전달받은 덱 사용:", cards);
      const shuffle = (arr: Card[]) => [...arr].sort(() => Math.random() - 0.5);
      const costOneCards = cards.filter((c) => Number(c.cost) === 1);
      let startingHand: Card[] = [];
      let restDeck: Card[] = [];
      if (costOneCards.length > 0) {
        const oneCard = shuffle(costOneCards)[0];
        const pool = cards.filter((c) => c.id !== oneCard.id);
        const randomTwo = shuffle(pool).slice(0, 2);
        startingHand = [oneCard, ...randomTwo];
        restDeck = shuffle(pool.slice(2));
      } else {
        const shuffled = shuffle(cards);
        startingHand = shuffled.slice(0, 3);
        restDeck = shuffled.slice(3);
      }
      setHandCards(startingHand);
      setDeckCards(restDeck);
      setDeckLoaded(true);
    }
  }, [selectedDeck]);

  useEffect(() => {
    console.log("🎮 BattlePage 연결 및 상태 요청 완료:", socket.id);
    if (!socket.connected || !socket.id) return;
    socket.emit("joinRoom", roomCode);
    socket.emit("getGameState", { roomCode });
    socket.emit("requestTurn", { roomCode });
  }, []);

  useEffect(() => {
    if (!socket.connected) return;
    if (!selectedDeck || selectedDeck.length === 0) return;
    const isIdArray = Array.isArray(selectedDeck) && selectedDeck.length > 0 && typeof selectedDeck[0] === "string";
    if (isIdArray) return; 
    if ((window as any)._deckSent) return;
    socket.emit("sendDeck", {
      roomCode,
      deck: selectedDeck.map(keepCardShape),
    });
    (window as any)._deckSent = true;
    console.log("🚀 덱 서버 전송 완료:", selectedDeck);
  }, [socket.connected, selectedDeck, roomCode]);

  useEffect(() => {
    console.log("🧪 handCards:", handCards.length, handCards.map((c) => c.name));
    console.log("🧪 deckCards:", deckCards.length);
  }, [handCards, deckCards]);

  useEffect(() => {
    console.log("🧪 deckLoaded:", deckLoaded);
  }, [deckLoaded]);

  const drawCard = useCallback(() => {
    if (!isMyTurn) {
      addMessageToLog("지금은 당신의 턴이 아닙니다!");
      return;
    }
    if (hasDrawnThisTurn) {
      addMessageToLog("이번 턴에는 이미 드로우했습니다!");
      return;
    }
    socket.emit("drawCard", { roomCode, playerId: socket.id });
    setHasDrawnThisTurn(true);
  }, [socket, isMyTurn, hasDrawnThisTurn, roomCode, addMessageToLog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") {
        drawCard();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawCard]);

  useEffect(() => {
    console.log("🌐 socket listeners registered once");
    if (!socket.connected) return;

    const onAttackResult = (data: any) => {
      const { attacker, defender, damage, multiplier, message } = data;
      console.log(`⚔️ ${attacker} → ${defender} | ${damage} 피해 (${message}, x${multiplier})`);
      addMessageToLog(`${attacker} ➤ ${defender} ${message} (x${multiplier})`);
    };
    const onDirectAttackEnhanced = (data: any) => {
      const { attackerName, damage, newHP, multiplier, message } = data;
      const iAmAttacker = currentTurnIdRef.current === socket.id;
      if (damage < 0) {
        if (!iAmAttacker) {
          setPlayerHP(newHP);
          addMessageToLog(`✨ ${attackerName}으로 ${-damage} HP 회복!`);
        }
      } else {
        if (iAmAttacker) setEnemyHP(newHP);
        else setPlayerHP(newHP);
        addMessageToLog(message ? `💥 ${attackerName}의 공격! ${message} (x${multiplier ?? 1})` : `💥 ${attackerName}이(가) ${damage} 피해를 입혔습니다!`);
      }
    };
    const onCardPlayedEnhanced = (data: any) => {
      if (data.message) {
        addMessageToLog(data.message);
      }
      console.log(`🃏 ${data.card.name} 소환 (${data.message ?? "일반 효과"})`);
    };
    const onError = (msg: string) => {
      addMessageToLog(`🚫 오류: ${msg}`);
    };
    const onGameStart = ({ currentTurn, hp, cost }: any) => {
      const myId = socket.id;
      if (!myId) return;
      console.log("🎮 [onGameStart] 실행:", { currentTurn, myId });
      setPlayerHP(hp[myId] ?? MAX_HP);
      const opp = Object.keys(hp).find((id) => id !== myId);
      if (opp) setEnemyHP(hp[opp] ?? MAX_HP);
      setHasDrawnThisTurn(false);
      setTurn(1);
      setCurrentTurnId(currentTurn);
      setIsMyTurn(currentTurn === myId);
      addMessageToLog(currentTurn === myId ? "🔵 게임 시작! (내 턴)" : "🔴 상대 선공!");
      setTimeout(() => {
        applyTurnChange({ currentTurn, hp, cost, timeLeft: 30 });
        console.log("✅ applyTurnChange(초기) 호출 완료");
      }, 300);
    };
    const onTurnChanged = (payload: TurnPayload | string) => {
      console.log("🔥 turnChanged 수신:", payload);
      if (!socket.id) {
        console.log("⏳ socket.id 없음 → pending 저장:", payload);
        pendingTurnPayload.current = payload;
        return;
      }
      applyTurnChange(payload);
      if (pendingTurnPayload.current) {
        applyTurnChange(pendingTurnPayload.current);
        pendingTurnPayload.current = null;
      }
    };
    const onUpdateGameState = (data: any) => {
      const { hp, cost, decks, hands, graveyards, cardsInZone, turnCount, timeLeft, currentTurn } = data;
      const myId = socket?.id;
      if (!myId) return;
      dlog("📥 updateGameState 수신:", data);
      if (typeof currentTurn === "string") {
        if (currentTurnIdRef.current !== currentTurn) {
          applyTurnChange({ currentTurn, timeLeft: typeof timeLeft === "number" ? timeLeft : undefined });
          dlog("⚡ updateGameState에서 턴 동기화:", currentTurn, timeLeft);
        } else if (typeof timeLeft === "number") {
          setTurnTime(timeLeft);
        }
      } else if (typeof timeLeft === "number") {
        setTurnTime(timeLeft);
      }
      if (typeof turnCount === "number") setTurn(turnCount);
      if (hp) {
        if (hp[myId] !== undefined) setPlayerHP(hp[myId]);
        const enemyId = Object.keys(hp).find((id) => id !== myId);
        if (enemyId && hp[enemyId] !== undefined) setEnemyHP(hp[enemyId]);
      }
      if (cost) {
        setPlayerCostIcons(Number(cost[myId]) || 0);
        const oppId = Object.keys(cost).find((id) => id !== myId);
        if (oppId) setOpponentCostIcons(Number(cost[oppId]) || 0);
      }
      if (hands?.[myId]) {
        setHandCards(hands[myId].map(keepCardShape));
      }
      if (decks?.[myId] && decks[myId].length > 0) {
        setDeckCards(decks[myId].map(keepCardShape));
        if (!deckLoaded) setDeckLoaded(true);
      }
      if (graveyards?.[myId]) {
        setGraveCount(graveyards[myId].length);
      }
      if (cardsInZone?.[myId]) {
        setMyCardsInZone(cardsInZone[myId].map((c: any) => keepCardShape(c)));
      }
      const oppId = Object.keys(cardsInZone || {}).find((id) => id !== myId);
      if (oppId && cardsInZone?.[oppId]) {
        setEnemyCardsInZone(cardsInZone[oppId].map((c: any) => keepCardShape(c)));
      }
      if (data.activeEvent) setActiveEvents([data.activeEvent]);
      else setActiveEvents([]);
    };
    const onCardSummoned = ({ playerId, card, updatedCost, cost }: any) => {
      console.log(`🃏 카드 소환 수신 from ${playerId} | 카드: ${card.name}`);
      const fixedCard = normalizeCard(card);
      fixedCard.attack = Number(fixedCard.attack ?? card.attack ?? card.damage ?? 0);
      fixedCard.hp = Number(fixedCard.hp ?? card.hp ?? 0);
      fixedCard.maxhp = Number(fixedCard.maxhp ?? card.maxhp ?? card.hp ?? 0);
      fixedCard.cost = Number(fixedCard.cost ?? card.cost ?? card.tier ?? 1);
      const newCard = { ...fixedCard, canAttack: true };
      if (playerId === socket.id) {
        setMyCardsInZone((prev) => {
          if (prev.find((c) => c.id === fixedCard.id)) return prev;
          return [...prev, newCard];
        });
        setLastPlayedCardId(fixedCard.id);
        setTimeout(() => setLastPlayedCardId(null), 1000);
        if (typeof updatedCost === "number") {
          setPlayerCostIcons(Math.max(0, updatedCost));
        }
      } else {
        setEnemyCardsInZone((prev) => {
          if (prev.find((c) => c.id === fixedCard.id)) return prev;
          return [...prev, fixedCard];
        });
        setLastEnemyCardId(fixedCard.id);
        setTimeout(() => setLastEnemyCardId(null), 1000);
        addMessageToLog(`상대가 ${fixedCard.name}을(를) 소환했습니다!`);
      }
      if (cost && typeof cost === "object") {
        const myId = socket.id ?? "";
        const opponentId = Object.keys(cost).find((id) => id !== myId);
        if (opponentId && cost[opponentId] !== undefined) {
          setOpponentCostIcons(Math.max(0, Number(cost[opponentId])));
        }
      }
    };
    const onUpdateCardHP = (data: any) => {
      const { targetId, ownerId, newHP } = data;
      if (ownerId === socket.id) {
        setMyCardsInZone((prev) => prev.map((c) => (c.id === targetId ? { ...c, hp: newHP } : c)));
      } else {
        setEnemyCardsInZone((prev) => prev.map((c) => (c.id === targetId ? { ...c, hp: newHP } : c)));
      }
    };
    const onGameOver = ({ winnerId }: any) => {
      const myId = socket.id ?? null;
      const didIWin = myId === winnerId;
      setIsVictory(didIWin);
      setGameOverMessage(didIWin ? "🎉 승리했습니다!" : "💀 패배했습니다...");
      setShowGameOver(true);
    };
    const onTimeUpdate = (time: number) => {
      if (typeof time !== "number") return;
      if (!currentTurnIdRef.current) return;
      setTurnTime(time);
      dlog(`🕒 timeUpdate: ${time}초 (isMyTurn=${isMyTurnRef.current})`);
    };
    const onTurnTimeout = () => {
      console.log("⏰ 턴 제한시간 만료");
      addMessageToLog("⏰ 시간이 초과되어 턴이 자동으로 넘어갑니다!");
      setIsMyTurn(false);
      setTurnTime(0);
    };
    const onEventTriggered = (eventData: Event) => {
      console.log("🔥 이벤트 발동 수신:", eventData);
      setActiveEvents([eventData]);
      addMessageToLog(`🚨 ${eventData.message}`);
    };
    const onEventHPUpdate = ({ eventId, newHP }: { eventId: number; newHP: number }) => {
      setActiveEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, hp: newHP } : e)));
    };
    const onEventEnded = ({ eventId }: { eventId: number }) => {
      setActiveEvents((prev) => prev.filter((e) => e.id !== eventId));
      addMessageToLog(`🎉 이벤트가 종료되었습니다! (보상 획득)`);
    };
    const onCardDrawn = ({ card, decks, hands }: any) => {
      const myId = socket?.id;
      if (!myId) return;
      const newCard = keepCardShape(card);
      setHandCards(hands?.[myId]?.map(keepCardShape) ?? ((prev) => [...prev, newCard]));
      if (decks?.[myId] && decks[myId].length < deckCards.length) {
        setDeckCards(decks[myId].map(keepCardShape));
      } else {
        setDeckCards((prev) => prev.slice(0, -1));
      }
      addMessageToLog(`📥 ${newCard.name} 카드를 드로우했습니다!`);
    };
    const onCardDestroyedWithGrave = ({ playerId, card, graveCount }: any) => {
      if (!card) {
        console.warn("⚠️ onCardDestroyedWithGrave: 카드 데이터 없음", { playerId, graveCount });
        return;
      }
      if (playerId === socket.id) {
        setMyCardsInZone((prev) => prev.filter((c) => c.id !== card.id));
        setGraveCount(graveCount);
        addMessageToLog(`💀 ${card.name}이(가) 내 묘지로 이동했습니다.`);
      } else {
        setEnemyCardsInZone((prev) => prev.filter((c) => c.id !== card.id));
        addMessageToLog(`🔥 상대의 ${card.name}이(가) 쓰러졌습니다!`);
      }
    };
    const onGraveyardShuffled = (data: any) => {
      const { deckCount, returned, failed, penaltyHP, decks, graveyards, hp } = data;
      const myId = socket?.id;
      if (!myId) return;
      if (decks?.[myId]) {
        setDeckCards(decks[myId].map(keepCardShape));
      } else {
        setDeckCards((prev) => [...prev]);
      }
      if (graveyards?.[myId]) {
        setGraveCount(graveyards[myId].length);
      } else {
        setGraveCount((prev) => Math.max(0, prev - returned));
      }
      if (hp?.[myId]) {
        setPlayerHP(hp[myId]);
      }
      addMessageToLog(`♻️ 묘지를 섞었습니다! 성공 ${returned}장 / 실패 ${failed}장 (HP -${penaltyHP})`);
    };

    socket.on("error", onError);
    socket.on("gameStart", onGameStart);
    socket.on("turnChanged", onTurnChanged);
    socket.on("updateGameState", onUpdateGameState);
    socket.on("attackResult", onAttackResult);
    socket.on("directAttack", onDirectAttackEnhanced);
    socket.on("cardPlayed", onCardPlayedEnhanced);
    socket.on("cardSummoned", onCardSummoned);
    socket.on("updateCardHP", onUpdateCardHP);
    socket.on("gameOver", onGameOver);
    socket.on("timeUpdate", onTimeUpdate);
    socket.on("turnTimeout", onTurnTimeout);
    socket.on("eventTriggered", onEventTriggered);
    socket.on("eventHPUpdate", onEventHPUpdate);
    socket.on("eventEnded", onEventEnded);
    socket.on("cardDrawn", onCardDrawn);
    socket.on("cardDestroyed", onCardDestroyedWithGrave);
    socket.on("graveyardShuffled", onGraveyardShuffled);

    return () => {
      socket.off("error", onError);
      socket.off("gameStart", onGameStart);
      socket.off("turnChanged", onTurnChanged);
      socket.off("updateGameState", onUpdateGameState);
      socket.off("attackResult", onAttackResult);
      socket.off("directAttack", onDirectAttackEnhanced);
      socket.off("cardPlayed", onCardPlayedEnhanced);
      socket.off("cardSummoned", onCardSummoned);
      socket.off("updateCardHP", onUpdateCardHP);
      socket.off("gameOver", onGameOver);
      socket.off("timeUpdate", onTimeUpdate);
      socket.off("turnTimeout", onTurnTimeout);
      socket.off("eventTriggered", onEventTriggered);
      socket.off("eventHPUpdate", onEventHPUpdate);
      socket.off("eventEnded", onEventEnded);
      socket.off("cardDrawn", onCardDrawn);
      socket.off("cardDestroyed", onCardDestroyedWithGrave);
      socket.off("graveyardShuffled", onGraveyardShuffled);
    };
  }, [roomCode, addMessageToLog, applyTurnChange, deckCards.length, deckLoaded, socket]);

  useEffect(() => {
    if (!socket) return;
    const onMessage = (msg: string) => {
      console.log("📩 서버 message 수신:", msg);
      addMessageToLog(msg);
    };
    const onGraveyardShuffled = (data: any) => {
      setHasShuffledThisTurn(true);
      addMessageToLog(`♻️ 묘지를 섞었습니다! (${data.returned}장 성공, ${data.failed}장 실패, HP -${data.penaltyHP})`);
    };
    socket.on("message", onMessage);
    socket.on("graveyardShuffled", onGraveyardShuffled);
    return () => {
      socket.off("message", onMessage);
      socket.off("graveyardShuffled", onGraveyardShuffled);
    };
  }, [socket, addMessageToLog]);

  useEffect(() => {
    if (socket.id && deckLoaded) {
      console.log("[INIT TURN CHECK]", { socket: socket.id, currentTurnId, isMyTurn, turn });
    }
  }, [socket.id, deckLoaded, currentTurnId, isMyTurn, turn]);

  useEffect(() => {
    if (socket.id && pendingTurnPayload.current) {
      console.log("⚡ pending turn 적용:", pendingTurnPayload.current);
      applyTurnChange(pendingTurnPayload.current);
      pendingTurnPayload.current = null;
    }
  }, [socket.id, applyTurnChange]);

  const handleHandClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (handCards.length === 0) return;
    setShowHand(!showHand);
  };
  const handleToggleHand = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setShowHand(!showHand);
  };

  const handleCardClick = (cardId: string, fromZone: boolean, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isMyTurn) {
      addMessageToLog("상대방 턴입니다.");
      return;
    }
    if (fromZone) {
      if (selectedAttacker === cardId) {
        setSelectedAttacker(null);
      } else {
        setSelectedAttacker(cardId);
        addMessageToLog("🎯 공격할 상대 카드를 선택하세요!");
      }
      return;
    }
    const card = handCards.find((c) => c.id === cardId);
    if (!card) return;
    const fixedType = detectTypeByName(card.name);
    const normalizedCard = { ...normalizeCard(card), cardType: fixedType || card.cardType || "normal", image2D: card.image2D ?? card.image ?? null };
    const cardCost = Number(normalizedCard.cost) || 0;
    if (cardCost > playerCostIcons) {
      addMessageToLog("코스트가 부족합니다!");
      return;
    }
    if (myCardsInZone.length >= 5) {
      addMessageToLog("카드 존이 가득 찼습니다! (최대 5장)");
      return;
    }
    setHandCards((prev) => prev.filter((c) => c.id !== cardId));
    setShowHand(false);
    console.log("🎯 소환 시 전송되는 카드:", normalizedCard);
    socket.emit("summonCard", { roomCode, card: normalizedCard });
  };

  const handleDragStart = (attackerId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation();
    setIsHoldingCard(false);
    setHeldCard(null);
    const attacker = myCardsInZone.find((c) => c.id === attackerId);
    if (!attacker) return;
    e.dataTransfer.setData("attackerId", attackerId);
    e.dataTransfer.effectAllowed = "move";
    setIsDragActive(true);
    const img = new Image();
    img.src = getImageUrl(attacker.image);
    e.dataTransfer.setDragImage(img, -9999, -9999);
    setDragPreview({ x: e.clientX, y: e.clientY, image: getImageUrl(attacker.image) });
  };
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragPreview && e.clientX && e.clientY) {
      setDragPreview((prev) => prev && { ...prev, x: e.clientX, y: e.clientY });
    }
  };
  const handleDragEnd = () => {
    setDragPreview(null);
    setDragOverTargetId(null);
    setIsDragActive(false);
  };
  const handleCardMouseDown = (card: Card, e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMyTurn) return;
    setIsHoldingCard(true);
    setHeldCard(card);
    setDragPreview({ x: e.clientX, y: e.clientY, image: getImageUrl(card.image) });
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isHoldingCard) {
      setDragPreview((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
    }
  };
  const handleMouseUp = () => {
    setIsHoldingCard(false);
    setHeldCard(null);
    setDragPreview(null);
  };

  const handleAttack = (targetId?: string, attackerIdParam?: string) => {
    const attackerId = attackerIdParam || selectedAttacker;
    if (!attackerId) return;
    const attacker = myCardsInZone.find((c) => c.id === attackerId);
    if (!attacker) return;
    if (attacker.canAttack === false) {
      addMessageToLog(`${attacker.name}은(는) 이미 이번 턴에 공격했습니다!`);
      return;
    }
    if (enemyCardsInZone.length === 0) {
      socket.emit("directAttack", { roomCode, attackerId: attacker.id });
      addMessageToLog(`💥 ${attacker.name}이(가) 상대 플레이어를 직접 공격합니다!`);
      setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));
      setSelectedAttacker(null);
      return;
    }
    if (targetId) {
      const target = enemyCardsInZone.find((c) => c.id === targetId);
      if (!target) return;
      const attackPower = Number(attacker.attack ?? 0);
      const newHP = Math.max(0, target.hp - attackPower);
      addMessageToLog(`🔥 ${attacker.name} ➤ ${target.name}에게 ${attackPower} 피해!`);
      if (newHP <= 0) {
        setTimeout(() => {
          setEnemyCardsInZone((prev) => prev.filter((c) => c.id !== targetId));
          addMessageToLog(`💥 ${target.name}이(가) 쓰러졌습니다!`);
        }, 600);
      }
      socket.emit("attackCard", { roomCode, attackerId: attacker.id, targetId });
      setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));
      setSelectedAttacker(null);
    }
  };

  const handleEnemyCardClick = (targetId: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isMyTurn) {
      addMessageToLog("상대방 턴입니다.");
      return;
    }
    if (!selectedAttacker) {
      addMessageToLog("먼저 내 필드의 카드를 클릭해 공격자를 지정하세요!");
      return;
    }
    handleAttack(targetId);
  };

  const handleEventAttack = (eventId: number) => {
    if (!isMyTurn) {
      addMessageToLog("상대방 턴입니다!");
      return;
    }
    if (!selectedAttacker) {
      addMessageToLog("먼저 공격할 내 카드를 선택하세요!");
      return;
    }
    const attacker = myCardsInZone.find((c) => c.id === selectedAttacker);
    if (!attacker) return;
    if (!attacker.canAttack) {
      addMessageToLog(`${attacker.name}은(는) 이미 공격했습니다!`);
      return;
    }
    addMessageToLog(`⚔️ ${attacker.name}이(가) 이벤트를 공격합니다!`);
    socket.emit("attackEvent", { roomCode, attackerId: attacker.id, eventId });
    setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));
    setSelectedAttacker(null);
    setActiveEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, hp: Math.max(0, e.hp - (attacker.attack ?? 0)), temp: true } 
          : e
      )
    );
    setTimeout(() => {}, 500);
  };

  const handleEndTurn = useCallback(() => {
    if (!isMyTurn) return;
    socket.emit("endTurn", { roomCode });
    addMessageToLog("🔚 턴을 종료했습니다!");
  }, [isMyTurn, roomCode, socket, addMessageToLog]);

  const handleDirectAttackOnEnemy = useCallback(
    (attackerIdParam?: string) => {
      if (!isMyTurn) {
        addMessageToLog("지금은 당신의 턴이 아닙니다!");
        return;
      }
      if (enemyCardsInZone.length > 0) {
        addMessageToLog("상대 필드에 카드가 있습니다! 카드를 먼저 공격하세요!");
        return;
      }
      if (turn <= 1) {
        addMessageToLog("❌ 1턴에는 직접 공격할 수 없습니다!");
        return;
      }
      const attackerId = attackerIdParam || selectedAttacker;
      if (!attackerId) {
        addMessageToLog("먼저 공격할 내 카드를 선택하세요!");
        return;
      }
      const attacker = myCardsInZone.find((c) => c.id === attackerId);
      if (!attacker) return;
      if (!attacker.canAttack) {
        addMessageToLog(`${attacker.name}은(는) 이미 이번 턴에 공격했습니다!`);
        return;
      }
      socket.emit("directAttack", { roomCode, attackerId });
      addMessageToLog(`💥 ${attacker.name}이(가) 상대 플레이어를 직접 공격합니다!`);
      setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));
      setSelectedAttacker(null);
    },
    [isMyTurn, enemyCardsInZone, selectedAttacker, myCardsInZone, roomCode, socket, turn, addMessageToLog]
  );

  const handleEnemyZoneInteraction = useCallback(
    (e?: React.MouseEvent | React.DragEvent) => {
      if (!isMyTurn) return;
      if (!e) return;
      if (enemyCardsInZone.length > 0) return;
      let attackerId: string | null = null;
      if ("dataTransfer" in e && e.dataTransfer) {
        attackerId = e.dataTransfer.getData("attackerId") || selectedAttacker;
      } else {
        attackerId = selectedAttacker;
      }
      if (!attackerId) {
        addMessageToLog("먼저 공격할 내 카드를 선택하세요!");
        return;
      }
      const attacker = myCardsInZone.find((c) => c.id === attackerId);
      if (!attacker) return;
      if (!attacker.canAttack) {
        addMessageToLog(`${attacker.name}은(는) 이미 이번 턴에 공격했습니다!`);
        return;
      }
      handleDirectAttackOnEnemy(attackerId);
      setIsDragActive(false);
    },
    [isMyTurn, enemyCardsInZone, selectedAttacker, myCardsInZone, handleDirectAttackOnEnemy, addMessageToLog]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "e") {
        e.preventDefault();
        handleEndTurn();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleEndTurn]);

  const handleSurrender = () => {
    setIsVictory(false);
    setGameOverMessage("🏳️ 항복했습니다.");
    setShowGameOver(true);
    // socket.emit("surrender", { roomCode });
  };

  if (!socket) {
    return <div style={{ color: "white", padding: 20 }}>서버 연결 중... 잠시만 기다려주세요.</div>;
  }

  // ===== 렌더 =====
  return (
    <div className="battle-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      
      <div className={`chat-log-container ${isChatOpen ? "chat-open" : "chat-unopen"}`}>
        <div className="chat-log-header" onClick={() => setIsChatOpen(!isChatOpen)}>
          <span className="chat-log-toggle">{isChatOpen ? "▼" : "►"}</span>
          <span className="chat-log-title">게임 로그</span>
        </div>
        
        {isChatOpen ? (
          <div className="chat-log-history" ref={chatHistoryRef}>
            {messageHistory.length === 0 && (
              <div className="chat-log-message placeholder">게임이 시작되었습니다.</div>
            )}
            {messageHistory.map((msg, index) => (
              <div key={index} className="chat-log-message">
                {msg}
              </div>
            ))}
          </div>
        ) : (
          <div className="chat-log-latest">
            {messageHistory[0] || "게임 로그가 여기에 표시됩니다."}
          </div>
        )}
      </div>

      {/* === 전장 === */}
      <div className="field-container">
        <div className="Top-Line" />
        <div className="TopLeft-Dia" />
        <div className="TopRight-Dia" />
        <div className="Bottom-Line" />
        <div className="BottomLeft-Dia" />
        <div className="BottomRight-Dia" />
        <div className="enemy-card-bg" />
        <div
          className={`enemy-field ${
            isMyTurn && selectedAttacker && enemyCardsInZone.length === 0 ? `enemy-direct-attack ${isDragActive ? "drag-active" : ""}` : ""
          }`}
          onClick={(e) => handleEnemyZoneInteraction(e)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleEnemyZoneInteraction(e)}
          role="button"
          tabIndex={0}
        />

        <div className="player-card-bg" />
        <div className="player-field" />
        
        <div className="enemy-hand-zone">
          {Array.from({ length: enemyHandCount }).map((_, i) => (
            <div key={i} className="enemy-hand-card" />
          ))}
        </div>
        
        <div
          className={`enemy-card-zone ${
            isMyTurn && selectedAttacker && enemyCardsInZone.length === 0 ? `enemy-direct-attack ${isDragActive ? "drag-active" : ""}` : ""
          }`}
          onClick={(e) => handleEnemyZoneInteraction(e)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleEnemyZoneInteraction(e)}
        >
          {enemyCardsInZone.length > 0 ? (
            enemyCardsInZone.map((card) => (
              <div
                key={card.id}
                className={`enemy-card-slot enemy-clickable ${lastEnemyCardId === card.id ? "fade-in-card" : ""}`}
                onClick={(e) => {
                  if (!isMyTurn) return;
                  if (!selectedAttacker) {
                    addMessageToLog("먼저 공격할 내 카드를 선택하세요!");
                    return;
                  }
                  handleEnemyCardClick(card.id, e);
                }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const attackerId = e.dataTransfer.getData("attackerId");
                  if (attackerId) handleAttack(card.id, attackerId);
                }}
              >
                <div className="enemy-card in-zone" onMouseDown={(e) => handleCardMouseDown(card, e)}>
                  <img src={getImageUrl(card.image)} alt={card.name} />
                  <div className="card-hp-bar">
                    <div className="card-hp-bar-inner" style={{ width: `${(card.hp / card.maxhp) * 100}%` }} />
                    <div className="card-hp-text">
                      {card.hp}/{card.maxhp}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-zone-text">상대 필드가 비어있습니다</div>
          )}
        </div>

        <BurnLineComponent timeLeft={turnTime} isMyTurn={isMyTurn} />
        
        <div className="player-card-zone">
          {myCardsInZone.length > 0 ? (
            myCardsInZone.map((card) => (
              <div key={card.id} className={`card-slot ${lastPlayedCardId === card.id ? "fade-in-card" : ""}`}>
                <div
                  className={`my-card in-zone ${card.canAttack ? "can-attack" : "cannot-attack"}`}
                  draggable={isMyTurn}
                  onMouseDown={(e) => card.canAttack && handleCardMouseDown(card, e)}
                  onDragStart={(e) => card.canAttack && handleDragStart(card.id, e)}
                  onDrag={(e) => card.canAttack && handleDrag(e)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => {
                    if (!card.canAttack) {
                      addMessageToLog(`${card.name}은(는) 이미 이번 턴에 공격했습니다!`);
                      return;
                    }
                    handleCardClick(card.id, true, e);
                  }}
                >
                  <img src={getImageUrl(card.image)} alt={card.name} />
                  <div className="card-hp-bar">
                    <div className="card-hp-bar-inner" style={{ width: `${(card.hp / card.maxhp) * 100}%` }} />
                    <div className="card-hp-text">
                      {card.hp}/{card.maxhp}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-zone">카드를 여기에 배치하세요</div>
          )}
        </div>
        
        <div className="time-zone">
          <div className="turn-indicator">턴: {turn}</div>
          <CircularTimer turnTime={turnTime} />
        </div>
        
        <div className="deck-area">
          <button
            className="deck-card"
            onClick={drawCard}
            disabled={!isMyTurn || hasDrawnThisTurn}
            title={!isMyTurn ? "상대 턴입니다!" : hasDrawnThisTurn ? "이번 턴에는 이미 드로우했습니다!" : "드로우 (D 키)"}
          >
            <div className="deck-count">{deckCards.length}</div>
          </button>

          <div className={`hand-cards-wrapper ${showHand ? "expanded" : "collapsed"}`} onClick={handleHandClick}>
            {handCards.length >= 2 && showHand && (
              <button className="toggle-hand-button collapse-button" onClick={handleToggleHand}>
                접기
              </button>
            )}
            {handCards.length >= 2 && !showHand && (
              <button className="toggle-hand-button expand-button" onClick={handleToggleHand}>
                펼치기
              </button>
            )}
            {handCards.map((card, index) => (
              <div
                key={card.id}
                className={`card-slot hand-card-position-${index}`}
                style={{ zIndex: handCards.length - index }}
              >
                <div
                  className="my-card hand-card"
                  onClick={(e) => {
                    if (showHand) {
                      e.stopPropagation();
                      handleCardClick(card.id, false, e);
                    }
                  }}
                >
                  <img src={getImageUrl(card.image)} alt={card.name} />
                </div>
              </div>
            ))}
            {!showHand && handCards.length > 0 && <div className="hand-count-overlay">{handCards.length} 장</div>}
            {handCards.length === 0 && <div className="hand-count-overlay no-cards">손패 없음</div>}
          </div>
        </div>
        
        <div className="enemy-grave" />
        
        <div className="enemy-cost-zone">
          {Array.from({
            length: Math.max(0, Math.min(8, Math.floor(Number(opponentCostIcons) || 0))),
          }).map((_, i) => (
            <div key={i} className="cost-icon" />
          ))}
        </div>
        <div className="player-cost-zone">
          {Array.from({
            length: Math.max(0, Math.min(8, Math.floor(Number(playerCostIcons) || 0))),
          }).map((_, i) => (
            <div key={i} className="cost-icon" />
          ))}
        </div>
        
        <div
          className={`player-grave clickable-grave ${hasShuffledThisTurn ? "disabled" : ""}`}
          onClick={() => {
            if (!isMyTurn) {
              addMessageToLog("지금은 당신의 턴이 아닙니다!");
              return;
            }
            if (graveCount === 0) {
              addMessageToLog("묘지가 비어 있습니다!");
              return;
            }
            if (hasShuffledThisTurn) {
              addMessageToLog("이번 턴에는 이미 묘지를 섞었습니다!");
              return;
            }
            console.log("🧩 묘지 셔플 요청 전송:", roomCode);
            socket.emit("shuffleGraveyard", { roomCode });
          }}
          title={!isMyTurn ? "상대 턴입니다!" : "묘지를 클릭하면 덱으로 섞입니다"}
        >
          ⚰️ 묘지 ({graveCount})
        </div>
      </div>

      {/* === 오른쪽 사이드 영역 === */}
      <div className="right-container">
        <div
          className={`enemy-info ${
            isMyTurn && selectedAttacker && enemyCardsInZone.length === 0 ? `enemy-direct-attack ${isDragActive ? "drag-active" : ""}` : ""
          }`}
          onClick={() => handleDirectAttackOnEnemy()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const attackerId = e.dataTransfer.getData("attackerId");
            if (attackerId) handleDirectAttackOnEnemy(attackerId);
            setIsDragActive(false);
          }}
        >
          <div className="enemy-avatar" />
          <div className="hp-bar">
            <div className="hp-bar-inner" style={{ width: `${(enemyHP / MAX_HP) * 100}%` }} />
            <div className="hp-text">
              {enemyHP}/{MAX_HP}
            </div>
          </div>
        </div>

        <div className="event-zone">
          <div className="event-items-container">
            {activeEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                onClick={() => handleEventAttack(event.id)}
              />
            ))}
          </div>
          <button className="endturn-button" onClick={handleEndTurn}>
            턴 종료 <CiClock1 size={24} />
          </button>
        </div>

        <div className="player-info">
          <div className="player-avatar" />
          <div className="hp-bar">
            <div className="hp-bar-inner" style={{ width: `${(playerHP / MAX_HP) * 100}%` }} />
            <div className="hp-text">
              {playerHP}/{MAX_HP}
            </div>
          </div>
          <div className="surrender-button" onClick={handleSurrender}>
            항복 <CiFlag1 />
          </div>
        </div>
      </div>

      {showGameOver && (
        <GameOverScreen
          message={gameOverMessage}
          isVictory={isVictory}
          onRestart={() => window.location.reload()}
          onGoToMainMenu={() => navigate("/")}
        />
      )}

      {dragPreview && (
        <div
          className="drag-preview"
          style={{
            top: dragPreview.y - 60,
            left: dragPreview.x - 40,
          }}
        >
          <img src={dragPreview.image} alt="drag-preview" />
        </div>
      )}
    </div>
  );
}

export default BattlePage;