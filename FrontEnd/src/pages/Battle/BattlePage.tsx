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

// ✅ 카드 표준화 함수
const normalizeCard = (card: any) => {
  // ✅ 1️⃣ 이미지 경로 우선순위: image → image2D → cardType + tier 조합
  const imagePath = card.image ? card.image : card.image2D ? card.image2D : `${card.cardType ?? "fire"}Tier${card.tier ?? 1}.png`;

  // ✅ 2️⃣ 절대 경로 처리
  const fullImageUrl = imagePath.startsWith("http") ? imagePath : `${IMAGE_URL}/${imagePath}`;

  return {
    id: card.id || card._id || card.cardId || `card-${Math.random().toString(36).substring(2, 9)}`,
    name: card.name || card.cardName || "Unknown",
    cardType: card.cardType || "fire",
    tier: Number(card.tier ?? 1),
    attack: Number(card.attack ?? card.damage ?? 0), // ✅ 숫자 강제 변환
    hp: Number(card.hp ?? 0), // ✅ 숫자 강제 변환
    maxhp: Number(card.maxhp ?? card.hp ?? 0), // ✅ 숫자 강제 변환
    cost: Number(card.cost ?? card.tier ?? 1), // ✅ 숫자 강제 변환
    image: fullImageUrl, // ✅ BattlePage에서 항상 정상 URL로 표시됨
  };
};

// ✅ 카드 형태 통일 함수 (서버·클라이언트 혼합 대응)
const keepCardShape = (c: any): Card => {
  // 1️⃣ populate로 받은 카드면 c.card가 실제 데이터, 아니면 c 자체
  const baseCard = c.card && typeof c.card === "object" && !Array.isArray(c.card) ? c.card : c;

  // 2️⃣ 이미지 파일 추출
  const rawImage =
    baseCard.image2D ||
    baseCard.image ||
    c.image2D ||
    c.image ||
    `${baseCard.cardType ?? c.cardType ?? "normal"}Tier${baseCard.tier ?? c.tier ?? 1}.png`;

  const imageFile = rawImage.includes("http")
    ? rawImage
    : `https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/images/${rawImage.split("/").pop()}`;

  // 3️⃣ 숫자형 데이터 보정
  const attack = Number(baseCard.attack ?? c.attack ?? 0);
  const hp = Number(baseCard.hp ?? c.hp ?? 0);
  const maxhp = Number(baseCard.maxhp ?? baseCard.hp ?? c.maxhp ?? c.hp ?? 0);
  const cost = Number(baseCard.cost ?? c.cost ?? baseCard.tier ?? c.tier ?? 1);
  const tier = Number(baseCard.tier ?? c.tier ?? 1);

  // 4️⃣ 최종 반환 (id, 이름, 타입 포함)
  return {
    id: String(baseCard._id ?? baseCard.id ?? c.id ?? crypto.randomUUID()),
    name: String(baseCard.name ?? baseCard.cardName ?? c.cardName ?? c.name ?? "Unknown"),
    cardType: baseCard.cardType ?? c.cardType ?? "normal",
    attack,
    hp,
    maxhp,
    cost,
    tier,
    image: imageFile,
  };
};

