"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSocket } from "../../context/SocketContext";
import { CiClock1 } from "react-icons/ci";

import "./BattlePage.css";
import MessageBox from "../../components/common/MessageBox";
import GameOverScreen from "../../components/battle/GameOverScreen";
import { Card } from "../../types/Card";

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
const normalizeCard = (c: any): Card => {
  const rawType = c.cardType ?? c.type ?? detectTypeByName(c.name ?? c.cardName ?? "") ?? "normal";

  const type = String(rawType).trim();
  const tier = Number(c.tier ?? 1);
  const isLegend = type === "legend" || tier >= 8;
  const displayType = isLegend ? "legend" : type;
  const displayTier = isLegend ? Math.min(tier - 7, 7) || 1 : Math.min(tier, 7);

  const given = (typeof c.image2D === "string" && c.image2D) || (typeof c.image === "string" && c.image) || "";

  const imageFile = pickFileName(given) || `${displayType}Tier${displayTier}.png`;

  return {
    id: String(c.id ?? c._id ?? crypto.randomUUID()),
    name: String(c.name ?? c.cardName ?? "Unknown"),
    cost: Number(c.cost ?? 0),
    attack: Number(c.attack ?? c.damage ?? 0),
    hp: Number(c.hp ?? 0),
    maxhp: Number(c.maxhp ?? c.hp ?? 0),
    tier: displayTier,
    image: imageFile,
  };
};

// ✅ 서버 덱 유지용 보정 함수
const keepCardShape = (c: any): Card => {
  const given = (typeof c.image2D === "string" && c.image2D) || (typeof c.image === "string" && c.image) || "";

  const imageFile =
    pickFileName(given) ||
    (c.cardType
      ? `${c.cardType === "legend" ? "legend" : c.cardType}Tier${Math.min(c.tier >= 8 ? c.tier - 7 : c.tier, 7) || 1}.png`
      : "default.png");

  return {
    id: String(c.id ?? c._id ?? crypto.randomUUID()),
    name: String(c.name ?? c.cardName ?? "Unknown"),
    cost: Number(c.cost ?? 0),
    attack: Number(c.attack ?? c.damage ?? 0),
    hp: Number(c.hp ?? 0),
    maxhp: Number(c.maxhp ?? c.hp ?? 0),
    tier: Number(c.tier ?? 1),
    image: imageFile,
  };
};

// ===================== CircularTimer =====================
const CircularTimer = ({ turnTime }: { turnTime: number }) => {
  const getTimerColor = (timeLeft: number) => {
    const ratio = timeLeft / INITIAL_TIME;
    if (ratio > 0.75) return "#00FF00";
    if (ratio > 0.5) return "#FFFF00";
    if (ratio > 0.25) return "#FF8800";
    return "#FF0000";
  };

  const color = getTimerColor(turnTime);
  const progress = ((INITIAL_TIME - turnTime) / INITIAL_TIME) * 100;

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
      <div
        style={{
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: `conic-gradient(${color} ${progress * 3.6}deg, #eee 0deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 5px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color, fontSize: "16px", fontWeight: "bold" }}>{turnTime}초</div>
        </div>
      </div>
    </div>
  );
};

// ===================== BurnLineComponent =====================
const BurnLineComponent = ({ timeLeft, isMyTurn }: { timeLeft: number; isMyTurn: boolean }) => {
  if (!isMyTurn) return <div className="horizontal-line" style={{ background: "#ffffff" }} />;

  const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;
  const color = progress < 25 ? "#00FF00" : progress < 50 ? "#FFFF00" : progress < 75 ? "#FF8800" : "#FF0000";

  return (
    <div
      className="horizontal-line"
      style={{
        background: `linear-gradient(to right, ${color} ${progress}%, #ffffff ${progress}%)`,
      }}
    />
  );
};

