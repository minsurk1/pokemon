// BattlePage.tsx 전체 코드
"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { CiClock1 } from "react-icons/ci";

import "./BattlePage.css";
import MessageBox from "../../components/common/MessageBox";
import GameOverScreen from "../../components/battle/GameOverScreen";
import CircularTimer from "../../components/battle/CircularTimer"; // ✅ 경로에 맞게 조정
import BurnLineComponent from "../../components/battle/BurnLineComponent";
import { Card } from "../../types/Card";
import { CiFlag1 } from "react-icons/ci";

// ===================== 🔥 이벤트 시스템 추가 =====================
import EventItem from "../../components/battle/Eventitem"; // ✅ EventItem 임포트

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
const getImageUrl = (imagePath: string) => {
  if (!imagePath) return `${IMAGE_URL}/default.png`;
  if (imagePath.startsWith("http")) return imagePath;
  const fname = pickFileName(imagePath);
  return `${IMAGE_URL}/${fname || "default.png"}`;
};

// ✅ 이름 기반 타입 감지 함수 (백업용)
const detectTypeByName = (name: string) => {
  const lower = name.toLowerCase();
  if (lower.includes("불") || lower.includes("fire")) return "fire";
  if (lower.includes("물") || lower.includes("water")) return "water";
  if (lower.includes("숲") || lower.includes("forest")) return "forest";
  if (lower.includes("전기") || lower.includes("electric")) return "electric";
  if (lower.includes("벌레") || lower.includes("worm")) return "worm";
  if (lower.includes("에스퍼") || lower.includes("esper")) return "esper";
  if (lower.includes("땅") || lower.includes("land")) return "land";
  if (lower.includes("얼음") || lower.includes("ice")) return "ice";
  if (lower.includes("독") || lower.includes("poison")) return "poison";
  if (lower.includes("비행") || lower.includes("fly")) return "fly";
  return "normal";
};

// ✅ 카드 표준화 함수 (서버로 보내는 카드 정리)
const normalizeCard = (card: any) => {
  const realType = card.cardType || card.type || detectTypeByName(card.cardName ?? card.name) || "normal";

  // ✅ 이미지 우선순위: image2D > image > fallback
  const imagePath = card.image2D ?? card.image ?? `${card.cardType ?? "normal"}Tier${card.tier ?? 1}.png`;

  const fullImageUrl = imagePath.startsWith("http") ? imagePath : `${IMAGE_URL}/${imagePath}`;

  return {
    id: String(card.id ?? card._id ?? card.cardId),
    // ✅ cardName을 우선 사용
    name: String(card.cardName ?? card.name ?? "Unknown"),
    cardType: realType,
    tier: Number(card.tier ?? 1),
    // ✅ 숫자로 강제 변환
    attack: Number(card.attack ?? card.damage ?? 0),
    hp: Number(card.hp ?? 0),
    maxhp: Number(card.maxhp ?? card.hp ?? 0),
    cost: Number(card.cost ?? card.tier ?? 1),
    image: fullImageUrl,
    // ✅ 공격 가능 여부를 기본 true로
    canAttack: card.canAttack ?? true,
  };
};

