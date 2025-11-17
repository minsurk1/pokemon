// BattlePage.tsx 전체 코드
"use client";

import type React from "react";
import { useUser } from "../../context/UserContext";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { CiClock1 } from "react-icons/ci";

import "./BattlePage.css";
import MessageBox from "../../components/common/MessageBox";
import GameOverScreen from "../../components/battle/GameOverScreen";
import CircularTimer from "../../components/battle/CircularTimer";
import BurnLineComponent from "../../components/battle/BurnLineComponent";
import { Card } from "../../types/Card";
import { CiFlag1 } from "react-icons/ci";

import SoundManager from "../../utils/SoundManager";
import type { SoundName } from "../../utils/SoundManager";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import SummonedCard3D from "../../components/battle/SummonedCard3D";

// ===================== 🔥 이벤트 시스템 추가 =====================
import EventItem from "../../components/battle/Eventitem";
import { detectTypeByName } from "../../utils/detectTypeByName";

import { motion, AnimatePresence } from "framer-motion";

import DraggableChat from "../../components/common/DraggableChat";
import DamagePopup from "../../components/battle/DamagePopup";

// ===================== 인터페이스 =====================
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

// ====================================
// 🔧 Window 커스텀 타입 확장 선언
// ====================================
declare global {
  interface Window {
    __surrenderMessageStart?: number;
  }
}

type BattleCard = Card & {
  damagePopups?: { id: number; amount: number }[];
  discardFade?: boolean;
};

type BattleEvent = Event & {
  damagePopups?: { id: number; amount: number }[];
};