// ===================== BattlePage =====================
function BattlePage({ selectedDeck }: { selectedDeck: Card[] }) {
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation() as any;
  const roomCode: string = location?.state?.roomCode || "defaultRoomCode";

  // === 상태 ===
  const [mySocketId, setMySocketId] = useState<string | null>(null);
  const [currentTurnId, setCurrentTurnId] = useState<string | null>(null);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [turn, setTurn] = useState(1);

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

  // ===== 소켓 연결 =====
  useEffect(() => {
    if (connected && socket.id) {
      setMySocketId(socket.id);
      socket.emit("getGameState", { roomCode });
      console.log("🎮 BattlePage 연결됨:", socket.id);
    }
  }, [connected, socket, roomCode]);

  // ===== 서버 이벤트 처리 =====
  useEffect(() => {
    if (!connected) return;

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

    // ✅ 카드 소환 이벤트
    const onCardSummoned = ({ playerId, card, updatedCost, cost }: any) => {
      console.log(`🃏 카드 소환 수신 from ${playerId} | 카드: ${card.name} | cost:`, cost);

      const fixedCard = normalizeCard(card);

      if (playerId === socket.id) {
        // ✅ 내 카드 필드에 추가
        setMyCardsInZone((prev) => {
          if (prev.find((c) => c.id === fixedCard.id)) return prev;
          return [...prev, fixedCard];
        });
        setLastPlayedCardId(fixedCard.id);
        setTimeout(() => setLastPlayedCardId(null), 1000);

        // ✅ 내 cost 즉시 반영
        if (typeof updatedCost === "number") {
          setPlayerCostIcons(Math.max(0, updatedCost));
        }
      } else {
        // ✅ 상대 카드 필드에 추가
        setEnemyCardsInZone((prev) => {
          if (prev.find((c) => c.id === fixedCard.id)) return prev;
          return [...prev, fixedCard];
        });
        setLastEnemyCardId(fixedCard.id);
        setTimeout(() => setLastEnemyCardId(null), 1000);

        setMessage(`상대가 ${fixedCard.name}을(를) 소환했습니다!`);
        setShowMessage(true);
      }

      // ✅ cost 객체 전체 동기화 (상대방 cost 포함)
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

    socket.on("error", onError);
    socket.on("gameStart", onGameStart);
    socket.on("turnChanged", onTurnChanged);
    socket.on("updateGameState", onUpdateGameState);
    socket.on("cardSummoned", onCardSummoned);
    socket.on("gameOver", onGameOver);

    return () => {
      socket.off("error", onError);
      socket.off("gameStart", onGameStart);
      socket.off("turnChanged", onTurnChanged);
      socket.off("updateGameState", onUpdateGameState);
      socket.off("cardSummoned", onCardSummoned);
      socket.off("gameOver", onGameOver);
    };
  }, [socket, connected, roomCode]);

  // ===== 턴 타이머 =====
  useEffect(() => {
    if (!isMyTurn) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTurnTime((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          socket.emit("endTurn", { roomCode });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isMyTurn, socket, roomCode]);

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

    console.log("🎯 소환 시 전송되는 카드:", normalizedCard);

    socket.emit("summonCard", {
      roomCode,
      card: normalizedCard,
    });
  };

  // ===== 공격 로직 =====
  const handleAttack = (targetId: string) => {
    if (!selectedAttacker) return;
    const attacker = myCardsInZone.find((c) => c.id === selectedAttacker);
    const target = enemyCardsInZone.find((c) => c.id === targetId);
    if (!attacker || !target) return;

    const newHP = Math.max(0, target.hp - attacker.attack);
    const updatedEnemy = enemyCardsInZone.map((c) => (c.id === targetId ? { ...c, hp: newHP } : c));
    setEnemyCardsInZone(updatedEnemy);

    setMessage(`🔥 ${attacker.name} ➤ ${target.name}에게 ${attacker.attack} 피해!`);
    setShowMessage(true);

    if (newHP <= 0) {
      setTimeout(() => {
        setEnemyCardsInZone((prev) => prev.filter((c) => c.id !== targetId));
        setMessage(`💥 ${target.name}이(가) 쓰러졌습니다!`);
        setShowMessage(true);
      }, 600);
    }

    socket.emit("attackCard", { roomCode, attackerId: attacker.id, targetId });
    setSelectedAttacker(null);
  };

  // ===== 턴 종료 =====
  const handleEndTurn = () => {
    if (!isMyTurn) return;
    socket.emit("endTurn", { roomCode });
    setTurnTime(0);
  };

  // ===== 렌더 =====
  return (
    <div className="battle-container">
      {/* === 디버그 패널 === */}
      <div
        style={{
          position: "fixed",
          top: 8,
          right: 8,
          fontSize: 12,
          background: "#111",
          color: "#0f0",
          padding: 8,
          borderRadius: 6,
          opacity: 0.9,
          zIndex: 9999,
        }}
      >
        <div>connected: {String(connected)}</div>
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

        {/* ▼ 적 카드 존 */}
        <div className="enemy-card-zone">
          {enemyCardsInZone.length > 0
            ? enemyCardsInZone.map((card) => (
                <div
                  key={card.id}
                  className={`enemy-card-slot ${lastEnemyCardId === card.id ? "fade-in-card" : ""}`}
                  onClick={() => {
                    if (selectedAttacker) handleAttack(card.id);
                  }}
                >
                  <img src={getImageUrl(card.image)} alt={card.name} />
                  {/* HP 바 시각화 */}
                  <div className="enemy-hp-bar">
                    <div className="enemy-hp-inner" style={{ width: `${(card.hp / card.maxhp) * 100}%` }} />
                  </div>
                </div>
              ))
            : [...Array(5)].map((_, i) => (
                <div key={i} className="enemy-card-slot">
                  <div className="enemy-card">
                    <div className="card-back" />
                  </div>
                </div>
              ))}
        </div>

        {/* ▼ 중앙 타이머 라인 */}
        <BurnLineComponent timeLeft={turnTime} isMyTurn={isMyTurn} />

        {/* ▼ 내 카드 존 */}
        <div className="player-card-zone">
          {myCardsInZone.length > 0 ? (
            myCardsInZone.map((card) => (
              <div key={card.id} className={`card-slot ${lastPlayedCardId === card.id ? "fade-in-card" : ""}`}>
                <div className="my-card in-zone" onClick={(e) => handleCardClick(card.id, true, e)}>
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
            onClick={() => {
              if (deckCards.length > 0) {
                const c = deckCards[0];
                setHandCards((h) => [...h, c]);
                setDeckCards((d) => d.slice(1));
              }
            }}
          >
            <div className="deck-count">{deckCards.length}</div>
          </button>

          <div className="hand-cards">
            {handCards.map((card) => (
              <div key={card.id} className="card-slot">
                <div className="my-card" onClick={(e) => handleCardClick(card.id, false, e)}>
                  <img src={getImageUrl(card.image)} alt={card.name} />
                </div>
              </div>
            ))}
          </div>
        </div>

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
        </div>
      </div>

      {showGameOver && (
        <GameOverScreen message={gameOverMessage} onRestart={() => window.location.reload()} onGoToMainMenu={() => navigate("/")} />
      )}
    </div>
  );
}

export default BattlePage;