// ✅ 카드 형태 통일 함수 (서버·클라이언트 혼합 대응)
const keepCardShape = (c: any): Card => {
  const baseCard = c.card && typeof c.card === "object" && !Array.isArray(c.card) ? c.card : c;

  // ✅ 이미지 결정 (image2D > image > fallback)
  const imgSource =
    baseCard.image2D ??
    baseCard.image ??
    c.image2D ??
    c.image ??
    `${baseCard.cardType ?? c.cardType ?? "normal"}Tier${baseCard.tier ?? c.tier ?? 1}.png`;

  // ✅ 절대 URL 변환
  const image = imgSource.includes("http") ? imgSource : `${IMAGE_URL}/${imgSource.split("/").pop()}`;

  return {
    id: String(baseCard._id ?? baseCard.id ?? c.id),
    name: String(baseCard.cardName ?? baseCard.name ?? c.cardName ?? c.name ?? "Unknown"),
    cardType: baseCard.cardType ?? c.cardType ?? "normal",
    tier: Number(baseCard.tier ?? c.tier ?? 1),
    attack: Number(baseCard.attack ?? c.attack ?? 0),
    hp: Number(baseCard.hp ?? c.hp ?? 0),
    maxhp: Number(baseCard.maxhp ?? baseCard.hp ?? c.maxhp ?? c.hp ?? 0),
    cost: Number(baseCard.cost ?? c.cost ?? baseCard.tier ?? c.tier ?? 1),
    image,

    // ✅ 공격 여부 정보 유지 (서버에서 내려올 때 반영)
    canAttack: baseCard.canAttack ?? c.canAttack ?? true,
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

  // 🔥 손패 펼침/접힘 상태 추가
  const [showHand, setShowHand] = useState(false);

  const [playerHP, setPlayerHP] = useState(2000);
  const [enemyHP, setEnemyHP] = useState(2000);
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [handCards, setHandCards] = useState<Card[]>([]);
  const [myCardsInZone, setMyCardsInZone] = useState<Card[]>([]);
  const [enemyCardsInZone, setEnemyCardsInZone] = useState<Card[]>([]);
  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);

  // ✅ cost 상태를 항상 안전하게 숫자로 관리
  const [playerCostIcons, setPlayerCostIcons] = useState<number>(1);
  const [opponentCostIcons, setOpponentCostIcons] = useState<number>(1);

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");

  const [lastPlayedCardId, setLastPlayedCardId] = useState<string | null>(null);
  const [lastEnemyCardId, setLastEnemyCardId] = useState<string | null>(null);

  const [turnTime, setTurnTime] = useState(INITIAL_TIME);

  // 상대 손에 들고 있는 패의 개수
  const [enemyHandCount, setEnemyHandCount] = useState<number>(8);

  // ✅ 한 턴에 1번만 드로우 가능
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);

  const [deckLoaded, setDeckLoaded] = useState(false); // ✅ 덱 로딩 여부

  // 🧩 드래그 중 카드 프리뷰 상태
  const [dragPreview, setDragPreview] = useState<{
    x: number;
    y: number;
    image: string;
  } | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  // 🧩 클릭 기반 고스트 프리뷰 상태 관리
  const [isHoldingCard, setIsHoldingCard] = useState(false);
  const [heldCard, setHeldCard] = useState<Card | null>(null);

  // ✅ 초기 턴 이벤트 임시 저장용 버퍼
  const pendingTurnPayload = useRef<TurnPayload | string | null>(null);

  // 최신 턴/내턴 상태를 유지하는 ref
  const isMyTurnRef = useRef(isMyTurn);
  const currentTurnIdRef = useRef(currentTurnId);
  const lastTurnIdRef = useRef<string | null>(null);

  // ++++++++++++++++ [추가된 Event 상태] ++++++++++++++++
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  // +++++++++++++++++++++++++++++++++++++++++++++++++++

  // (useEffect ref 동기화 - 변경 없음)
  useEffect(() => {
    isMyTurnRef.current = isMyTurn;
  }, [isMyTurn]);
  useEffect(() => {
    currentTurnIdRef.current = currentTurnId;
  }, [currentTurnId]);

  // (applyTurnChange - 변경 없음)
  const applyTurnChange = useCallback(
    (payload: TurnPayload | string) => {
      console.log("✅ applyTurnChange 실행:", payload);

      const myId = socket.id;
      if (!myId) return;

      // ✅ 이미 처리한 턴이면 무시
      const curr = typeof payload === "string" ? payload : payload.currentTurn ?? null;
      // ✅ 동일 턴 중복 처리 방지
      if (curr !== null && lastTurnIdRef.current === curr) {
        console.log("⏩ 동일 턴 이벤트 무시:", curr);
        return;
      }
      lastTurnIdRef.current = curr;

      setHasDrawnThisTurn(false);
      // ✅ 서버가 payload를 socketId 문자열로 보낸 경우
      if (typeof payload === "string") {
        const mine = payload === myId;

        setCurrentTurnId(payload);
        setIsMyTurn(mine);

        // ❌ setTurn((t) => t + 1); 제거!

        if (mine) {
          setMyCardsInZone((prev) => prev.map((c) => ({ ...c, canAttack: true })));
        }

        setMessage(mine ? "🔵 내 턴입니다!" : "🔴 상대 턴입니다.");
        setShowMessage(true);
        return;
      }

      // ✅ 객체 payload인 경우
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
        setPlayerHP(hp[myId] ?? 2000);
        const oppId = Object.keys(hp).find((id) => id !== myId);
        if (oppId) setEnemyHP(hp[oppId] ?? 2000);
      }

      if (mine) {
        setMyCardsInZone((prev) => prev.map((c) => ({ ...c, canAttack: true })));
      }

      setMessage(mine ? "🔵 내 턴입니다!" : "🔴 상대 턴입니다.");
      setShowMessage(true);
    },
    [socket.id]
  );

  useEffect(() => {
    if (socket.connected && socket.id) {
      setMySocketId(socket.id);
    }
  }, [socket.connected, socket.id]);

  // ✅ 덱 초기화
  const initializeDeckAndHand = useCallback(() => {
    if (!selectedDeck || selectedDeck.length === 0) return;
    const normalized = selectedDeck.map(keepCardShape);
    const shuffled = [...normalized].sort(() => Math.random() - 0.5);
    setHandCards(shuffled.slice(0, 3));
    setDeckCards(shuffled.slice(3));
  }, [selectedDeck]);

  // ✅ 덱 초기화 useEffect
  useEffect(() => {
    const looksLikeIds = Array.isArray(selectedDeck) && selectedDeck.length > 0 && typeof selectedDeck[0] === "string";

    // selectedDeck이 비어있거나, string[]이면 서버에서 가져옴
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
            console.log("✅ 유저 덱 불러오기 성공:", cards);
            const shuffled = [...cards].sort(() => Math.random() - 0.5);
            setHandCards(shuffled.slice(0, 3));
            setDeckCards(shuffled.slice(3));

            setDeckLoaded(true); // ✅ 덱 로딩 완료
          } else {
            console.warn("⚠️ 덱 데이터가 없습니다.");
          }
        } catch (e) {
          console.error("❌ 덱 불러오기 실패:", e);
        }
      })();
    } else {
      // selectedDeck이 이미 카드 객체면 그대로 사용
      const cards = selectedDeck.map(keepCardShape);
      console.log("✅ 전달받은 덱 사용:", cards);
      const shuffled = [...cards].sort(() => Math.random() - 0.5);
      setHandCards(shuffled.slice(0, 3));
      setDeckCards(shuffled.slice(3));
      setDeckLoaded(true);
    }
  }, [selectedDeck]);

  // ===== 소켓 연결 =====
  useEffect(() => {
    console.log("🎮 BattlePage 연결 및 상태 요청 완료:", socket.id);
    if (!socket.connected || !socket.id) return;
    socket.emit("joinRoom", { roomCode });
    socket.emit("getGameState", { roomCode }); // ✅ 상태 요청 추가
    socket.emit("requestTurn", { roomCode });
  }, []);

  // ===== 덱이 준비되면 서버에 덱 전송 =====
  useEffect(() => {
    if (!socket.connected) return;
    if (!selectedDeck || selectedDeck.length === 0) return;

    const isIdArray = Array.isArray(selectedDeck) && selectedDeck.length > 0 && typeof selectedDeck[0] === "string";
    if (isIdArray) return; // 서버가 알아서 로드하는 케이스면 전송 X

    if ((window as any)._deckSent) return; // 중복 전송 방지

    socket.emit("sendDeck", {
      roomCode,
      deck: selectedDeck.map(keepCardShape),
    });

    (window as any)._deckSent = true;
    console.log("🚀 덱 서버 전송 완료:", selectedDeck);
  }, [socket.connected, selectedDeck, roomCode]);

  // 덱 로그 확인 용
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

  // ✅ 수동 드로우 함수
  const drawCard = useCallback(() => {
    if (!isMyTurn) {
      setMessage("지금은 당신의 턴이 아닙니다!");
      setShowMessage(true);
      return;
    }

    if (hasDrawnThisTurn) {
      setMessage("이번 턴에는 이미 드로우했습니다!");
      setShowMessage(true);
      return;
    }

    if (deckCards.length === 0) {
      setMessage("덱이 비어 있습니다!");
      setShowMessage(true);
      return;
    }

    const drawnCard = deckCards[0];
    setHandCards((prev) => [...prev, drawnCard]);
    setDeckCards((prev) => prev.slice(1));
    setHasDrawnThisTurn(true);

    console.log(`🎴 드로우: ${drawnCard.name}`);
    setMessage(`📥 ${drawnCard.name} 카드를 드로우했습니다!`);
    setShowMessage(true);
  }, [isMyTurn, hasDrawnThisTurn, deckCards]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d") {
        drawCard();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawCard]);

  // ===== 서버 이벤트 처리 =====
  useEffect(() => {
    console.log("🌐 socket listeners registered once");

    if (!socket.connected) return;

    const onError = (msg: string) => {
      setMessage(`🚫 오류: ${msg}`);
      setShowMessage(true);
    };

    const onGameStart = ({ currentTurn, hp, cost }: any) => {
      const myId = socket.id;
      if (!myId) return;

      // ✅ 초기 턴 반영
      setCurrentTurnId(currentTurn);
      setIsMyTurn(currentTurn === myId);

      setPlayerHP(hp[myId] ?? 2000);
      const opp = Object.keys(hp).find((id) => id !== myId);
      if (opp) setEnemyHP(hp[opp] ?? 2000);

      setHasDrawnThisTurn(false);

      setMessage(currentTurn === myId ? "🔵 게임 시작!" : "🔴 상대 선공!");
      setShowMessage(true);

      // ✅ 첫 턴 즉시 적용
      applyTurnChange({
        currentTurn,
        hp,
        cost,
        timeLeft: 30, // 서버 기본값과 동일하게
      });
    };

    // ✅ 호환형 턴 변경 핸들러
    const onTurnChanged = (payload: TurnPayload | string) => {
      console.log("🔥 turnChanged 수신:", payload);

      // socket.id가 아직 없으면 보류
      if (!socket.id) {
        console.log("⏳ socket.id 없음 → pending 저장:", payload);
        pendingTurnPayload.current = payload;
        return;
      }
      // ✅ socket.id가 이미 있는 경우 → 바로 적용
      applyTurnChange(payload);

      // ✅ 덱 로딩 상관없이 pending 처리
      if (pendingTurnPayload.current) {
        applyTurnChange(pendingTurnPayload.current);
        pendingTurnPayload.current = null;
      }
    };

    const onUpdateGameState = (data: any) => {
      const { hp, cost, decks, hands, graveyards, turnCount } = data;
      const myId = socket.id;
      if (!myId) return;

      // ✅ 디버그
      console.log("📥 updateGameState 수신:", data);

      if (data.turnCount !== undefined) {
        setTurn(data.turnCount);
      }

      // ✅ HP 반영
      if (data.hp) {
        const hp = data.hp as Record<string, number>;
        if (hp[myId] !== undefined) setPlayerHP(hp[myId]);

        const enemyId = Object.keys(hp).find((id) => id !== myId);
        if (enemyId && hp[enemyId] !== undefined) {
          setEnemyHP(hp[enemyId]);
        }
      }

      // ✅ 코스트 반영
      if (data.cost) {
        setPlayerCostIcons(Number(data.cost[myId]) || 0);
        const oppId = Object.keys(data.cost).find((id) => id !== myId);
        if (oppId) setOpponentCostIcons(Number(data.cost[oppId]) || 0);
      }

      // ✅ 손패
      if (data.hands && Array.isArray(data.hands[myId])) {
        const serverHand = data.hands[myId];

        // 서버가 빈 배열이면 무시 (수동 드로우 유지)
        if (serverHand.length > 0) {
          setHandCards(serverHand.map(keepCardShape));
        }
      }

      // ✅ 덱
      // ✅ 서버가 deck을 보냈을 때만 덮어쓰기, 클라이언트가 이미 셔플했다면 유지
      if (data.decks && data.decks[myId] && data.decks[myId].length > 0 && !deckLoaded) {
        setDeckCards(data.decks[myId].map(keepCardShape));
      }
      if (!deckLoaded && data.decks && data.decks[myId] && data.decks[myId].length > 0) {
        setDeckLoaded(true);
      }

      // ✅ 카드존
      if (data.cardsInZone) {
        if (data.cardsInZone[myId]) {
          setMyCardsInZone(
            data.cardsInZone[myId].map((c: any) => ({
              ...keepCardShape(c),
              canAttack: c.canAttack ?? true,
            }))
          );
        }

        const oppId = Object.keys(data.cardsInZone).find((id) => id !== myId);
        if (oppId && data.cardsInZone[oppId]) {
          setEnemyCardsInZone(
            data.cardsInZone[oppId].map((c: any) => ({
              ...keepCardShape(c),
              canAttack: c.canAttack ?? true,
            }))
          );
        }
      }

      // ++++++++++++++++ [추가] ++++++++++++++++
      // ✅ GameState에 포함된 activeEvent 동기화
      if (data.activeEvent) {
        setActiveEvents([data.activeEvent]);
      } else {
        setActiveEvents([]); // 이벤트가 없으면 비움
      }
      // ++++++++++++++++++++++++++++++++++++++++

      // ❌ 여기서 턴 전환 UI로직 절대 하지 말 것
      // ❌ setIsMyTurn() NO
      // ❌ applyTurnChange() NO
    };

    // ✅ 카드 소환 이벤트 (수신)
    const onCardSummoned = ({ playerId, card, updatedCost, cost }: any) => {
      console.log(`🃏 카드 소환 수신 from ${playerId} | 카드: ${card.name}`);

      const fixedCard = normalizeCard(card);

      // ✅ 공격력, 체력, 코스트 값이 숫자로 확실히 들어오게 보정
      fixedCard.attack = Number(fixedCard.attack ?? card.attack ?? card.damage ?? 0);
      fixedCard.hp = Number(fixedCard.hp ?? card.hp ?? 0);
      fixedCard.maxhp = Number(fixedCard.maxhp ?? card.maxhp ?? card.hp ?? 0);
      fixedCard.cost = Number(fixedCard.cost ?? card.cost ?? card.tier ?? 1);

      const newCard = { ...fixedCard, canAttack: true };

      if (playerId === socket.id) {
        // ✅ 내 카드 → 내 필드에 추가
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
        // ✅ 상대 카드 → 상대 필드에 추가 (핵심)
        setEnemyCardsInZone((prev) => {
          if (prev.find((c) => c.id === fixedCard.id)) return prev;
          return [...prev, fixedCard];
        });

        setLastEnemyCardId(fixedCard.id);
        setTimeout(() => setLastEnemyCardId(null), 1000);

        // ✅ 손패나 덱 상태에는 절대 추가하지 않음
        // (handCards나 deckCards는 내 화면 전용)

        setMessage(`상대가 ${fixedCard.name}을(를) 소환했습니다!`);
        setShowMessage(true);
      }

      // ✅ cost 동기화
      if (cost && typeof cost === "object") {
        const myId = socket.id ?? "";
        const opponentId = Object.keys(cost).find((id) => id !== myId);

        if (opponentId && cost[opponentId] !== undefined) {
          setOpponentCostIcons(Math.max(0, Number(cost[opponentId])));
        }
      }
    };

    // ✅ 카드 HP 갱신 수신
    const onUpdateCardHP = ({ targetId, newHP }: { targetId: string; newHP: number }) => {
      // 내 필드 / 상대 필드 모두 갱신
      setMyCardsInZone((prev) => prev.map((c) => (c.id === targetId ? { ...c, hp: newHP } : c)));
      setEnemyCardsInZone((prev) => prev.map((c) => (c.id === targetId ? { ...c, hp: newHP } : c)));
    };

    // ✅ 카드 파괴 수신
    const onCardDestroyed = ({ targetId, ownerId }: { targetId: string; ownerId: string }) => {
      const destroyedCard = [...myCardsInZone, ...enemyCardsInZone].find((c) => c.id === targetId);
      const name = destroyedCard?.name ?? "카드";

      if (ownerId === socket.id) {
        setMyCardsInZone((prev) => prev.filter((c) => c.id !== targetId));
        setMessage(`💀 내 ${name}이(가) 쓰러졌습니다...`);
      } else {
        setEnemyCardsInZone((prev) => prev.filter((c) => c.id !== targetId));
        setMessage(`🔥 상대의 ${name}이(가) 쓰러졌습니다!`);
      }
      setShowMessage(true);
    };

    const onGameOver = ({ winnerId }: any) => {
      const myId = socket.id ?? null;
      setShowGameOver(true);
      setGameOverMessage(myId === winnerId ? "🎉 승리했습니다!" : "💀 패배했습니다...");
    };

    // ✅ 서버에서 타이머 공유값 수신
    const onTimeUpdate = (time: number) => {
      if (!currentTurnIdRef.current) return; // ✅ 턴 없으면 타이머 무시
      setTurnTime(time);
      // console.log("🕒 타이머 동기화:", time);
    };

    const onTurnTimeout = () => {
      console.log("⏰ 턴 제한시간 만료");
      setMessage("⏰ 시간이 초과되어 턴이 넘어갔습니다.");
      setShowMessage(true);
      setIsMyTurn(false);
    };

    // (directAttack - ✨ 힐 로직 추가됨)
    const onDirectAttack = ({ attackerName, damage, newHP }: { attackerName: string; damage: number; newHP: number }) => {
      // 현재 턴 주체가 나면 내가 공격자, 아니면 피격자
      const iAmAttacker = currentTurnIdRef.current === socket.id;

      // 힐(음수 데미지)을 받은 경우
      if (damage < 0) {
        if (!iAmAttacker) {
          // 내가 공격자가 아닐 때 (즉, 힐 받은 대상일 때)
          setPlayerHP(newHP);
          setMessage(`✨ ${attackerName}으로 ${-damage} HP를 회복했습니다!`);
        } else {
          // 상대방이 힐 받은 경우 (필요 시)
          // setEnemyHP(newHP);
        }
      } else {
        // 일반 공격
        if (iAmAttacker) {
          setEnemyHP(newHP);
        } else {
          setPlayerHP(newHP);
        }
        setMessage(`💥 ${attackerName}이(가) ${damage} 피해를 입혔습니다!`);
      }
      setShowMessage(true);
    };

    // ++++++++++++++++ [추가된 Event 리스너] ++++++++++++++++
    const onEventTriggered = (eventData: Event) => {
      console.log("🔥 이벤트 발동 수신:", eventData);
      setActiveEvents([eventData]); // 새 이벤트로 상태 설정
      setMessage(`🚨 ${eventData.message}`);
      setShowMessage(true);
    };

    const onEventHPUpdate = ({ eventId, newHP }: { eventId: number; newHP: number }) => {
      setActiveEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, hp: newHP } : e)));
    };

    const onEventEnded = ({ eventId }: { eventId: number }) => {
      // 서버에서 보상(힐)을 받고 directAttack으로 HP가 갱신되므로, 여기선 메시지만 띄움
      setActiveEvents((prev) => prev.filter((e) => e.id !== eventId));
      setMessage(`🎉 이벤트가 종료되었습니다! (보상 획득)`);
      setShowMessage(true);
    };
    // +++++++++++++++++++++++++++++++++++++++++++++++++++++

    socket.on("error", onError);
    socket.on("gameStart", onGameStart);
    socket.on("turnChanged", onTurnChanged);
    socket.on("updateGameState", onUpdateGameState);
    socket.on("cardSummoned", onCardSummoned);
    socket.on("updateCardHP", onUpdateCardHP);
    socket.on("cardDestroyed", onCardDestroyed);
    socket.on("directAttack", onDirectAttack);
    socket.on("gameOver", onGameOver);
    socket.on("timeUpdate", onTimeUpdate);
    socket.on("turnTimeout", onTurnTimeout);
    // ++++++++++++++++ [추가된 Event 리스너 등록] ++++++++++++++++
    socket.on("eventTriggered", onEventTriggered);
    socket.on("eventHPUpdate", onEventHPUpdate);
    socket.on("eventEnded", onEventEnded);
    // ++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    return () => {
      socket.off("error", onError);
      socket.off("gameStart", onGameStart);
      socket.off("turnChanged", onTurnChanged);
      socket.off("updateGameState", onUpdateGameState);
      socket.off("cardSummoned", onCardSummoned);
      socket.off("updateCardHP", onUpdateCardHP);
      socket.off("cardDestroyed", onCardDestroyed);
      socket.off("gameOver", onGameOver);
      socket.off("timeUpdate", onTimeUpdate);
      socket.off("turnTimeout", onTurnTimeout);
      // ++++++++++++++++ [추가된 Event 리스너 해제] ++++++++++++++++
      socket.off("eventTriggered", onEventTriggered);
      socket.off("eventHPUpdate", onEventHPUpdate);
      socket.off("eventEnded", onEventEnded);
      // +++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    };
  }, [roomCode]);

  // ✅ 초기 턴 동기화 로그
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

  // ✅ socket.id 생기면 pendingTurnPayload 처리
  useEffect(() => {
    if (socket.id && pendingTurnPayload.current) {
      console.log("⚡ pending turn 적용:", pendingTurnPayload.current);
      applyTurnChange(pendingTurnPayload.current);
      pendingTurnPayload.current = null;
    }
  }, [socket.id, applyTurnChange]);

  // 🔥 손패 펼침/접힘 토글 핸들러 추가
  const handleHandClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // 카드가 없으면 동작하지 않음
    if (handCards.length === 0) return;
    setShowHand(!showHand);
  };

  // 🔥 손패 펼침/접힘 토글 버튼 핸들러
  const handleToggleHand = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation(); // 래퍼 클릭 이벤트 전파 방지
    setShowHand(!showHand);
  };

  // ===== 카드 클릭 =====
  const handleCardClick = (cardId: string, fromZone: boolean, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!isMyTurn) {
      setMessage("상대방 턴입니다.");
      setShowMessage(true);
      return;
    }

    // 🧩 필드 위 내 카드를 클릭했을 때 → 공격자 선택
    if (fromZone) {
      if (selectedAttacker === cardId) {
        setSelectedAttacker(null); // 다시 클릭 시 해제
      } else {
        setSelectedAttacker(cardId); // 공격자 선택
        setMessage("🎯 공격할 상대 카드를 선택하세요!");
        setShowMessage(true);
      }
      return;
    }

    // 🃏 손패 카드 클릭 시 → 소환 로직
    const card = handCards.find((c) => c.id === cardId);
    if (!card) return;
    const normalizedCard = normalizeCard(card);
    const cardCost = Number(normalizedCard.cost) || 0;

    if (cardCost > playerCostIcons) {
      setMessage("코스트가 부족합니다!");
      setShowMessage(true);
      return;
    }

    if (myCardsInZone.length >= 5) {
      setMessage("카드 존이 가득 찼습니다! (최대 5장)");
      setShowMessage(true);
      return;
    }

    // ✅ 코스트 차감 + 손패에서 제거
    setHandCards((prev) => prev.filter((c) => c.id !== cardId));

    // 🔥 카드 소환 시 손패를 다시 접음
    setShowHand(false);

    console.log("🎯 소환 시 전송되는 카드:", normalizedCard);

    socket.emit("summonCard", {
      roomCode,
      card: normalizedCard,
    });
  };

  // === 카드 드래그 시 보이는 고스트 프리뷰 이펙트 핸들러 ===
  const handleDragStart = (attackerId: string, e: React.DragEvent<HTMLDivElement>) => {
    e.stopPropagation(); // 클릭 이벤트와 동시 발동 방지
    // 🧩 클릭형 프리뷰 강제 종료 (드래그 시작 시 중복 방지)
    setIsHoldingCard(false);
    setHeldCard(null);

    const attacker = myCardsInZone.find((c) => c.id === attackerId);
    if (!attacker) return;

    // ✅ 드래그로 카드 ID 전달
    e.dataTransfer.setData("attackerId", attackerId);
    e.dataTransfer.effectAllowed = "move";

    // 기본 브라우저 고스트 숨기기
    const img = new Image();
    img.src = getImageUrl(attacker.image);
    e.dataTransfer.setDragImage(img, -9999, -9999);

    // 커스텀 고스트 시작
    setDragPreview({
      x: e.clientX,
      y: e.clientY,
      image: getImageUrl(attacker.image),
    });
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    if (dragPreview && e.clientX && e.clientY) {
      setDragPreview((prev) => prev && { ...prev, x: e.clientX, y: e.clientY });
    }
  };

  const handleDragEnd = () => {
    setDragPreview(null);
    setDragOverTargetId(null);
  };

  // ====== 카드 클릭 시 고스트 효과 ======
  // ✅ 마우스 클릭 시작
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

  // ✅ 마우스 이동 중
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isHoldingCard) {
      setDragPreview((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : null));
    }
  };

  // ✅ 클릭 해제
  const handleMouseUp = () => {
    setIsHoldingCard(false);
    setHeldCard(null);
    setDragPreview(null);
  };

  // ===== 공격 로직 =====
  const handleAttack = (targetId?: string, attackerIdParam?: string) => {
    const attackerId = attackerIdParam || selectedAttacker;
    if (!attackerId) return;

    const attacker = myCardsInZone.find((c) => c.id === attackerId);
    if (!attacker) return;

    // ✅ 공격 가능 여부 검사
    if (attacker.canAttack === false) {
      setMessage(`${attacker.name}은(는) 이미 이번 턴에 공격했습니다!`);
      setShowMessage(true);
      return;
    }

    // ✅ 상대 필드에 카드가 없는 경우 → 직접 공격
    if (enemyCardsInZone.length === 0) {
      socket.emit("directAttack", { roomCode, attackerId: attacker.id });
      setMessage(`💥 ${attacker.name}이(가) 상대 플레이어를 직접 공격합니다!`);
      setShowMessage(true);

      setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));
      setSelectedAttacker(null);
      return;
    }

    // ✅ targetId가 있을 경우 → 카드 간 전투
    if (targetId) {
      const target = enemyCardsInZone.find((c) => c.id === targetId);
      if (!target) return;

      const attackPower = Number(attacker.attack ?? 0);
      const newHP = Math.max(0, target.hp - attackPower);

      setMessage(`🔥 ${attacker.name} ➤ ${target.name}에게 ${attackPower} 피해!`);
      setShowMessage(true);

      if (newHP <= 0) {
        setTimeout(() => {
          setEnemyCardsInZone((prev) => prev.filter((c) => c.id !== targetId));
          setMessage(`💥 ${target.name}이(가) 쓰러졌습니다!`);
          setShowMessage(true);
        }, 600);
      }

      socket.emit("attackCard", {
        roomCode,
        attackerId: attacker.id,
        targetId,
      });

      setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));

      setSelectedAttacker(null);
    }
  };

  // ===== 상대 카드 클릭(공격 대상 선택) =====
  const handleEnemyCardClick = (targetId: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();

    if (!isMyTurn) {
      setMessage("상대방 턴입니다.");
      setShowMessage(true);
      return;
    }

    if (!selectedAttacker) {
      setMessage("먼저 내 필드의 카드를 클릭해 공격자를 지정하세요!");
      setShowMessage(true);
      return;
    }

    handleAttack(targetId);
  };

  // ++++++++++++++++ [추가된 Event 공격 함수] ++++++++++++++++
  // (1번 파일의 공격 로직과 완벽히 호환됨)
  const handleEventAttack = (eventId: number) => {
    if (!isMyTurn) {
      setMessage("상대방 턴입니다.");
      setShowMessage(true);
      return;
    }
    // 1번 파일의 'selectedAttacker' 상태를 그대로 활용
    if (!selectedAttacker) {
      setMessage("먼저 공격할 내 카드를 선택하세요!");
      setShowMessage(true);
      return;
    }

    const attacker = myCardsInZone.find((c) => c.id === selectedAttacker);
    if (!attacker) return; // 로직 오류 방지

    if (!attacker.canAttack) {
      setMessage(`${attacker.name}은(는) 이미 공격했습니다!`);
      setShowMessage(true);
      return;
    }

    // ✅ 서버로 이벤트 공격 요청 (battle.ts에 추가한 핸들러 호출)
    socket.emit("attackEvent", {
      roomCode,
      attackerId: attacker.id,
      eventId,
    });

    // ✅ 공격권 즉시 소모 (UI 반응성)
    setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));
    setSelectedAttacker(null); // 공격자 선택 해제
    setMessage(`⚔️ ${attacker.name} (으)로 이벤트를 공격합니다!`);
    setShowMessage(true);
  };
  // +++++++++++++++++++++++++++++++++++++++++++++++++++++++

  // ===== 턴 종료 =====
  const handleEndTurn = () => {
    if (!isMyTurn) return;
    socket.emit("endTurn", { roomCode });
  };

  // ✅ socket이 없을 때 — return 직전에 배치
  if (!socket) {
    return <div style={{ color: "white", padding: 20 }}>서버 연결 중... 잠시만 기다려주세요.</div>;
  }
  // ===== 렌더 =====
  return (
    <div className="battle-container" onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
      {/* === 디버그 패널 === */}
      <div
        style={{
          position: "fixed",
          top: 8,
          left: 8,
          fontSize: 12,
          background: "#111",
          color: "#0f0",
          padding: 8,
          borderRadius: 6,
          opacity: 0.9,
          zIndex: 9999,
        }}
      >
        <div>connected: {String(socket.connected)}</div>
        <div>room: {roomCode}</div>
        <div>mySocketId: {mySocketId ?? "-"}</div>
        <div>turn: {turn}</div>
        <div>currentTurnId: {currentTurnId ?? "-"}</div>
        <div>isMyTurn: {String(isMyTurn)}</div>
        <div>turnTime: {turnTime}</div>
        <div>deckLoaded: {String(deckLoaded)}</div>
      </div>

      {showMessage && (
        <MessageBox bgColor="#e3f2fd" borderColor="#2196f3" textColor="#0d47a1" onClose={() => setShowMessage(false)}>
          {message}
        </MessageBox>
      )}

      {/* === 전장 === */}
      <div className="field-container">
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

        {/* === 적 손패 === */}
        <div className="enemy-hand-zone">
          {Array.from({ length: enemyHandCount }).map((_, i) => (
            <div key={i} className="enemy-hand-card" />
          ))}
        </div>

        {/* === 적 필드 === */}
        <div className="enemy-card-zone">
          {enemyCardsInZone.length > 0 ? (
            enemyCardsInZone.map((card) => (
              <div
                key={card.id}
                className={`enemy-card-slot enemy-clickable ${lastEnemyCardId === card.id ? "fade-in-card" : ""}`}
                onClick={(e) => {
                  if (!isMyTurn) return;
                  if (!selectedAttacker) {
                    setMessage("먼저 공격할 내 카드를 선택하세요!");
                    setShowMessage(true);
                    return;
                  }
                  handleEnemyCardClick(card.id, e);
                }}
                onDragOver={(e) => e.preventDefault()} // ✅ 드롭 가능 영역
                onDrop={(e) => {
                  e.preventDefault();
                  const attackerId = e.dataTransfer.getData("attackerId"); // ✅ 드래그 ID 가져오기
                  if (attackerId) handleAttack(card.id, attackerId); // ✅ 공격 실행
                }}
                role="button"
                tabIndex={0}
              >
                <div className="enemy-card in-zone" onMouseDown={(e) => handleCardMouseDown(card, e)}>
                  <img src={getImageUrl(card.image)} alt={card.name} />
                  <div className="enemy-hp-bar">
                    <div className="enemy-hp-inner" style={{ width: `${(card.hp / card.maxhp) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-zone">상대 필드가 비어있습니다</div>
          )}
        </div>

        {/* ▼ 중앙 타이머 라인 */}
        <BurnLineComponent timeLeft={turnTime} isMyTurn={isMyTurn} />

        {/* ▼ 내 카드 존 */}
        <div className="player-card-zone">
          {myCardsInZone.length > 0 ? (
            myCardsInZone.map((card) => (
              <div key={card.id} className={`card-slot ${lastPlayedCardId === card.id ? "fade-in-card" : ""}`}>
                <div
                  className={`my-card in-zone ${card.canAttack ? "can-attack" : "cannot-attack"}`}
                  draggable={isMyTurn}
                  onMouseDown={(e) => card.canAttack && handleCardMouseDown(card, e)} // 클릭형 고스트
                  onDragStart={(e) => card.canAttack && handleDragStart(card.id, e)} // 드래그 시작 (위에서 수정한 함수)
                  onDrag={(e) => card.canAttack && handleDrag(e)} // 드래그 중 커서 이동
                  onDragEnd={handleDragEnd} // 드래그 끝
                  onClick={(e) => {
                    if (!card.canAttack) {
                      setMessage(`${card.name}은(는) 이미 이번 턴에 공격했습니다!`);
                      setShowMessage(true);
                      return;
                    }
                    handleCardClick(card.id, true, e);
                  }} // 기존 공격 선택 유지
                >
                  <img src={getImageUrl(card.image)} alt={card.name} />
                </div>
              </div>
            ))
          ) : (
            <div className="empty-zone">카드를 여기에 배치하세요</div>
          )}
        </div>

        {/* ▼ 턴, 타이머 */}
        <div className="time-zone">
          <div className="turn-indicator">턴: {turn}</div>
          <CircularTimer turnTime={turnTime} />
        </div>

        {/* ▼ 덱 & 손패 */}
        <div className="deck-area">
          <button
            className="deck-card"
            onClick={drawCard} // ✅ 함수 직접 호출
            disabled={!isMyTurn || hasDrawnThisTurn}
            title={!isMyTurn ? "상대 턴입니다!" : hasDrawnThisTurn ? "이번 턴에는 이미 드로우했습니다!" : "드로우 (D 키)"}
          >
            <div className="deck-count">{deckCards.length}</div>
          </button>

          {/* 🔥 수정된 손패 영역: showHand 상태에 따라 클래스 변경 */}
          <div className={`hand-cards-wrapper ${showHand ? "expanded" : "collapsed"}`} onClick={handleHandClick}>
            {/* 🔥 펼침/접힘 버튼 (카드가 2장 이상일 때만 표시) */}
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
                style={{ zIndex: handCards.length - index }} // 겹침 순서
              >
                <div
                  className="my-card hand-card"
                  onClick={(e) => {
                    // 펼쳐진 상태에서만 소환 클릭 작동
                    if (showHand) {
                      e.stopPropagation(); // 래퍼 클릭 방지
                      handleCardClick(card.id, false, e);
                    }
                  }}
                >
                  <img src={getImageUrl(card.image)} alt={card.name} />
                </div>
              </div>
            ))}
            {/* 🔥 접힌 상태일 때만 보이는 텍스트 */}
            {!showHand && handCards.length > 0 && <div className="hand-count-overlay">{handCards.length} 장</div>}
            {/* 🔥 카드가 없을 때만 보이는 텍스트 */}
            {handCards.length === 0 && <div className="hand-count-overlay no-cards">손패 없음</div>}
          </div>
          {/* 이전의 hand-cards는 삭제하거나 아래처럼 수정됨 */}
        </div>
        <div className="enemy-grave" />
        {/* ▼ 코스트 영역 */}
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
        <div className="player-grave" />
      </div>

      {/* === 오른쪽 사이드 영역 === */}
      <div className="right-container">
        <div className="enemy-info">
          <div className="enemy-avatar" />
          <div className="hp-bar">
            <div className="hp-bar-inner" style={{ width: `${(enemyHP / 2000) * 100}%` }} />
            <div className="hp-text">{enemyHP}/2000</div>
          </div>
        </div>

        {/* ==================== 🔥 event-zone 수정 ==================== */}
        <div className="event-zone">
          {/* 2번 파일에서 가져온 렌더링 로직 */}
          <div className="event-items-container">
            {activeEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                // ✅ 클릭 시 1번 파일의 공격 로직과 연동
                onClick={() => handleEventAttack(event.id)}
              />
            ))}
          </div>

          {/* 1번 파일의 기존 턴 종료 버튼 */}
          <button className="endturn-button" onClick={handleEndTurn}>
            턴 종료 <CiClock1 size={24} />
          </button>
        </div>
        {/* ============================================================== */}

        <div className="player-info">
          <div className="player-avatar" />
          <div className="hp-bar">
            <div className="hp-bar-inner" style={{ width: `${(playerHP / 2000) * 100}%` }} />
            <div className="hp-text">{playerHP}/2000</div>
          </div>
          <div className="surrender-button" onClick={() => setShowGameOver(true)}>
            항복 <CiFlag1 />
          </div>
        </div>
      </div>

      {showGameOver && (
        <GameOverScreen message={gameOverMessage} onRestart={() => window.location.reload()} onGoToMainMenu={() => navigate("/")} />
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