// ===================== BattlePage =====================
function BattlePage({ selectedDeck }: { selectedDeck: Card[] }) {
  const socket = useSocket();
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 상대 손에 들고 있는 패의 개수
  const [enemyHandCount, setEnemyHandCount] = useState<number>(8);

  // ✅ 한 턴에 1번만 드로우 가능
  const [hasDrawnThisTurn, setHasDrawnThisTurn] = useState(false);

  // 🧩 드래그 중 카드 프리뷰 상태
  const [dragPreview, setDragPreview] = useState<{ x: number; y: number; image: string } | null>(null);
  const [dragOverTargetId, setDragOverTargetId] = useState<string | null>(null);

  // 🧩 클릭 기반 고스트 프리뷰 상태 관리
  const [isHoldingCard, setIsHoldingCard] = useState(false);
  const [heldCard, setHeldCard] = useState<Card | null>(null);

  // ✅ 덱 초기화
  const initializeDeckAndHand = useCallback(() => {
    if (!selectedDeck || selectedDeck.length === 0) return;
    const normalized = selectedDeck.map(keepCardShape);
    const shuffled = [...normalized].sort(() => Math.random() - 0.5);
    setHandCards(shuffled.slice(0, 3));
    setDeckCards(shuffled.slice(3));
  }, [selectedDeck]);

  useEffect(() => {
    initializeDeckAndHand();
  }, [initializeDeckAndHand]);

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
    }
  }, [selectedDeck]);

  // ===== 소켓 연결 =====
  useEffect(() => {
    if (socket.connected && socket.id) {
      setMySocketId(socket.id);

      // ✅ 방 참여 이벤트 추가
      socket.emit("joinRoom", { roomCode });
      // ✅ 초기 상태 요청
      socket.emit("getGameState", { roomCode });

      console.log("🎮 BattlePage 연결됨:", socket.id);
    }
  }, [socket, roomCode]);

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
    if (!socket.connected) return;

    const onError = (msg: string) => {
      setMessage(`🚫 오류: ${msg}`);
      setShowMessage(true);
    };

    const onGameStart = ({ currentTurn, hp }: any) => {
      const myId = socket.id ?? null;
      setCurrentTurnId(currentTurn);
      setIsMyTurn(currentTurn === myId);
      if (myId) {
        setPlayerHP(hp[myId] ?? 2000);
        const opponent = Object.keys(hp).find((id) => id !== myId);
        if (opponent) setEnemyHP(hp[opponent] ?? 2000);
      }
      setTurn(1);
      setTurnTime(INITIAL_TIME);
      setPlayerCostIcons(1);
      setOpponentCostIcons(1);
      setMessage("🎮 게임이 시작되었습니다!");
      setShowMessage(true);
    };

    // ✅ 호환형 턴 변경 핸들러
    const onTurnChanged = (payload: any) => {
      const myId = socket.id ?? null;
      if (!myId) return;

      if (typeof payload === "string") {
        const nextTurnId = payload;
        const mine = nextTurnId === myId;
        setCurrentTurnId(nextTurnId);
        setIsMyTurn(mine);
        setTurn((t) => t + 1);
        setTurnTime(INITIAL_TIME);
        setHasDrawnThisTurn(false); // ✅ 턴 교체 시 드로우 초기화
        setPlayerCostIcons((p) => Math.min(p + (mine ? 1 : 0), 8));
        setOpponentCostIcons((p) => Math.min(p + (!mine ? 1 : 0), 8));
        setMessage(mine ? "🟢 내 턴입니다!" : "🔴 상대 턴입니다.");
        setShowMessage(true);
        return;
      }

      const { currentTurn, cost, hp } = payload;
      const mine = currentTurn === myId;
      setCurrentTurnId(currentTurn);
      setIsMyTurn(mine);
      setTurn((t) => t + 1);
      setTurnTime(INITIAL_TIME);

      if (cost && typeof cost === "object") {
        setPlayerCostIcons(Math.max(0, Number(cost[myId]) || 0));
        const oppId = Object.keys(cost).find((id) => id !== myId);
        if (oppId) setOpponentCostIcons(Math.max(0, Number(cost[oppId]) || 0));
      }

      if (hp && typeof hp === "object") {
        setPlayerHP(hp[myId] ?? 2000);
        const oppId = Object.keys(hp).find((id) => id !== myId);
        if (oppId) setEnemyHP(hp[oppId] ?? 2000);
      }

      setMessage(mine ? "🟢 내 턴입니다!" : "🔴 상대 턴입니다.");
      setShowMessage(true);
    };

    const onUpdateGameState = ({ currentTurn, hp }: any) => {
      const myId = socket.id ?? null;
      setCurrentTurnId(currentTurn);
      setIsMyTurn(currentTurn === myId);
      if (myId) {
        setPlayerHP(hp[myId] ?? 2000);
        const opponent = Object.keys(hp).find((id) => id !== myId);
        if (opponent) setEnemyHP(hp[opponent] ?? 2000);
      }
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

      if (playerId === socket.id) {
        // ✅ 내 카드 → 내 필드에 추가
        setMyCardsInZone((prev) => {
          if (prev.find((c) => c.id === fixedCard.id)) return prev;
          return [...prev, fixedCard];
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

    const onGameOver = ({ winnerId }: any) => {
      const myId = socket.id ?? null;
      setShowGameOver(true);
      setGameOverMessage(myId === winnerId ? "🎉 승리했습니다!" : "💀 패배했습니다...");
    };

    // ✅ 서버에서 타이머 공유값 수신
    const onTimeUpdate = (time: number) => {
      setTurnTime(time);
      // console.log("🕒 타이머 동기화:", time);
    };

    const onTurnTimeout = () => {
      console.log("⏰ 턴 제한시간 만료");
      setIsMyTurn(false);
    };

    socket.on("error", onError);
    socket.on("gameStart", onGameStart);
    socket.on("turnChanged", onTurnChanged);
    socket.on("updateGameState", onUpdateGameState);
    socket.on("cardSummoned", onCardSummoned);
    socket.on("gameOver", onGameOver);
    socket.on("timeUpdate", onTimeUpdate);
    socket.on("turnTimeout", onTurnTimeout);

    return () => {
      socket.off("error", onError);
      socket.off("gameStart", onGameStart);
      socket.off("turnChanged", onTurnChanged);
      socket.off("updateGameState", onUpdateGameState);
      socket.off("cardSummoned", onCardSummoned);
      socket.off("gameOver", onGameOver);
      socket.off("timeUpdate", onTimeUpdate);
      socket.off("turnTimeout", onTurnTimeout);
    };
  }, [isMyTurn, socket, roomCode]);
  
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
    setPlayerCostIcons((prevCost) => Math.max(0, prevCost - cardCost));
    
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
  const handleAttack = (targetId: string, attackerIdParam?: string) => {
    const attackerId = attackerIdParam || selectedAttacker;
    if (!attackerId) return;

    const attacker = myCardsInZone.find((c) => c.id === attackerId);
    const target = enemyCardsInZone.find((c) => c.id === targetId);
    if (!attacker || !target) return;

    const attackPower = Number(attacker.attack ?? 0);
    const newHP = Math.max(0, target.hp - attackPower);
    const updatedEnemy = enemyCardsInZone.map((c) => (c.id === targetId ? { ...c, hp: newHP } : c));
    setEnemyCardsInZone(updatedEnemy);

    setMessage(`🔥 ${attacker.name} ➤ ${target.name}에게 ${attackPower} 피해!`);
    setShowMessage(true);

    if (newHP <= 0) {
      setTimeout(() => {
        setEnemyCardsInZone((prev) => prev.filter((c) => c.id !== targetId));
        setMessage(`💥 ${target.name}이(가) 쓰러졌습니다!`);
        setShowMessage(true);
      }, 600);
    }

    socket.emit("attackCard", { roomCode, attackerId: attacker.id, targetId });

    // ✅ 한 턴에 한 번만 공격하도록 canAttack 비활성화
    setMyCardsInZone((prev) => prev.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)));

    setSelectedAttacker(null);
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

  // ===== 턴 종료 =====
  const handleEndTurn = () => {
    if (!isMyTurn) return;
    socket.emit("endTurn", { roomCode });
    setTurnTime(0);
  };

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
        <div>socket.id: {socket.id ?? "-"}</div>
        <div>mySocketId: {mySocketId ?? "-"}</div>
      </div>

      {showMessage && (
        <MessageBox bgColor="#e3f2fd" borderColor="#2196f3" textColor="#0d47a1" onClose={() => setShowMessage(false)}>
          {message}
        </MessageBox>
      )}

      {/* === 전장 === */}
      <div className="field-container">
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
                onClick={(e) => handleEnemyCardClick(card.id, e)}
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
                  className="my-card in-zone"
                  draggable={isMyTurn}
                  onMouseDown={(e) => handleCardMouseDown(card, e)} // 클릭형 고스트
                  onDragStart={(e) => handleDragStart(card.id, e)} // 드래그 시작 (위에서 수정한 함수)
                  onDrag={(e) => handleDrag(e)} // 드래그 중 커서 이동
                  onDragEnd={handleDragEnd} // 드래그 끝
                  onClick={(e) => handleCardClick(card.id, true, e)} // 기존 공격 선택 유지
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
          <div 
            className={`hand-cards-wrapper ${showHand ? 'expanded' : 'collapsed'}`}
            onClick={handleHandClick}
          >
            {/* 🔥 펼침/접힘 버튼 (카드가 2장 이상일 때만 표시) */}
            {handCards.length >= 2 && showHand && (
              <button 
                className="toggle-hand-button collapse-button" 
                onClick={handleToggleHand}
              >
                접기
              </button>
            )}
             {handCards.length >= 2 && !showHand && (
              <button 
                className="toggle-hand-button expand-button" 
                onClick={handleToggleHand}
              >
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
            {!showHand && handCards.length > 0 && (
              <div className="hand-count-overlay">{handCards.length} 장</div>
            )}
            {/* 🔥 카드가 없을 때만 보이는 텍스트 */}
            {handCards.length === 0 && (
              <div className="hand-count-overlay no-cards">손패 없음</div>
            )}
          </div>
          {/* 이전의 hand-cards는 삭제하거나 아래처럼 수정됨 */}
        </div>
        <div className="enemy-grave"/>
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
        <div className="player-grave"/>
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

        <div className="event-zone">
          <button className="endturn-button" onClick={handleEndTurn}>
            턴 종료 <CiClock1 size={24} />
          </button>
        </div>

        <div className="player-info">
          <div className="player-avatar" />
          <div className="hp-bar">
            <div className="hp-bar-inner" style={{ width: `${(playerHP / 2000) * 100}%` }} />
            <div className="hp-text">{playerHP}/2000</div>
          </div>
          <div className="surrender-button" onClick={() => setShowGameOver(true)}>항복 <CiFlag1 /></div>
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