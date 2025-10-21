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

// ✅ 이미지 URL 정리 함수
const getImageUrl = (imagePath: string) => {
  if (!imagePath) return `${IMAGE_URL}/default.png`;
  return imagePath.startsWith("http") ? imagePath : `${IMAGE_URL}/${imagePath}`;
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

  const [playerCostIcons, setPlayerCostIcons] = useState(1);
  const [opponentCostIcons, setOpponentCostIcons] = useState(1);

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [showGameOver, setShowGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState("");

  const [lastPlayedCardId, setLastPlayedCardId] = useState<string | null>(null);
  const [lastEnemyCardId, setLastEnemyCardId] = useState<string | null>(null);

  const [turnTime, setTurnTime] = useState(INITIAL_TIME);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ 덱 초기화 (보유 덱 로드)
  const initializeDeckAndHand = useCallback(() => {
    if (!selectedDeck || selectedDeck.length === 0) return;
    const shuffled = [...selectedDeck].sort(() => Math.random() - 0.5);
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
      setMessage("🎮 게임이 시작되었습니다!");
      setShowMessage(true);
    };

    const onTurnChanged = (nextTurnId: string) => {
      const myId = socket.id ?? null;
      const mine = nextTurnId === myId;
      setCurrentTurnId(nextTurnId);
      setIsMyTurn(mine);
      setTurn((t) => t + 1);
      setTurnTime(INITIAL_TIME);
      setPlayerCostIcons((p) => Math.min(p + (mine ? 1 : 0), 8));
      setOpponentCostIcons((p) => Math.min(p + (!mine ? 1 : 0), 8));
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

    const onCardPlayed = ({ playerId, card }: any) => {
      if (playerId === socket.id) return;
      setEnemyCardsInZone((prev) => [...prev, card]);
      setLastEnemyCardId(card.id);
      setTimeout(() => setLastEnemyCardId(null), 1000);
      setMessage(`상대가 ${card.name}을(를) 소환했습니다!`);
      setShowMessage(true);
    };

    const onGameOver = ({ winnerId }: any) => {
      const myId = socket.id ?? null;
      setShowGameOver(true);
      setGameOverMessage(myId === winnerId ? "🎉 승리했습니다!" : "💀 패배했습니다...");
    };

    socket.on("error", onError);
    socket.on("gameStart", onGameStart);
    socket.on("turnChanged", onTurnChanged); // ✅ turnChanged 먼저 등록
    socket.on("updateGameState", onUpdateGameState);
    socket.on("cardPlayed", onCardPlayed);
    socket.on("gameOver", onGameOver);

    return () => {
      socket.off("error", onError);
      socket.off("gameStart", onGameStart);
      socket.off("turnChanged", onTurnChanged);
      socket.off("updateGameState", onUpdateGameState);
      socket.off("cardPlayed", onCardPlayed);
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

    if (!fromZone) {
      const card = handCards.find((c) => c.id === cardId);
      if (!card) return;
      if (card.cost > playerCostIcons) {
        setMessage("코스트가 부족합니다!");
        setShowMessage(true);
        return;
      }
      if (myCardsInZone.length >= 5) {
        setMessage("카드 존이 가득 찼습니다! (최대 5장)");
        setShowMessage(true);
        return;
      }

      setHandCards((prev) => prev.filter((c) => c.id !== cardId));
      setMyCardsInZone((prev) => [...prev, card]);
      setPlayerCostIcons((p) => p - card.cost);
      setLastPlayedCardId(card.id);
      setTimeout(() => setLastPlayedCardId(null), 1000);
      socket.emit("playCard", { roomCode, card });
    }
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

      <div className="field-container">
        {/* ▼ 상단 배경 레이어 (보이기 전용, 클릭 가로채기 방지) */}
        <div className="enemy-card-bg" style={{ pointerEvents: "none" }} />
        <div className="enemy-field" style={{ pointerEvents: "none" }} />

        {/* ▼ 상대 카드존 */}
        <div className="enemy-card-zone">
          {enemyCardsInZone.length > 0
            ? enemyCardsInZone.map((card) => (
                <div key={card.id} className={`enemy-card-slot ${lastEnemyCardId === card.id ? "fade-in-card" : ""}`}>
                  <img src={getImageUrl(card.image)} alt={card.name} />
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

        {/* ▼ 중앙 구분선 */}
        <BurnLineComponent timeLeft={turnTime} isMyTurn={isMyTurn} />

        {/* ▼ 하단 배경 레이어 (보이기 전용, 클릭 가로채기 방지) */}
        <div className="player-field" style={{ pointerEvents: "none" }} />
        <div className="player-card-bg" style={{ pointerEvents: "none" }} />

        {/* ▼ 내 카드존 */}
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

        {/* ▼ 턴/덱/코스트 UI */}
        <div className="time-zone">
          <div className="turn-indicator">턴: {turn}</div>
          <CircularTimer turnTime={turnTime} />
        </div>

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

        <div className="enemy-cost-zone">
          {[...Array(opponentCostIcons)].map((_, i) => (
            <div key={i} className="cost-icon" />
          ))}
        </div>
        <div className="player-cost-zone">
          {[...Array(playerCostIcons)].map((_, i) => (
            <div key={i} className="cost-icon" />
          ))}
        </div>
      </div>

      {/* === 오른쪽 영역 === */}
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
        <GameOverScreen
          message={gameOverMessage}
          onRestart={() => window.location.reload()}
          onGoToMainMenu={() => navigate("/")}
        />
      )}
    </div>
  );
}

export default BattlePage;