const typeColorMap: Record<string, string> = {
  fire: "#ff5733",
  water: "#3498db",
  electric: "#f1c40f",
  forest: "#27ae60",
  ice: "#5dade2",
  poison: "#9b59b6",
  land: "#a04000",
  esper: "#8e44ad",
  fly: "#85c1e9",
  normal: "#bdc3c7",
  legend: "#f39c12",
  worm: "#7dcea0",
};

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
  const realType = detectedType.toLowerCase(); // 🔥 무조건 lowercase로 통일

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
// ✅ 안전한 UUID 생성 함수 (crypto.randomUUID 미지원 브라우저 대비)
const safeUUID = () => {
  try {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }
  } catch (e) {}

  // ✅ 폴백 UUID 생성 (충돌 거의 없음)
  return `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
};

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

  // ✅ card가 들어올 수도 있고, card.card 안에 들어올 수도 있음
  const base = typeof c.card === "object" && c.card !== null && !Array.isArray(c.card) ? c.card : c;

  // ✅ 이름/타입 처리
  const name = String(base.cardName ?? base.name ?? c.cardName ?? c.name ?? "Unknown").trim();
  const detectedType = detectTypeByName(name);
  const cardType = detectedType || base.cardType || c.cardType || "normal";

  const tier = Number(base.tier ?? c.tier ?? 1);
  const imagePath = base.image2D ?? base.image ?? c.image2D ?? c.image ?? `${cardType}Tier${tier}.png`;

  const fileName = imagePath.startsWith("http") ? imagePath : `${IMAGE_URL}/${imagePath.split("/").pop()}`;

  return {
    id: String(base._id ?? base.id ?? c.id ?? safeUUID()), // ✅ 변경 포인트
    name,
    cardType,
    tier,
    attack: Number(base.attack ?? c.attack ?? 0),
    hp: Number(base.hp ?? c.hp ?? 0),
    maxhp: Number(base.maxhp ?? base.hp ?? c.maxhp ?? c.hp ?? 0),
    cost: Number(base.cost ?? c.cost ?? tier),
    image: fileName,
    canAttack: base.canAttack ?? c.canAttack ?? true,
  };
};

// 서버가 준 존 데이터를 기존 존과 "머지".
// - 같은 id 카드가 있으면: HP는 더 "낮은 값"을 우선(피해 상태를 되살리지 않도록)
// - 없던 카드는 추가, 서버에 없는 카드는 제거
function mergeZoneByMinHP(prev: Card[], incomingRaw: any[]): Card[] {
  const incoming = incomingRaw.map(keepCardShape);
  const prevMap = new Map(prev.map((c) => [c.id, c]));
  const inIds = new Set(incoming.map((c) => c.id));

  const merged: Card[] = incoming.map((sv) => {
    const old = prevMap.get(sv.id);
    if (!old) return sv;
    const mergedHP = Math.min(Number(old.hp ?? sv.hp ?? 0), Number(sv.hp ?? old.hp ?? 0));
    return {
      ...sv,
      hp: mergedHP, // HP는 더 낮은 쪽 유지(되살림 방지)
      canAttack: sv.canAttack ?? old.canAttack ?? true,
    };
  });

  // 서버에 없어진 카드는 제거(서버 소스오브트루스)
  return merged;
}

// ===================== BattlePage =====================
function BattlePage({ selectedDeck }: { selectedDeck: Card[] }) {
  const socket = useSocket();
  const myId = socket.id ?? "";

  const navigate = useNavigate();
  const location = useLocation() as any;
  const roomCode: string = location?.state?.roomCode || "defaultRoomCode";

  // === 상태 ===
  const { userInfo } = useUser();

  const [mySocketId, setMySocketId] = useState<string | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turn, setTurn] = useState(1);
  const [showHand, setShowHand] = useState(false);
  const [playerHP, setPlayerHP] = useState(MAX_HP);
  const [enemyHP, setEnemyHP] = useState(MAX_HP);
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [handCards, setHandCards] = useState<Card[]>([]);
  const [myCardsInZone, setMyCardsInZone] = useState<BattleCard[]>([]);
  const [enemyCardsInZone, setEnemyCardsInZone] = useState<BattleCard[]>([]);

  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);
  const [playerCostIcons, setPlayerCostIcons] = useState<number>(1);
  const [opponentCostIcons, setOpponentCostIcons] = useState<number>(1);

  const [messageBox, setMessageBox] = useState<string | null>(null);
  const [messageLocked, setMessageLocked] = useState(false);
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");
  const [isGameOverState, setIsGameOverState] = useState(false);
  const [isVictory, setIsVictory] = useState(false);
  const [lastPlayedCardId, setLastPlayedCardId] = useState<string | null>(null);
  const [lastEnemyCardId, setLastEnemyCardId] = useState<string | null>(null);
  const [turnTime, setTurnTime] = useState(INITIAL_TIME);
  const [enemyHandCount, setEnemyHandCount] = useState<number>(8);
  const [hasShuffledThisTurn, setHasShuffledThisTurn] = useState(false);
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);
  const [deckLoaded, setDeckLoaded] = useState(false);
  const [graveCount, setGraveCount] = useState(0);
  const [dragPreview, setDragPreview] = useState<{
    x: number;
    y: number;
    image: string;
  } | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isHoldingCard, setIsHoldingCard] = useState(false);
  const [heldCard, setHeldCard] = useState<Card | null>(null);
  const pendingTurnPayload = useRef<TurnPayload | string | null>(null);
  const isMyTurnRef = useRef(isMyTurn);
  const currentTurnIdRef = useRef(currentTurnId);
  const lastTurnIdRef = useRef<string | null>(null);
  const [activeEvents, setActiveEvents] = useState<BattleEvent[]>([]);
  const chatHistoryRef = useRef<HTMLDivElement>(null);

  // ✅ 항복 재확인 팝업
  const [showSurrenderConfirm, setShowSurrenderConfirm] = useState(false);
  // ✅ 항복 연타 방지
  const [canClickSurrender, setCanClickSurrender] = useState(true);

  const [surrendering, setSurrendering] = useState(false);

  // 뒤로가기 방지
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);

  const [firstTurnDone, setFirstTurnDone] = useState<Record<string, boolean>>({});

  const [show3D, setShow3D] = useState(true);

  // ======================================== 게임오버 상태 ========================================
  // ✅ VICTORY 애니메이션 컨트롤용
  const [showVictoryBanner, setShowVictoryBanner] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  // ✅ DEFEAT 애니메이션 컨트롤용
  const [showDefeatBanner, setShowDefeatBanner] = useState(false);

  // ✅ GameOverScreen 페이드인 전환용
  const [fadeInGameOver, setFadeInGameOver] = useState(false);

  const [isDimming, setIsDimming] = useState(false);

  // ======= 카드 공격 시 사용되는 애니메이션 상태 관리 =======
  const [attackingCardId, setAttackingCardId] = useState<string | null>(null);
  // 공격 직후 잠깐 서버 상태 덮어쓰기 억제용
  const suppressSyncUntilRef = useRef<number>(0);

  // 🔥 선택된 공격자 카드 강조(HIGHLIGHT)용
  const [highlightCardId, setHighlightCardId] = useState<string | null>(null);
  // 피격 애니메이션 대상 카드 ID
  const [hitCardId, setHitCardId] = useState<string | null>(null);
  const [playerHit, setPlayerHit] = useState<string | null>(null);
  const enemyIdRef = useRef<string | null>(null);

  // 묘지에 카드 버리기
  const [pendingDiscard, setPendingDiscard] = useState<{
    card: Card;
    location: "hand" | "field";
    confirm: () => void;
  } | null>(null);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const [isDraggingOverGrave, setIsDraggingOverGrave] = useState(false);
  const [shuffleAnim, setShuffleAnim] = useState(false);
  const discardedCardIdsRef = useRef<Set<string>>(new Set());

  const [enemyGraveCount, setEnemyGraveCount] = useState(0);
  const [enemyDiscardGhost, setEnemyDiscardGhost] = useState<{
    image: string;
    name: string;
  } | null>(null);

  const [playerDamagePopups, setPlayerDamagePopups] = useState<{ id: number; amount: number }[]>([]);
  const [enemyDamagePopups, setEnemyDamagePopups] = useState<{ id: number; amount: number }[]>([]);

  const [tooltip, setTooltip] = useState<string | null>(null);

  // sound 관련 상태 관리
  const [muted, setMuted] = useState<boolean>(false);

  // ======================================== 함수들 ========================================
  // (useEffect ref 동기화 - 변경 없음)
  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);
  useEffect(() => {
    currentTurnIdRef.current = currentTurnId;
  }, [currentTurnId]);
  useEffect(() => {
    if (isMyTurn) setHasShuffledThisTurn(false);
  }, [isMyTurn]);

  useEffect(() => {
    // 🔇 전역 BGM 중지
    SoundManager.pauseGlobalBGM();
    // 🔥 배틀BGM 재생
    if (!isGameOverState) {
      SoundManager.playBGM();
    }

    return () => {
      // 🛑 배틀BGM 정지
      SoundManager.stopBGM();
      // 🔊 전역 BGM 재개
      SoundManager.resumeGlobalBGM();
    };
  }, [isGameOverState]);

  // 🔥 승리/패배 배너 BGM도 페이지 이동 시 반드시 정지
  useEffect(() => {
    return () => {
      SoundManager.stopBannerBGM();
    };
  }, []);

  const toggleMute = () => {
    const m = SoundManager.toggleMuteBGM();
    setMuted(m);
  };

  const showMessageBox = (text: string, duration: number = 1500, lock = false) => {
    if (messageLocked) return; // ✅ 잠겨있으면 새 메시지 무시

    setMessageBox(text);

    if (lock) setMessageLocked(true); // ✅ 중요 메시지면 잠금

    setTimeout(() => {
      setMessageBox(null);
      if (lock) setMessageLocked(false); // ✅ 시간이 끝나면 잠금 해제
    }, duration);
  };

  // 🔥 데미지 팝업 생성 함수
  const showDamagePopup = (targetType: "myCard" | "enemyCard" | "event" | "player" | "enemyPlayer", targetId: string, damage: number) => {
    // --- 1) 내 카드 ---
    if (targetType === "myCard") {
      setMyCardsInZone((prev) =>
        prev.map((card) =>
          card.id === targetId
            ? {
                ...card,
                damagePopups: [...(card.damagePopups || []), { id: Date.now() + Math.random(), amount: damage }],
              }
            : card
        )
      );
    }

    // --- 2) 상대 카드 ---
    if (targetType === "enemyCard") {
      setEnemyCardsInZone((prev) =>
        prev.map((card) =>
          card.id === targetId
            ? {
                ...card,
                damagePopups: [...(card.damagePopups || []), { id: Date.now() + Math.random(), amount: damage }],
              }
            : card
        )
      );
    }

    // --- 3) 이벤트 몬스터 ---
    if (targetType === "event") {
      setActiveEvents((prev) =>
        prev.map((ev) =>
          String(ev.id) === String(targetId)
            ? {
                ...ev,
                damagePopups: [...(ev.damagePopups || []), { id: Date.now() + Math.random(), amount: damage }],
              }
            : ev
        )
      );
    }

    // --- 추가: 플레이어 데미지 팝업 저장 ---
    if (targetType === "player") {
      setPlayerDamagePopups((prev) => [...prev, { id: Date.now() + Math.random(), amount: damage }]);

      setTimeout(() => {
        setPlayerDamagePopups((prev) => prev.slice(1));
      }, 1200);
    }

    // --- 추가: 상대 플레이어 데미지 팝업 저장 ---
    if (targetType === "enemyPlayer") {
      setEnemyDamagePopups((prev) => [...prev, { id: Date.now() + Math.random(), amount: damage }]);

      setTimeout(() => {
        setEnemyDamagePopups((prev) => prev.slice(1));
      }, 1200);
    }

    // 800ms 후 팝업 자동 삭제
    setTimeout(() => {
      if (targetType === "myCard") {
        setMyCardsInZone((prev) => prev.map((card) => (card.id === targetId ? { ...card, damagePopups: card.damagePopups?.slice(1) || [] } : card)));
      }

      if (targetType === "enemyCard") {
        setEnemyCardsInZone((prev) => prev.map((card) => (card.id === targetId ? { ...card, damagePopups: card.damagePopups?.slice(1) || [] } : card)));
      }

      if (targetType === "event") {
        setActiveEvents((prev) => prev.map((ev) => (String(ev.id) === targetId ? { ...ev, damagePopups: ev.damagePopups?.slice(1) || [] } : ev)));
      }
    }, 1200);
  };

  const addMessageToLog = useCallback((newMessage: string) => {
    if (!newMessage) return;
    const time = new Date().toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    // 2줄로 나오는 \n을 공백으로 치환
    const singleLineMessage = newMessage.replace("\n", " ");
    setMessageHistory((prev) => [`[${time}] ${singleLineMessage}`, ...prev].slice(0, 100));
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
      // 🔥 내가 한번이라도 턴을 받으면 첫턴 종료 처리
      setFirstTurnDone((prev) => ({
        ...prev,
        [myId]: true,
      }));

      setTurnTime(timeLeft ?? INITIAL_TIME);

      setSelectedAttacker(null);
      setHighlightCardId(null);

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
      applyTurnChange({
        currentTurn: initTurn,
        timeLeft: initTime ?? INITIAL_TIME,
      });
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
    console.log(
      "🧪 handCards:",
      handCards.length,
      handCards.map((c) => c.name)
    );
    console.log("🧪 deckCards:", deckCards.length);
  }, [handCards, deckCards]);

  useEffect(() => {
    console.log("🧪 deckLoaded:", deckLoaded);
  }, [deckLoaded]);

  const drawCard = useCallback(() => {
    if (!isMyTurn) {
      showMessageBox("지금은 당신의 턴이 아닙니다!");
      return;
    }
    if (hasDrawnThisTurn) {
      addMessageToLog("이번 턴에는 이미 드로우했습니다!");
      return;
    }
    socket.emit("drawCard", { roomCode, playerId: socket.id });
    setHasDrawnThisTurn(true);
  }, [socket, isMyTurn, hasDrawnThisTurn, roomCode, addMessageToLog]);

  // ✅ 내 턴이 시작될 때 자동 드로우
  useEffect(() => {
    if (isMyTurn && !hasDrawnThisTurn) {
      console.log("🃏 내 턴 시작 → 자동 드로우 실행");
      drawCard();
    }
  }, [isMyTurn]);

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
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "v") {
        setShow3D((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m") {
        const newState = SoundManager.toggleMuteBGM();
        setMuted(newState);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // 🔥 damage 값을 기반으로 피격 타입 판정 함수
  const getDamageType = (damage: number) => {
    if (damage >= 150) return "super"; // 강한 피해
    if (damage <= 40) return "weak"; // 약한 피해
    return "normal";
  };

  // 애니메이션 + emit 담당 (BattlePage 내부)
  const runAttackAnimation = (
    attackerInstanceId: string,
    targetInstanceId?: string, // "my-player" | "enemy-player" | 카드ID | 이벤트ID
    attackType: "card" | "player" | "event" | "field" = "card"
  ) => {
    const attackerEl = document.getElementById(`card-${attackerInstanceId}`);
    if (!attackerEl) return;

    attackerEl.classList.add("attacking");

    let targetEl: HTMLElement | null = null;

    // 🎯 1) 카드 공격
    if (attackType === "card" && targetInstanceId) {
      targetEl = document.getElementById(`card-${targetInstanceId}`);
    }

    // 🎯 2) 이벤트 공격
    else if (attackType === "event" && targetInstanceId) {
      targetEl = document.getElementById(`event-monster-${targetInstanceId}`);
    }

    // 🎯 3) 직접 공격 (수정된 핵심 부분)
    else if (attackType === "player") {
      if (targetInstanceId === "my-player") {
        targetEl = document.getElementById("my-player-target");
      } else {
        targetEl = document.getElementById("enemy-player-target");
      }
    }

    // 🎯 4) 기본 - 필드
    else if (attackType === "field") {
      targetEl = document.getElementById("enemy-field-target");
    }

    // ======== 좌표 계산 ========
    const attackerRect = attackerEl.getBoundingClientRect();

    let targetX: number;
    let targetY: number;

    if (targetEl) {
      const tRect = targetEl.getBoundingClientRect();
      targetX = tRect.left + tRect.width / 2;
      targetY = tRect.top + tRect.height / 2;
    } else {
      targetX = window.innerWidth / 2;
      targetY = window.innerHeight * 0.15;
    }

    const dx = targetX - (attackerRect.left + attackerRect.width / 2);
    const dy = targetY - (attackerRect.top + attackerRect.height / 2);

    attackerEl.animate(
      [
        { transform: "translate(0, 0) scale(1)" },
        { transform: `translate(${dx * 0.65}px, ${dy * 0.65}px) scale(1.15)` },
        { transform: "translate(0, 0) scale(1)" },
      ],
      { duration: 430, easing: "ease-out" }
    );

    setTimeout(() => attackerEl.classList.remove("attacking"), 430);
  };

  useEffect(() => {
    console.log("🌐 socket listeners registered once");

    if (!socket) return;

    const onAttackResult = (data: any) => {
      const { attacker, defender, damage, multiplier, message } = data;
      console.log(`⚔️ ${attacker} → ${defender} | ${damage} 피해 (${message}, x${multiplier})`);
      addMessageToLog(`${attacker} ➤ ${defender} ${message} (x${multiplier})`);
    };
    const onDirectAttackEnhanced = (data: any) => {
      const { attackerId, attackerName, damage, newHP, multiplier, message } = data;

      // 🚫 후공 첫턴 공격 사운드 차단
      const me = socket.id;
      if (!me) return;

      // ⭐ 공격 사운드를 미리 재생
      // 서버에서 받아온 공격자 타입 사용
      const atkType = (data.attackerType as string | undefined)?.toLowerCase() ?? "normal";

      if (!isMyTurnRef.current && firstTurnDone && firstTurnDone[me] === false) {
        return;
      }

      // 공격자가 나인가?
      const iAmAttacker = currentTurnIdRef.current === socket.id;

      // 🔥 데미지 팝업 (직공)
      if (damage > 0) {
        if (iAmAttacker) showDamagePopup("enemyPlayer", "enemy-hp", damage);
        else showDamagePopup("player", "player-hp", damage);
      }

      // 🔥 HP 업데이트
      if (damage < 0) {
        SoundManager.play("heal");
        // 회복
        if (!iAmAttacker) {
          setPlayerHP(newHP);
          addMessageToLog(`✨ ${attackerName}으로 ${-damage} HP 회복!`);
        }
      } else {
        // 피해
        if (iAmAttacker) setEnemyHP(newHP);
        else setPlayerHP(newHP);

        addMessageToLog(message ? `💥 ${attackerName}의 공격! ${message} (x${multiplier ?? 1})` : `💥 ${attackerName}이(가) ${damage} 피해를 입혔습니다!`);
      }
    };

    // ✅ 서버에서 공격 애니메이션 패킷 수신
    const onAttackAnimation = (data: any) => {
      const { attackerOwner, attackerId, targetType, targetOwner, targetId, eventId } = data;

      // 🚫 후공 첫턴 애니메이션도 차단
      const me = socket.id;
      if (!me) return;

      // ⭐ 공격 사운드는 여기에서 먼저 실행해야 함
      // 서버에서 받아온 공격자 타입 사용
      const atkType = (data.attackerType as string | undefined)?.toLowerCase() ?? "normal";

      if (!isMyTurnRef.current && firstTurnDone && firstTurnDone[me] === false) {
        return;
      }

      const isAttackerMe = attackerOwner === socket.id;
      const isTargetMe = targetOwner === socket.id;

      let finalTargetId: string | undefined = undefined;
      let finalType = targetType;

      // 카드 공격
      if (targetType === "card" && targetId) {
        finalTargetId = targetId;
      }

      // 이벤트 공격
      else if (targetType === "event" && eventId) {
        finalTargetId = String(eventId);
      }

      // 직접 공격
      else if (targetType === "player") {
        finalType = "player";

        // ⭐ 여기 핵심 포인트
        finalTargetId = isTargetMe ? "my-player" : "enemy-player";
      }

      runAttackAnimation(attackerId, finalTargetId, finalType);
    };

    // 🔥 서버 hit 신호 → 피격 애니메이션 실행
    const onHit = ({
      attackerId,
      attackerOwner,
      attackerType,
      targetOwner,
      targetId,
      damage,
    }: {
      attackerId: string;
      attackerOwner: string; // ⭐ 추가
      attackerType?: string;
      targetOwner: string | null;
      targetId: string | number | null;
      damage?: number;
    }) => {
      const me = socket.id;
      const enemy = enemyIdRef.current;

      if (!me) return;

      const iAmAttacker = me === attackerOwner;
      const iAmTarget = me === targetOwner;

      // ================================
      // 🔥 공격 사운드 (공격자만 들음)
      // ================================
      if (iAmAttacker && attackerType) {
        SoundManager.playAttackByType(attackerType.toLowerCase());
      }

      // ================================
      // 🔥 피격 사운드 (맞는 사람만 들음)
      // ================================
      if (iAmTarget && typeof damage === "number") {
        const hitType = damage >= 150 ? "super" : damage <= 40 ? "weak" : "normal";

        SoundManager.playHit(hitType);
      }

      // ================================
      // 🔥 이벤트 몬스터 피격
      // ================================
      if (targetOwner === "event" && targetId !== null) {
        const idStr = String(targetId);
        setHitCardId(idStr);
        setTimeout(() => setHitCardId(null), 350);

        if (damage !== undefined) {
          showDamagePopup("event", idStr, damage);
        }
        return;
      }

      // ================================
      // 🔥 카드 피격
      // ================================
      if (targetId !== null && targetId !== undefined) {
        const idStr = String(targetId);

        setHitCardId(idStr);
        setTimeout(() => setHitCardId(null), 350);

        if (damage !== undefined) {
          if (iAmTarget) {
            showDamagePopup("myCard", idStr, damage);
          } else {
            showDamagePopup("enemyCard", idStr, damage);
          }
        }
        return;
      }

      // ================================
      // 🔥 플레이어 직접 공격
      // ================================
      if (iAmTarget) {
        setPlayerHit("me");
        setTimeout(() => setPlayerHit(null), 350);

        if (damage !== undefined) {
          showDamagePopup("player", "player-hp", damage);
        }
        return;
      }

      if (enemy && targetOwner === enemy) {
        setPlayerHit("enemy");
        setTimeout(() => setPlayerHit(null), 350);

        if (damage !== undefined) {
          showDamagePopup("enemyPlayer", "enemy-hp", damage);
        }
        return;
      }
    };

    // ✅ 서버에서 전투 로그 수신
    const onBattleLog = (log: any) => {
      // log = { type, attackerName, defenderName, damage, multiplier, effectMsg, prevHP, newHP }
      addMessageToLog(`🗡️ ${log.attackerName} → ${log.defenderName} | ${log.damage} 피해! (x${log.multiplier}) ${log.effectMsg}`);
    };

    const onTurnStartSound = () => {
      // 상대 턴 시작일 때만 들리게 하기 위함은 아님.
      // 서버가 nextTurn 에게만 보내니까 자연스럽게 "턴 받은 사람"만 들음.
      SoundManager.play("Turn_change");
      addMessageToLog("🔔 당신의 턴입니다!");
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
      const { hp, cost, decks, hands, graveyards, cardsInZone, turnCount, timeLeft, currentTurn, firstTurnDone: ftd } = data;
      const myId = socket?.id;
      if (ftd) {
        setFirstTurnDone(ftd);
      }
      // 🔥 상대 묘지 카운트도 동기화
      const enemyId = Object.keys(graveyards || {}).find((id) => id !== myId);
      if (enemyId && graveyards[enemyId]) {
        setEnemyGraveCount(graveyards[enemyId].length);
      }

      if (!myId) return;

      dlog("📥 updateGameState 수신:", data);

      /* ✅ 1) 턴 / 타이머는 즉시 동기화 */
      if (typeof currentTurn === "string") {
        if (currentTurnIdRef.current !== currentTurn) {
          applyTurnChange({
            currentTurn,
            timeLeft: typeof timeLeft === "number" ? timeLeft : undefined,
          });
          dlog("⚡ updateGameState에서 턴 동기화:", currentTurn, timeLeft);
        } else if (typeof timeLeft === "number") {
          setTurnTime(timeLeft);
        }
      } else if (typeof timeLeft === "number") {
        setTurnTime(timeLeft);
      }

      if (typeof turnCount === "number") {
        setTurn(turnCount);
      }

      /* ✅ 2) 공격 직후 서버가 옛 HP를 보내오는 것을 막기 위한 억제 */
      const suppressing = Date.now() < suppressSyncUntilRef.current;

      /* ✅ 3) COST 는 항상 최신값 반영 */
      if (cost) {
        setPlayerCostIcons(Number(cost[myId]) || 0);
        const oppIdC = Object.keys(cost).find((id) => id !== myId);
        if (oppIdC) setOpponentCostIcons(Number(cost[oppIdC]) || 0);
      }

      /* ✅ 4) 손패 / 덱 / 묘지 카운트는 항상 동기화 */
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

      /* ✅ 5) HP 업데이트 (되살림 방지 대신 서버 값 그대로 반영) */
      if (hp) {
        if (hp[myId] !== undefined) {
          setPlayerHP(Number(hp[myId]));
        }

        const enemyId = Object.keys(hp).find((id) => id !== myId);
        if (enemyId) enemyIdRef.current = enemyId;
        if (enemyId && hp[enemyId] !== undefined) {
          setEnemyHP(Number(hp[enemyId]));
        }
      }

      /* ✅ 6) 존 병합 함수 (HP는 더 낮은 값 유지) */
      const mergeZoneByMinHP = (prev: Card[], incomingRaw: any[]) => {
        const incoming = incomingRaw.map(keepCardShape);
        const prevMap = new Map(prev.map((c) => [c.id, c]));

        return incoming.map((sv) => {
          const old = prevMap.get(sv.id);

          if (!old) return sv; // 새 카드면 그대로 추가

          return {
            ...sv,
            hp: Math.min(Number(old.hp ?? sv.hp ?? 0), Number(sv.hp ?? old.hp ?? 0)),
            canAttack: sv.canAttack ?? old.canAttack ?? true,
          };
        });
      };

      /* ✅ 7) 필드 존 동기화 (얻어맞은 카드가 되살아나는 문제를 완전히 해결) */
      /* ✅ 7) 필드 존 동기화 (버린 카드 부활 방지 추가) */
      if (!suppressing && cardsInZone) {
        const mySvRaw = cardsInZone?.[myId];
        if (mySvRaw) {
          // 🔥 버린 카드 제외 필터링
          const filtered = mySvRaw.filter((c: any) => !discardedCardIdsRef.current.has(String(c.id)));

          setMyCardsInZone((prev) => mergeZoneByMinHP(prev, filtered));
        }

        const oppId = Object.keys(cardsInZone || {}).find((id) => id !== myId);
        if (oppId && cardsInZone?.[oppId]) {
          const oppSvRaw = cardsInZone[oppId];

          // 🔥 상대 필드도 마찬가지로 버린 카드 제외
          const filteredOpp = oppSvRaw.filter((c: any) => !discardedCardIdsRef.current.has(String(c.id)));

          setEnemyCardsInZone((prev) => mergeZoneByMinHP(prev, filteredOpp));
        }
      }

      /* ✅ 8) 이벤트 처리 */
      if (Object.prototype.hasOwnProperty.call(data, "activeEvent")) {
        if (data.activeEvent) {
          setActiveEvents((prev) => {
            const prevEv = prev.find((e) => e.id === data.activeEvent.id);

            if (prevEv) {
              return [
                {
                  ...prevEv,
                  ...data.activeEvent,
                  damagePopups: prevEv.damagePopups, // 🔥 팝업 유지
                },
              ];
            }

            return [
              {
                ...data.activeEvent,
                damagePopups: [], // 새 이벤트면 초기화
              },
            ];
          });
        } else {
          setActiveEvents([]);
        }
      }
    };

    const onCardSummoned = ({ playerId, card, updatedCost, cost }: any) => {
      console.log(`🃏 카드 소환 수신 from ${playerId} | 카드: ${card.name}`);
      SoundManager.play("card_summon");
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

      // 기존 카드의 HP 찾기
      const prevHP = ownerId === socket.id ? myCardsInZone.find((c) => c.id === targetId)?.hp : enemyCardsInZone.find((c) => c.id === targetId)?.hp;

      // 데미지 계산
      const damage = prevHP !== undefined ? prevHP - newHP : 0;

      // 🔥 Damage Popup
      if (damage > 0) {
        if (ownerId === socket.id) showDamagePopup("myCard", targetId, damage);
        else showDamagePopup("enemyCard", targetId, damage);
      }

      // HP 업데이트
      if (ownerId === socket.id) {
        setMyCardsInZone((prev) => prev.map((c) => (c.id === targetId ? { ...c, hp: newHP } : c)));
      } else {
        setEnemyCardsInZone((prev) => prev.map((c) => (c.id === targetId ? { ...c, hp: newHP } : c)));
      }
    };

    // ✅ 서버에서 타이머 공유값 수신
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
      setActiveEvents([
        {
          ...eventData,
          damagePopups: [], // 새 이벤트라도 빈 배열은 넣어줘야 함
        },
      ]);

      addMessageToLog(`🚨 ${eventData.message}`);
    };

    const onEventHPUpdate = ({ eventId, newHP }: { eventId: number; newHP: number }) => {
      // 기존 이벤트몬스터 HP 찾기
      const prevHP = activeEvents.find((e) => e.id === eventId)?.hp;

      // 데미지 계산
      const damage = prevHP !== undefined ? prevHP - newHP : 0;

      // 🔥 Damage Popup
      if (damage > 0) {
        showDamagePopup("event", String(eventId), damage);
      }

      // HP 업데이트
      setActiveEvents((prev) =>
        prev.map((e) =>
          e.id === eventId
            ? {
                ...e,
                hp: newHP,
                damagePopups: e.damagePopups ?? [], // 🔥 기존 팝업 유지!
              }
            : e
        )
      );
    };

    const onEventEnded = ({ eventId }: { eventId: number }) => {
      setActiveEvents((prev) => prev.filter((e) => e.id !== eventId));
      addMessageToLog(`🎉 이벤트가 종료되었습니다! (보상 획득)`);
    };

    const onCardDrawn = ({ card, decks, hands }: any) => {
      const myId = socket?.id;
      if (!myId) return;
      const newCard = keepCardShape(card);

      setHandCards((prev) => {
        if (hands?.[myId]) {
          return hands[myId].map(keepCardShape);
        }
        return [...prev, newCard];
      });

      if (decks?.[myId] && decks[myId].length < deckCards.length) {
        setDeckCards(decks[myId].map(keepCardShape));
      } else {
        setDeckCards((prev) => prev.slice(0, -1));
      }

      addMessageToLog(`📥 ${newCard.name} 카드를 드로우했습니다!`);
    };

    const onCardDestroyedWithGrave = ({ playerId, card, graveCount }: any) => {
      if (!card) {
        console.warn("⚠️ onCardDestroyedWithGrave: 카드 데이터 없음", {
          playerId,
          graveCount,
        });
        return;
      }

      // ⭐ 카드 삭제 전 900ms 유지(데미지 팝업 보여주기 위한 시간)
      const REMOVE_DELAY = 1200;

      if (playerId === socket.id) {
        // 🔥 먼저 카드에 isDestroyed 플래그 적용 (CSS 애니메이션용)
        setMyCardsInZone((prev) => prev.map((c) => (c.id === card.id ? { ...c, isDestroyed: true } : c)));

        // 🔥 400ms 후 실제로 제거
        setTimeout(() => {
          setMyCardsInZone((prev) => prev.filter((c) => c.id !== card.id));
        }, REMOVE_DELAY);

        setGraveCount(graveCount);
        addMessageToLog(`💀 ${card.name}이(가) 내 묘지로 이동했습니다.`);
      } else {
        setEnemyCardsInZone((prev) => prev.map((c) => (c.id === card.id ? { ...c, isDestroyed: true } : c)));

        setTimeout(() => {
          setEnemyCardsInZone((prev) => prev.filter((c) => c.id !== card.id));
        }, REMOVE_DELAY);

        addMessageToLog(`🔥 상대의 ${card.name}이(가) 쓰러졌습니다!`);
      }
    };

    // ⭐⭐⭐ 카드 버리기 수신 — 내/상대 모두 로그에 확실히 출력 ⭐⭐⭐
    const onCardDiscarded = (data: any) => {
      const { playerId, card, hpPenalty, costPenalty } = data;
      const mine = playerId === socket.id;

      const cardName = card?.name ?? card?.cardName ?? "알 수 없는 카드";
      const cardImage = getImageUrl(card?.image);

      if (mine) {
        addMessageToLog(`🗑️ ${cardName}을(를) 버렸습니다! (HP -${hpPenalty}, COST -${costPenalty})`);
      } else {
        addMessageToLog(`🗑️ 상대가 ${cardName}을(를) 버렸습니다!`);

        // ⭐⭐⭐ 잔상 페이드 애니메이션 데이터 저장 ⭐⭐⭐
        setEnemyDiscardGhost({ image: cardImage, name: cardName });

        setTimeout(() => {
          setEnemyDiscardGhost(null);
        }, 1800);
      }

      if (!mine) {
        showMessageBox("상대가 카드를 버렸습니다!", 1700);
      }
    };

    const onGraveyardShuffled = (data: any) => {
      const { deckCount, returned, failed, penaltyHP, decks, graveyards, hp } = data;
      const myId = socket?.id;
      if (!myId) return;
      setHasShuffledThisTurn(true);
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

    // ✅ 게임오버 이벤트 수신
    const onGameOver = ({ winnerId, loserId, reason }: { winnerId: string; loserId: string; reason?: string }) => {
      handleGameOver({ winnerId, loserId, reason });
    };

    socket.on("error", onError);
    socket.on("gameStart", onGameStart);
    socket.on("turnChanged", onTurnChanged);
    socket.on("updateGameState", onUpdateGameState);
    socket.on("addBattleLog", onBattleLog);
    socket.on("attackResult", onAttackResult);
    socket.on("directAttack", onDirectAttackEnhanced);
    socket.on("hit", onHit);
    socket.on("turnStart", onTurnStartSound);
    socket.on("attackAnimation", onAttackAnimation);
    socket.on("cardPlayed", onCardPlayedEnhanced);
    socket.on("cardSummoned", onCardSummoned);
    socket.on("updateCardHP", onUpdateCardHP);
    socket.on("timeUpdate", onTimeUpdate);
    socket.on("turnTimeout", onTurnTimeout);
    socket.on("eventTriggered", onEventTriggered);
    socket.on("eventHPUpdate", onEventHPUpdate);
    socket.on("eventEnded", onEventEnded);
    socket.on("cardDrawn", onCardDrawn);
    socket.on("cardDestroyed", onCardDestroyedWithGrave);
    socket.on("graveyardShuffled", onGraveyardShuffled);
    socket.on("cardDiscarded", onCardDiscarded);
    socket.on("gameOver", onGameOver);

    return () => {
      socket.off("error", onError);
      socket.off("gameStart", onGameStart);
      socket.off("turnChanged", onTurnChanged);
      socket.off("updateGameState", onUpdateGameState);
      socket.off("addBattleLog", onBattleLog);
      socket.off("attackResult", onAttackResult);
      socket.off("directAttack", onDirectAttackEnhanced);
      socket.off("hit", onHit);
      socket.off("turnStart", onTurnStartSound);
      socket.off("attackAnimation", onAttackAnimation);
      socket.off("cardPlayed", onCardPlayedEnhanced);
      socket.off("cardSummoned", onCardSummoned);
      socket.off("updateCardHP", onUpdateCardHP);
      socket.off("timeUpdate", onTimeUpdate);
      socket.off("turnTimeout", onTurnTimeout);
      socket.off("eventTriggered", onEventTriggered);
      socket.off("eventHPUpdate", onEventHPUpdate);
      socket.off("eventEnded", onEventEnded);
      socket.off("cardDrawn", onCardDrawn);
      socket.off("cardDestroyed", onCardDestroyedWithGrave);
      socket.off("graveyardShuffled", onGraveyardShuffled);
      socket.off("cardDiscarded", onCardDiscarded);
      socket.off("gameOver", onGameOver);
    };
  }, [roomCode, addMessageToLog, applyTurnChange, deckCards.length, deckLoaded, socket]);

  // 🔥 뒤로가기 방지 + 재확인 팝업
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      setShowLeaveConfirm(true);

      // ⬇⬇ 수정: history → window.history
      window.history.pushState(null, "", window.location.href);
    };

    // 페이지 진입 시 현재 상태 추가
    window.history.pushState(null, "", window.location.href);

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (socket.id && deckLoaded) {
      console.log("[INIT TURN CHECK]", {
        socket: socket.id,
        currentTurnId,
        isMyTurn,
        turn,
      });
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

  const handleDiscardRequest = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, card: Card) => {
    e.preventDefault();

    if (!isMyTurn) {
      showMessageBox("지금은 당신의 턴이 아닙니다!");
      return;
    }

    const cost = Number(card.cost ?? 1);
    const tier = Number(card.tier ?? 1);
    let hpPenalty = 5 + cost * 3 + tier * 2;
    if (playerCostIcons <= 0) hpPenalty += 5;

    setPendingDiscard({
      card,
      location: "hand",
      confirm: () => {
        // 1) fade-out 적용
        setHandCards((prev) => prev.map((c) => (c.id === card.id ? { ...c, discardFade: true } : c)));

        // 2) 300ms 후 실제 제거 + 서버 emit
        setTimeout(() => {
          discardedCardIdsRef.current.add(card.id);
          setHandCards((prev) => prev.filter((c) => c.id !== card.id));

          socket.emit("discardCard", {
            roomCode,
            cardId: card.id,
            location: "hand",
          });

          setShowDiscardConfirm(false);
          setPendingDiscard(null);
        }, 300);
      },
    });

    setShowDiscardConfirm(true);
  };

  const handleFieldDiscardRequest = (e: React.MouseEvent<HTMLDivElement, MouseEvent>, card: Card) => {
    e.preventDefault();

    if (!isMyTurn) {
      showMessageBox("지금은 당신의 턴이 아닙니다!");
      return;
    }

    const cost = Number(card.cost ?? 1);
    const tier = Number(card.tier ?? 1);
    let hpPenalty = 5 + cost * 3 + tier * 2;
    if (playerCostIcons <= 0) hpPenalty += 5;

    setPendingDiscard({
      card,
      location: "field",
      confirm: () => {
        setMyCardsInZone((prev) => prev.map((c) => (c.id === card.id ? { ...c, discardFade: true } : c)));

        setTimeout(() => {
          discardedCardIdsRef.current.add(card.id);
          setMyCardsInZone((prev) => prev.filter((c) => c.id !== card.id));

          socket.emit("discardCard", {
            roomCode,
            cardId: card.id,
            location: "field",
          });

          setShowDiscardConfirm(false);
          setPendingDiscard(null);
        }, 300);
      },
    });

    setShowDiscardConfirm(true);
  };

  const handleGraveDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (!isMyTurn) return;
    e.preventDefault();

    const cardId = e.dataTransfer.getData("attackerId");
    if (!cardId) return;

    const card = myCardsInZone.find((c) => c.id === cardId);
    if (!card) return;

    const cost = Number(card.cost ?? 1);
    const tier = Number(card.tier ?? 1);
    let hpPenalty = 5 + cost * 3 + tier * 2;
    if (playerCostIcons <= 0) hpPenalty += 5;

    setPendingDiscard({
      card,
      location: "field",
      confirm: () => {
        discardedCardIdsRef.current.add(card.id);
        // ⭐⭐⭐ 낙관적 UI — 즉시 필드에서 제거 ⭐⭐⭐
        setMyCardsInZone((prev) => prev.filter((c) => c.id !== card.id));

        socket.emit("discardCard", {
          roomCode,
          cardId: card.id,
          location: "field",
        });

        setShowDiscardConfirm(false);
        setPendingDiscard(null);
      },
    });

    setShowDiscardConfirm(true);
  };

  const handleCardClick = (cardId: string, fromZone: boolean, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!isMyTurn) {
      addMessageToLog("상대방 턴입니다.");
      return;
    }

    // ✅ [1] 필드 위 카드 클릭 → 공격자 선택 또는 취소
    if (fromZone) {
      if (selectedAttacker === cardId) {
        setSelectedAttacker(null);
        setHighlightCardId(null); // 하이라이트 제거
      } else {
        setSelectedAttacker(cardId);
        setHighlightCardId(cardId); // 하이라이트 추가!
        addMessageToLog("🎯 공격할 상대 카드를 선택하세요!");
      }
      return;
    }

    // ✅ [2] 손패 카드 클릭 → 소환 로직
    const handCard = handCards.find((c) => c.id === cardId);
    if (!handCard) return;

    const fixedType = detectTypeByName(handCard.name);
    const normalizedCard = {
      ...normalizeCard(handCard),
      cardType: fixedType || handCard.cardType || "normal",
      image2D: handCard.image2D ?? handCard.image ?? null,
    };

    const cardCost = Number(normalizedCard.cost) || 0;

    if (cardCost > playerCostIcons) {
      showMessageBox("코스트가 부족합니다!");
      return;
    }

    if (myCardsInZone.length >= 5) {
      showMessageBox("카드 존이 가득 찼습니다! (최대 5장)");
      return;
    }

    // ✅ 손패에서 제거 + UI 닫기
    setHandCards((prev) => prev.filter((c) => c.id !== cardId));

    console.log("🎯 소환 시 전송되는 카드:", normalizedCard);

    // ✅ 서버에 소환 emit
    socket.emit("summonCard", { roomCode, card: normalizedCard });
  };

  const handleDragStart = (attackerId: string, e: any) => {
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
    setDragPreview({
      x: e.clientX,
      y: e.clientY,
      image: getImageUrl(attacker.image),
    });
  };
  const handleDrag = (e: any) => {
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
    setDragPreview({
      x: e.clientX,
      y: e.clientY,
      image: getImageUrl(card.image),
    });
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

    if (!attacker.canAttack) {
      addMessageToLog(`${attacker.name}은(는) 이미 이번 턴에 공격했습니다!`);
      return;
    }

    /* ✅ 1) 직접 공격 */
    if (!targetId && enemyCardsInZone.length === 0) {
      addMessageToLog(`💥 ${attacker.name}이(가) 상대 플레이어를 직접 공격합니다!`);

      // ✅ 서버에 직접 공격 알림
      socket.emit("directAttack", { roomCode, attackerId });

      // ✅ 공격 불가 적용
      setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));

      setSelectedAttacker(null);
      return;
    }

    /* ✅ 2) 카드 공격 */
    if (targetId) {
      addMessageToLog(`🔥 ${attacker.name} ➤ 공격!`);

      // ✅ (추가) 서버가 updateGameState를 늦게 보낼 때 옛 HP로 덮이지 않도록 잠시 억제
      suppressSyncUntilRef.current = Date.now() + 700;

      // ✅ 서버로 공격 이벤트 전달 (서버가 HP 계산!)
      socket.emit("attackCard", {
        roomCode,
        attackerId: attacker.id,
        targetId,
      });

      // ✅ 공격 불가 적용
      setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));

      setSelectedAttacker(null);
      return;
    }
  };

  const handleEnemyCardClick = (targetId: string, e?: React.MouseEvent<HTMLDivElement>) => {
    if (e) e.preventDefault();
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

  // 기존: const handleEventAttack = (eventId: number) => {
  const handleEventAttack = (eventId: number, attackerIdParam?: string) => {
    if (!isMyTurn) {
      addMessageToLog("상대방 턴입니다!");
      return;
    }

    // 드래그로 전달된 attackerId 우선, 없으면 선택된 공격자 사용
    const attackerId = attackerIdParam || selectedAttacker;
    if (!attackerId) {
      addMessageToLog("먼저 공격할 내 카드를 선택하거나, 카드를 드래그하여 놓으세요!");
      return;
    }

    const attacker = myCardsInZone.find((c) => c.id === attackerId);
    if (!attacker) {
      console.warn("handleEventAttack: attacker not found", attackerId);
      addMessageToLog("공격할 카드 정보를 찾을 수 없습니다.");
      return;
    }

    if (!attacker.canAttack) {
      addMessageToLog(`${attacker.name}은(는) 이미 공격했습니다!`);
      return;
    }

    addMessageToLog(`⚔️ ${attacker.name}이(가) 이벤트를 공격합니다!`);

    // 서버로 공격 전송
    socket.emit("attackEvent", { roomCode, attackerId: attacker.id, eventId });

    // 공격 적용 (로컬)
    setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));
    setSelectedAttacker(null);

    // UI 낙관적 업데이트: 이벤트 HP 바로 감소 표시 (서버확인 전)
    setActiveEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, hp: Math.max(0, e.hp - (attacker.attack ?? 0)), temp: true } : e)));
  };

  const handleEndTurn = useCallback(() => {
    if (!isMyTurn) return;
    setSelectedAttacker(null);
    setHighlightCardId(null);
    socket.emit("endTurn", { roomCode });
    addMessageToLog("🔚 턴을 종료했습니다!");
  }, [isMyTurn, roomCode, socket, addMessageToLog]);

  const handleDirectAttackOnEnemy = useCallback(
    (attackerIdParam?: string) => {
      if (!isMyTurn) {
        showMessageBox("지금은 당신의 턴이 아닙니다!");
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

      // ✅ (추가) 서버가 updateGameState를 늦게 보낼 때 옛 HP로 덮이지 않도록 잠시 억제
      suppressSyncUntilRef.current = Date.now() + 700;

      socket.emit("directAttack", { roomCode, attackerId });
      addMessageToLog(`💥 ${attacker.name}이(가) 상대 플레이어를 직접 공격합니다!`);
      setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));
      setSelectedAttacker(null);
    },
    [isMyTurn, enemyCardsInZone, selectedAttacker, myCardsInZone, roomCode, socket, turn, addMessageToLog]
  );

  const handleEnemyZoneInteraction = useCallback(
    (e?: React.MouseEvent<HTMLDivElement> | React.DragEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
      if (!isMyTurn) return;
      if (!e) return;

      e.preventDefault();

      // 드래그 이벤트(dataTransfer 존재)
      let attackerId: string | null = null;

      if ("dataTransfer" in e && e.dataTransfer) {
        attackerId = e.dataTransfer.getData("attackerId") || selectedAttacker;
      } else {
        // 클릭 이벤트
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        e.preventDefault(); // 기본 focus 이동 막기
        setShowHand((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ===== 패배 연출 =====
  useEffect(() => {
    if (surrendering) return; // ✅ 항복 중이면 자동 패배 연출 금지
    if (playerHP <= 0) {
      // 1. ✅ 화면 어둡게 (포켓몬 연출)
      addMessageToLog("내 체력이 0이 되었습니다!");
      setIsDimming(true);

      // ✅ 2초 뒤 DEFEAT 표시
      setTimeout(() => {
        SoundManager.play("defeat");
        setShowDefeatBanner(true);

        // ✅ 3초 뒤 패배 배너 제거 → GameOverScreen 페이드인 시작
        setTimeout(() => {
          setShowDefeatBanner(false);
          setIsVictory(false);
          setGameOverMessage("패배하였습니다...");
          setFadeInGameOver(true);

          setShowGameOver(true);
        }, 3000);
      }, 2000);
    }
  }, [playerHP]);

  // ===== 승리 연출 =====
  useEffect(() => {
    if (enemyHP <= 0) {
      addMessageToLog("상대 체력이 0이 되었습니다!");

      // 화면 전환
      setIsDimming(true);

      // ✅ 폭죽 활성화
      setShowFireworks(true);

      // 2초 후 승리 카드 표시
      setTimeout(() => {
        SoundManager.play("victory");
        setShowVictoryBanner(true);

        // 3초 뒤 종료 화면
        setTimeout(() => {
          setShowVictoryBanner(false);
          setIsVictory(true);
          setGameOverMessage("승리하였습니다...");
          setFadeInGameOver(true);
          setShowGameOver(true);

          // ✅ 승리 카드 등장 끝날 때 폭죽 끄기
          setShowFireworks(false);
        }, 3000);
      }, 2000);
    }
  }, [enemyHP]);

  const handleGameOver = ({ winnerId, loserId, reason }: { winnerId: string; loserId: string; reason?: string }) => {
    setIsGameOverState(true);
    SoundManager.stopBGM();

    const me = socket.id;
    const iWon = me === winnerId;
    const iLost = me === loserId;

    const MESSAGE_TIME = 3500;
    const BANNER_TIME = 3000;

    const now = Date.now();
    const start = window.__surrenderMessageStart ?? now;

    // ✅ 남은 메시지박스 유지 시간 계산
    const remain = Math.max(0, MESSAGE_TIME - (now - start));
    console.log("⏱ 남은 메시지박스 시간:", remain);

    // ✅ 내가 패배했을 때
    if (iLost) {
      if (reason === "surrender") {
        showMessageBox("항복하였습니다...", remain);
        setGameOverMessage("항복하였습니다...");
      } else {
        showMessageBox("패배하였습니다...", remain);
        setGameOverMessage("패배하였습니다...");
      }

      setIsVictory(false);

      setTimeout(() => {
        SoundManager.play("defeat");
        setShowDefeatBanner(true);
        setTimeout(() => {
          setShowDefeatBanner(false);
          setFadeInGameOver(true);
          setShowGameOver(true);
        }, BANNER_TIME);
      }, remain);

      return;
    }

    // ✅ 내가 승리했을 때
    if (iWon) {
      if (reason === "surrender") {
        showMessageBox("상대가 항복했습니다!", MESSAGE_TIME, true);
        setGameOverMessage("상대가 항복했습니다!");
      } else if (reason === "hp-zero") {
        showMessageBox("승리하였습니다!", MESSAGE_TIME, true);
        setGameOverMessage("승리하였습니다!");
      }

      setIsVictory(true);

      setTimeout(() => {
        SoundManager.play("victory");
        setShowVictoryBanner(true);
        setTimeout(() => {
          setShowVictoryBanner(false);
          setFadeInGameOver(true);
          setShowGameOver(true);
        }, BANNER_TIME);
      }, MESSAGE_TIME);
    }
  };

  // ✅ 항복 처리 함수 추가
  // ✅ 항복 버튼 클릭 (재확인 + 5턴 조건 + 연타 방지)
  const handleSurrenderClick = () => {
    // ✅ 5턴 이전 항복 불가
    if (turn < 5) {
      showMessageBox("5턴 이후부터 항복할 수 있습니다!");
      return;
    }

    // ✅ 연타 방지 (1초 쿨타임)
    if (!canClickSurrender) return;
    setCanClickSurrender(false);
    setTimeout(() => setCanClickSurrender(true), 1000);

    // ✅ 항복 재확인 팝업 띄우기
    setShowSurrenderConfirm(true);
  };

  // ✅ 항복 확정
  const confirmSurrender = () => {
    setShowSurrenderConfirm(false);

    // ✅ 항복 중 플래그 ON
    setSurrendering(true);

    // ✅ 메시지박스 시작 시간 기록
    window.__surrenderMessageStart = Date.now();

    // ✅ 5초 유지
    showMessageBox("항복했습니다...", 5000, true);

    socket.emit("surrender", { roomCode, playerId: socket.id });
  };

  // ✅ 항복 취소
  const cancelSurrender = () => {
    setShowSurrenderConfirm(false);
  };

  if (!socket) {
    return <div style={{ color: "white", padding: 20 }}>서버 연결 중... 잠시만 기다려주세요.</div>;
  }

  // ===== 렌더 =====
  return (
    <div className="battle-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* ✅ 메시지박스 표시 */}
      {messageBox && <MessageBox onClose={() => setMessageBox(null)}>{messageBox}</MessageBox>}

      <div className={`chat-log-container ${isChatOpen ? "chat-open" : "chat-unopen"}`}>
        <div className="chat-log-header" onClick={() => setIsChatOpen(!isChatOpen)}>
          <span className="chat-log-toggle">{isChatOpen ? "▼" : "►"}</span>
          <span className="chat-log-title">게임 로그</span>
        </div>

        {isChatOpen ? (
          <div className="chat-log-history" ref={chatHistoryRef}>
            {messageHistory.length === 0 && <div className="chat-log-message placeholder">게임이 시작되었습니다.</div>}
            {messageHistory.map((msg, index) => (
              <div key={index} className="chat-log-message">
                {msg}
              </div>
            ))}
          </div>
        ) : (
          <div className="chat-log-latest">{messageHistory[0] || "게임 로그가 여기에 표시됩니다."}</div>
        )}
      </div>

      {/* === 전장 === */}
      <div className="field-container">
        {/* === 🔥 상대 버린 카드 잔상(페이드) === */}
        {enemyDiscardGhost && (
          <div className="enemy-discard-ghost">
            <img src={enemyDiscardGhost.image} alt={enemyDiscardGhost.name} />
          </div>
        )}
        <div className="Top-Line" />
        <div className="TopLeft-Dia" />
        <div className="TopRight-Dia" />
        <div className="Bottom-Line" />
        <div className="BottomLeft-Dia" />
        <div className="BottomRight-Dia" />
        <div className="enemy-card-bg" />
        <div className="enemy-field" />

        <div className="player-card-bg" />
        <div className="player-field" />

        <div className="enemy-hand-zone">
          {Array.from({ length: enemyHandCount }).map((_, i) => (
            <div key={i} className="enemy-hand-card" />
          ))}
        </div>

        <div
          id="enemy-field-target"
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
                <motion.div
                  id={`card-${card.id}`}
                  className={`enemy-card in-zone ${card.isDestroyed ? "card-destroyed" : ""}`}
                  onMouseDown={(e) => handleCardMouseDown(card, e)}
                  animate={{
                    // 🔥 피격 애니메이션 (적 카드도 흔들리게)
                    x: hitCardId === card.id ? [-12, 12, -6, 6, 0] : 0,
                  }}
                  transition={{
                    duration: hitCardId === card.id ? 0.35 : 0.3,
                  }}
                >
                  {/* 🔥 3D 모델이 올라오는 공간 */}
                  {show3D && (
                    <div className="card-3d-area">
                      <Canvas>
                        <ambientLight intensity={1} />
                        <directionalLight position={[2, 5, 2]} />
                        <Suspense fallback={null}>
                          <SummonedCard3D
                            card={card}
                            owner="enemy"
                            isMyTurn={isMyTurn}
                            isHit={hitCardId === card.id}
                            isDestroyed={!!card.isDestroyed}
                            getCardRect={() => document.getElementById(`card-${card.id}`)?.getBoundingClientRect()}
                          />
                        </Suspense>
                      </Canvas>
                    </div>
                  )}

                  <img src={getImageUrl(card.image)} alt={card.name} />

                  {/* 🔥 데미지 팝업 표시 */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <AnimatePresence>
                      {card.damagePopups?.map((pop) => (
                        <DamagePopup key={pop.id} amount={pop.amount} />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* 🔥 피격 Flash 오버레이 (원하면 추가) */}
                  {hitCardId === card.id && (
                    <motion.div className="hit-flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }} transition={{ duration: 0.25 }} />
                  )}

                  <div className="card-hp-bar">
                    <div className="card-hp-bar-inner" style={{ width: `${(card.hp / card.maxhp) * 100}%` }} />
                    <div className="card-hp-text">
                      {card.hp}/{card.maxhp}
                    </div>
                  </div>
                </motion.div>
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
                <motion.div
                  key={card.id}
                  className="card-motion-wrapper"
                  animate={{
                    // 공격 애니메이션
                    y: attackingCardId === card.id ? -40 : 0,
                    rotate: attackingCardId === card.id ? -6 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 260,
                    damping: 18,
                    duration: 0.35,
                  }}
                >
                  <motion.div
                    id={`card-${card.id}`}
                    className={`my-card in-zone 
                    ${card.discardFade ? "card-discard-fade" : ""} 
                    ${card.isDestroyed ? "card-destroyed" : ""} 
                    ${card.canAttack ? "can-attack" : "cannot-attack"}
  `}
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
                    onContextMenu={(e) => handleFieldDiscardRequest(e, card)} // ⭐ 필드 우클릭 버리기 추가
                    animate={{
                      // 🔥 더 강력한 선택 효과
                      ...(highlightCardId === card.id
                        ? {
                            scale: [1, 1.12, 1.08, 1.12, 1],
                            boxShadow: [
                              "0 0 0px rgba(0,255,255,0)",
                              "0 0 20px rgba(0,255,255,1)",
                              "0 0 35px rgba(0,255,255,0.85)",
                              "0 0 20px rgba(0,255,255,1)",
                              "0 0 0px rgba(0,255,255,0)",
                            ],
                            filter: ["brightness(1)", "brightness(1.25)", "brightness(1.15)"],
                          }
                        : { scale: 1, boxShadow: "none", filter: "brightness(1)" }),

                      // 🔥 피격 애니메이션 유지
                      ...(hitCardId === card.id ? { x: [-8, 8, -5, 5, 0] } : { x: 0 }),
                    }}
                    transition={{
                      duration: highlightCardId === card.id ? 1.2 : 0.35,
                      repeat: highlightCardId === card.id ? Infinity : 0,
                    }}
                  >
                    {/* 🔥 3D 모델이 올라오는 공간 */}
                    {show3D && (
                      <div className="card-3d-area">
                        <Canvas>
                          <ambientLight intensity={1} />
                          <directionalLight position={[2, 5, 2]} />
                          <Suspense fallback={null}>
                            <SummonedCard3D
                              card={card}
                              owner="me"
                              isMyTurn={isMyTurn}
                              isHit={hitCardId === card.id}
                              isDestroyed={!!card.isDestroyed}
                              getCardRect={() => document.getElementById(`card-${card.id}`)?.getBoundingClientRect()}
                            />
                          </Suspense>
                        </Canvas>
                      </div>
                    )}

                    {/* 카드 이미지 */}
                    <img src={getImageUrl(card.image)} alt={card.name} className={`card-image ${!isMyTurn ? "gray-filter" : ""}`} />

                    {/* 🔥 데미지 팝업 */}
                    <div
                      style={{
                        position: "absolute",
                        top: "-12px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        pointerEvents: "none",
                      }}
                    >
                      <AnimatePresence>
                        {card.damagePopups?.map((pop) => (
                          <DamagePopup key={pop.id} amount={pop.amount} />
                        ))}
                      </AnimatePresence>
                    </div>

                    {/* 🔥 피격 Flash */}
                    {hitCardId === card.id && (
                      <motion.div className="hit-flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.7, 0] }} transition={{ duration: 0.25 }} />
                    )}

                    {/* 🔥 선택된 카드 glow ring */}
                    {highlightCardId === card.id && (
                      <motion.div
                        className="glow-ring"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      />
                    )}

                    {/* HP Bar */}
                    <div className="card-hp-bar">
                      <div className="card-hp-bar-inner" style={{ width: `${(card.hp / card.maxhp) * 100}%` }} />
                      <div className="card-hp-text">
                        {card.hp}/{card.maxhp}
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
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
                style={{
                  zIndex: handCards.length - index,
                  position: "relative",
                }}
                onMouseEnter={() => setTooltip(card.id)}
                onMouseLeave={() => setTooltip(null)}
              >
                {/* 🔥 타입 컬러 강조 + 세련된 툴팁 */}
                {tooltip === card.id && (
                  <div
                    className="hand-card-tooltip show"
                    style={{
                      borderColor: typeColorMap[card.cardType ?? "normal"],
                      top: "-75px",
                    }}
                  >
                    <div className="tooltip-name" style={{ color: typeColorMap[card.cardType ?? "normal"] }}>
                      {card.name}
                    </div>

                    <div style={{ opacity: 0.85 }}>
                      Type: <span style={{ color: typeColorMap[card.cardType ?? "normal"] }}>{card.cardType}</span>
                    </div>

                    <div style={{ opacity: 0.9 }}>Cost: {card.cost}</div>
                  </div>
                )}

                <div
                  className="my-card hand-card"
                  onClick={(e) => {
                    if (showHand) {
                      e.stopPropagation();
                      handleCardClick(card.id, false, e);
                    }
                  }}
                  onContextMenu={(e) => handleDiscardRequest(e, card)}
                >
                  <img src={getImageUrl(card.image)} alt={card.name} className={`card-image ${!isMyTurn ? "gray-filter" : ""}`} />
                </div>
              </div>
            ))}
            {!showHand && handCards.length > 0 && <div className="hand-count-overlay">{handCards.length} 장</div>}
            {handCards.length === 0 && <div className="hand-count-overlay no-cards">손패 없음</div>}
          </div>
        </div>

        <div className="enemy-grave grave-text">⚰️ 상대 묘지 ({enemyGraveCount})</div>

        <div className="enemy-cost-zone">
          {Array.from({
            length: Math.max(0, Math.min(MAX_COST, Math.floor(Number(opponentCostIcons) || 0))),
          }).map((_, i) => (
            <div key={i} className="cost-icon" />
          ))}
        </div>
        <div className="player-cost-zone">
          {Array.from({
            length: Math.max(0, Math.min(MAX_COST, Math.floor(Number(playerCostIcons) || 0))),
          }).map((_, i) => (
            <div key={i} className="cost-icon" />
          ))}
        </div>

        <div
          className={`player-grave clickable-grave 
            ${hasShuffledThisTurn ? "disabled" : ""} 
            ${isDraggingOverGrave ? "drag-over" : ""}
          `}
          onClick={() => {
            if (!isMyTurn) {
              showMessageBox("지금은 당신의 턴이 아닙니다!");
              return;
            }
            if (graveCount === 0) {
              showMessageBox("묘지가 비어 있습니다!");
              return;
            }
            if (hasShuffledThisTurn) {
              showMessageBox("이번 턴에는 이미 묘지를 섞었습니다!");
              return;
            }
            console.log("🧩 묘지 셔플 요청 전송:", roomCode);
            setShuffleAnim(true);

            setTimeout(() => {
              socket.emit("shuffleGraveyard", { roomCode });
              setShuffleAnim(false);
            }, 500);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => handleGraveDrop(e)}
          title={!isMyTurn ? "상대 턴입니다!" : "묘지를 클릭하면 덱으로 섞입니다"}
        >
          ⚰️ 묘지 ({graveCount})
        </div>
      </div>

      {/* === 오른쪽 사이드 영역 === */}
      <div className="right-container">
        {/* 버튼 2개 가로 정렬하는 래퍼 */}
        <div className="action-buttons">
          <button className="bgm-mute-btn" onClick={toggleMute}>
            {muted ? "🔇" : "🔊"}
          </button>

          <button className={`toggle-3d-btn ${show3D ? "on" : "off"}`} onClick={() => setShow3D((prev) => !prev)}>
            {show3D ? "3D ON (V)" : "3D OFF (V)"}
          </button>
        </div>

        <div
          id="enemy-player-target"
          className={`enemy-info ${!isMyTurn ? "isEnemyTurn" : ""} ${
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
          {/* 🔥 아바타 + HP 바만 흔들리게 하는 motion.div */}
          <motion.div
            className="enemy-hit-wrapper"
            animate={{
              x: playerHit === "enemy" ? [-14, 14, -10, 10, 0] : 0,
            }}
            transition={{ duration: 0.35 }}
          >
            {/* 번쩍 플래시 */}
            {playerHit === "enemy" && (
              <motion.div className="player-hit-flash" initial={{ opacity: 0 }} animate={{ opacity: [0, 0.6, 0] }} transition={{ duration: 0.25 }} />
            )}

            {/* 🔥 Enemy Player Damage Popup */}
            <div
              style={{
                position: "absolute",
                top: "-20px",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}
            >
              <AnimatePresence>
                {enemyDamagePopups.map((pop) => (
                  <DamagePopup key={pop.id} amount={pop.amount} />
                ))}
              </AnimatePresence>
            </div>

            {/* 기존 내용 */}
            <div className="enemy-avatar" />
            <div className="hp-bar">
              <div className="hp-bar-inner" style={{ width: `${(enemyHP / MAX_HP) * 100}%` }} />
              <div className="hp-text">
                {enemyHP}/{MAX_HP}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ================================
    🔥 Event Zone (변경 없음)
================================ */}
        <div className="event-zone">
          <div className="event-items-container">
            {activeEvents.map((event) => (
              <div
                key={event.id}
                className="event-drop-wrapper"
                id={`event-monster-${event.id}`}
                onDragOver={(e) => {
                  if (!isMyTurn) return;
                  e.preventDefault();
                }}
                onDrop={(e) => {
                  if (!isMyTurn) return;
                  e.preventDefault();
                  const attackerId = e.dataTransfer.getData("attackerId");
                  if (attackerId) {
                    handleEventAttack(event.id, attackerId);
                  } else {
                    console.warn("drop without attackerId", e.dataTransfer);
                    handleEventAttack(event.id);
                  }
                  setIsDragActive(false);
                }}
              >
                <motion.div
                  id={`event-monster-${event.id}`}
                  className="event-monster-wrapper"
                  animate={{
                    x: hitCardId === String(event.id) ? [-12, 12, -8, 8, 0] : 0,
                  }}
                  transition={{
                    duration: hitCardId === String(event.id) ? 0.35 : 0.3,
                  }}
                >
                  <EventItem event={event} onClick={() => handleEventAttack(event.id)} />
                  {/* 🔥 이벤트몬스터 Damage Popup */}
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      pointerEvents: "none",
                    }}
                  >
                    <AnimatePresence>
                      {event.damagePopups?.map((pop) => (
                        <DamagePopup key={pop.id} amount={pop.amount} />
                      ))}
                    </AnimatePresence>
                  </div>
                </motion.div>
              </div>
            ))}
          </div>

          <button className="endturn-button" onClick={handleEndTurn}>
            턴 종료 (E)
            <CiClock1 size={28} />
          </button>
        </div>

        {/* ================================
    🔥 my-player-target (수정 완료)
================================ */}
        <div id="my-player-target" className={`player-info ${isMyTurn ? "isMyTurn" : ""}`}>
          {/* 나도 아바타 + HP 바만 흔들리게 */}
          <motion.div
            className="player-hit-wrapper"
            animate={{
              x: playerHit === "me" ? [-14, 14, -10, 10, 0] : 0,
            }}
            transition={{ duration: 0.35 }}
          >
            {/* 🔥 My Player Damage Popup */}
            <div
              style={{
                position: "absolute",
                top: "-20px",
                left: "50%",
                transform: "translateX(-50%)",
                pointerEvents: "none",
              }}
            >
              <AnimatePresence>
                {playerDamagePopups.map((pop) => (
                  <DamagePopup key={pop.id} amount={pop.amount} />
                ))}
              </AnimatePresence>
            </div>

            <div className="player-avatar" />
            <div className="hp-bar">
              <div className="hp-bar-inner" style={{ width: `${(playerHP / MAX_HP) * 100}%` }} />
              <div className="hp-text">
                {playerHP}/{MAX_HP}
              </div>
            </div>
          </motion.div>

          <div className={`surrender-button ${turn >= 5 ? "" : "disabled"}`} onClick={handleSurrenderClick}>
            항복 <CiFlag1 />
          </div>
        </div>
      </div>

      {/* ✅ 항복 재확인 팝업 */}
      {showSurrenderConfirm && (
        <div className="surrender-popup">
          <div className="surrender-popup-content">
            <p>정말 항복하시겠습니까?</p>
            <button className="confirm" onClick={confirmSurrender}>
              예
            </button>
            <button className="cancel" onClick={cancelSurrender}>
              아니오
            </button>
          </div>
        </div>
      )}

      {/* ✅ 포켓몬 카드게임 스타일 DEFEAT 카드 */}
      {showDefeatBanner && (
        <div className="defeat-card-banner">
          <div className="defeat-card">
            <span className="defeat-text">DEFEAT</span>
          </div>
        </div>
      )}

      {/* ✅ 포켓몬 스타일 VICTORY 카드 */}
      {showVictoryBanner && (
        <div className="victory-card-banner">
          <div className="victory-card">
            <span className="victory-text">VICTORY</span>
          </div>
        </div>
      )}

      {/* ✅ 폭죽 애니메이션 */}
      {showFireworks && (
        <div className="fireworks-container">
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
          <div className="firework"></div>
        </div>
      )}

      {/* ✅ GameOverScreen 페이드-in 적용 */}
      {showGameOver && (
        <div className={`gameover-fade-wrapper ${fadeInGameOver ? "fade-in" : ""}`}>
          <GameOverScreen message={gameOverMessage} isVictory={isVictory} onGoToMainMenu={() => navigate("/main")} />
        </div>
      )}

      {showLeaveConfirm && (
        <div className="surrender-popup">
          <div className="surrender-popup-content">
            <p>
              뒤로 가시겠습니까?
              <br />
              게임이 종료되며 패배로 처리됩니다.
            </p>
            <button
              className="confirm"
              onClick={() => {
                setShowLeaveConfirm(false);

                // 패배 처리
                socket.emit("surrender", { roomCode, playerId: socket.id });

                // 메인으로 이동
                navigate("/main");
              }}
            >
              예
            </button>
            <button className="cancel" onClick={() => setShowLeaveConfirm(false)}>
              아니오
            </button>
          </div>
        </div>
      )}

      {showDiscardConfirm && pendingDiscard && (
        <div className="surrender-popup">
          <div className="surrender-popup-content">
            <p>
              이 카드를 묘지로 버리겠습니까?
              <br />
              {(() => {
                const cost = Number(pendingDiscard.card.cost ?? 1);
                const tier = Number(pendingDiscard.card.tier ?? 1);

                let hpPenalty = 5 + cost * 3 + tier * 2;
                if (playerCostIcons <= 0) hpPenalty += 5;

                return (
                  <>
                    <strong>HP -{hpPenalty}</strong> (코스트 -1)
                  </>
                );
              })()}
            </p>

            <button className="confirm" onClick={pendingDiscard.confirm}>
              예
            </button>
            <button
              className="cancel"
              onClick={() => {
                setShowDiscardConfirm(false);
                setPendingDiscard(null);
              }}
            >
              아니오
            </button>
          </div>
        </div>
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

      {/* ✅ FC온라인 스타일 채팅 버튼 + 패널 */}
      <DraggableChat socket={socket} roomCode={roomCode} myUserId={socket.id} myName={userInfo?.nickname ?? "Player"} />
    </div>
  );
}

export default BattlePage;
