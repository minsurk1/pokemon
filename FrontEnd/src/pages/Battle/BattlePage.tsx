"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDrag, useDrop } from "react-dnd";
import { socket } from "../../utils/socket";
import { CiClock1 } from "react-icons/ci";

import "./BattlePage.css";

import MessageBox from "../../components/common/MessageBox";
import CardMenu from "../../components/cards/CardMenu";
import { cardsData } from "../Inventory/Inventory";
import costImage from "../../assets/images/cost.png";
import healImage from "../../assets/images/heal.png";
import bombImage from "../../assets/images/bomb.png";
import EventItem from "./components/Eventitem";
import GameOverScreen from "./components/GameOverScreen";

// 카드 인터페이스 정의
interface Card {
  id: string;
  image: string;
  name: string;
  attack: number;
  hp: number;
  maxhp: number;
  cost: number;
}

// 이벤트 인터페이스 정의
interface Event {
  id: number;
  type: number;
  image: string;
  message: string;
  hp: number;
  maxHp: number;
  effect: () => void;
}

// 메뉴 위치 인터페이스 정의
interface Position {
  x: number;
  y: number;
}

// BattlePage 컴포넌트 props 인터페이스
interface BattlePageProps {
  selectedDeck: string[];
}

// Card 컴포넌트 props 인터페이스
interface CardProps {
  card: Card;
  fromZone: boolean;
  index: number;
  moveCard: (fromIndex: number, toIndex: number) => void;
  onClick: (e: React.MouseEvent<HTMLDivElement>) => void;
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void;
  costIcons: number;
  isHovered: boolean;
}

// 드래그 아이템 인터페이스
interface DragItem {
  id: string;
  fromZone: boolean;
  index: number;
  card: Card;
}

function BattlePage({ selectedDeck }: BattlePageProps) {
  const [message, setMessage] = useState<string>("");
  const [showMessage, setShowMessage] = useState<boolean>(false);
  const [turn, setTurn] = useState<number>(1);
  const [playerHP, setPlayerHP] = useState<number>(2000);
  const [enemyHP, setEnemyHP] = useState<number>(2000);

  const INITIAL_TIME = 30;
  const [timeLeft, setTimeLeft] = useState<number>(INITIAL_TIME);

  const [myCardsInZone, setMyCardsInZone] = useState<Card[]>([]);
  const [enemyCardsInZone, setEnemyCardsInZone] = useState<Card[]>([]);
  const navigate = useNavigate();
  const [shouldNavigate, setShouldNavigate] = useState(false);

  // 덱과 손패 분리
  const [deckCards, setDeckCards] = useState<Card[]>([]);
  const [handCards, setHandCards] = useState<Card[]>([]);
  const [canDrawThisTurn, setCanDrawThisTurn] = useState<boolean>(true);

  const [enemyremainingCards, enemysetRemainingCards] = useState<Card[]>(
    selectedDeck.map((cardImage, index) => {
      const enemycardData = (cardsData as any[]).find(
        (card) => card.image === cardImage
      );
      return {
        id: `enemy-card-${index}`,
        image: cardImage,
        name: enemycardData ? enemycardData.name : "Unknown Card",
        attack: enemycardData ? enemycardData.attack : 0,
        hp: enemycardData ? enemycardData.hp : 0,
        maxhp: enemycardData ? enemycardData.hp : 0,
        cost: enemycardData ? enemycardData.cost : 0,
      };
    })
  );

  const [playerCostIcons, setPlayerCostIcons] = useState<number>(1);
  const [opponentCostIcons, setOpponentCostIcons] = useState<number>(1);
  const [menuPosition, setMenuPosition] = useState<Position>({ x: 0, y: 0 });
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);
  const [eventMessage, setEventMessage] = useState<string>("");
  const [eventImage, setEventImage] = useState<string>("");
  const [activeEvents, setActiveEvents] = useState<Event[]>([]);
  const [showEventHP, setShowEventHP] = useState<boolean>(false);
  const [eventHP, setEventHP] = useState<number>(400);
  const [eventmaxHP, setEventMaxHP] = useState<number>(400);

  // useState에 내 턴 여부 상태 추가
  const [isMyTurn, setIsMyTurn] = useState<boolean>(false);

  // 애니메이션 중인 카드 상태 추가
  const [animatingCard, setAnimatingCard] = useState<Card | null>(null);
  const [animationPosition, setAnimationPosition] = useState<{
    x: number;
    y: number;
  }>({ x: 0, y: 0 });

  // 타이머 애니메이션 상태
  const [timerKey, setTimerKey] = useState<number>(0);
  const [showGameOver, setShowGameOver] = useState<boolean>(false);
  const [gameOverMessage, setGameOverMessage] = useState<string>("");

  const enemyCardZoneRef = useRef<HTMLDivElement>(null);
  const enemyAvatarRef = useRef<HTMLDivElement>(null);
  const myZoneRef = useRef<HTMLDivElement>(null);
  const playerZoneRef = useRef<HTMLDivElement>(null);

  // roomCode 는 실제 게임에서 받아오는 값이어야 하니 임시값으로 대체 (수정 필요)
  const roomCode = "defaultRoomCode";

  // 초기 덱과 손패 설정 함수
  const initializeDeckAndHand = useCallback(() => {
    const allCards = selectedDeck.map((cardImage, index) => {
      const cardData = (cardsData as any[]).find(
        (card) => card.image === cardImage
      );
      return {
        id: `card-${index}`,
        image: cardImage,
        name: cardData ? cardData.name : "Unknown Card",
        attack: cardData ? cardData.attack : 0,
        hp: cardData ? cardData.hp : 0,
        maxhp: cardData ? cardData.hp : 0,
        cost: cardData ? cardData.cost : 1,
      };
    });

    const oneCostCards = allCards.filter((card) => card.cost === 1);
    const otherCards = allCards.filter((card) => card.cost !== 1);

    let initialHand: Card[] = [];
    let remainingDeck: Card[] = [];

    if (oneCostCards.length > 0) {
      const guaranteedOneCost =
        oneCostCards[Math.floor(Math.random() * oneCostCards.length)];
      initialHand.push(guaranteedOneCost);

      const remainingCards = [
        ...oneCostCards.filter((c) => c.id !== guaranteedOneCost.id),
        ...otherCards,
      ];
      const shuffledRemaining = remainingCards.sort(() => Math.random() - 0.5);

      initialHand.push(...shuffledRemaining.slice(0, 2));
      remainingDeck = shuffledRemaining.slice(2);
    } else {
      const shuffledCards = [...allCards].sort(() => Math.random() - 0.5);
      initialHand = shuffledCards.slice(0, 3);
      remainingDeck = shuffledCards.slice(3);
    }

    setHandCards(initialHand);
    setDeckCards(remainingDeck);
  }, [selectedDeck]);

  // 초기 덱과 손패 설정
  useEffect(() => {
    initializeDeckAndHand();
  }, [initializeDeckAndHand]);

  // 카드 드로우 함수
  const drawCard = (): void => {
    if (!canDrawThisTurn) {
      setMessage("이번 턴에는 이미 카드를 뽑았습니다!");
      setShowMessage(true);
      return;
    }

    if (deckCards.length === 0) {
      setMessage("덱에 카드가 없습니다!");
      setShowMessage(true);
      return;
    }

    if (handCards.length >= 10) {
      setMessage("손패가 가득 찼습니다! (최대 10장)");
      setShowMessage(true);
      return;
    }

    const newCard = deckCards[0];
    setHandCards((prev) => [...prev, newCard]);
    setDeckCards((prev) => prev.slice(1));
    setCanDrawThisTurn(false);

    setMessage(`${newCard.name}을(를) 뽑았습니다!`);
    setShowMessage(true);
  };

  // 턴 종료 함수
  const endTurn = useCallback((): void => {
    setTurn((prevTurn) => {
      const newTurn = prevTurn + 1;
      setPlayerCostIcons(Math.min(newTurn, 8));
      setOpponentCostIcons(Math.min(newTurn, 8));
      setCanDrawThisTurn(true);
      setTimerKey((prev) => prev + 1); // 타이머 애니메이션 재시작

      // 5턴마다 이벤트 발생
      if (newTurn % 5 === 0) {
        showEvent();
      }

      return newTurn;
    });

    setTimeout(() => {
      setTimeLeft(INITIAL_TIME);
    }, 100);
  }, [INITIAL_TIME]);

  // '턴 종료' 버튼 이벤트 핸들러 이름 통일
  const handleendturn = () => {
    if (isMyTurn) {
      endTurn();
    } else {
      setMessage("상대방 턴입니다.");
      setShowMessage(true);
    }
  };

  // 카드 이동 함수
  const moveCardInZone = (fromIndex: number, toIndex: number) => {
    setMyCardsInZone((prevCards) => {
      const updatedCards = [...prevCards];
      const [removed] = updatedCards.splice(fromIndex, 1);
      updatedCards.splice(toIndex, 0, removed);
      return updatedCards;
    });
  };

  // 플레이어 HP 업데이트 함수
  const playerupdateHP = (
    target: "player" | "enemy" | "enemyCard",
    amount: number
  ) => {
    if (target === "player") {
      setPlayerHP((prev) => Math.max(0, prev + amount));
    } else if (target === "enemy") {
      setEnemyHP((prev) => Math.max(0, prev + amount));
    } else if (target === "enemyCard") {
      setEnemyCardsInZone((prevCards) => {
        // 적 카드 HP 업데이트 로직 필요 시 구현
        return prevCards;
      });
    }
  };

  // 이벤트 HP 업데이트
  const updateEventHP = (eventId: number, amount: number): void => {
    setActiveEvents((prevEvents) => {
      const updatedEvents = prevEvents
        .map((event) => {
          if (event.id === eventId) {
            const newHP = Math.max(0, event.hp + amount);
            if (newHP <= 0) {
              if (event.effect) {
                event.effect();
              }
              return null;
            }
            return { ...event, hp: newHP };
          }
          return event;
        })
        .filter(Boolean) as Event[];

      return updatedEvents;
    });
  };

  // 카드 클릭 이벤트 처리
  const handleCardClick = (
    cardId: string,
    fromZone: boolean,
    e: React.MouseEvent<HTMLDivElement>
  ) => {
    e.preventDefault();
    setSelectedCardId(cardId);
    setShowMenu(true);
    setMenuPosition({ x: e.clientX, y: e.clientY });
  };

  // 오른쪽 클릭 카드 핸들러
  const handleCardRightClick = (
    e: React.MouseEvent<HTMLDivElement>,
    cardId: string
  ) => {
    e.preventDefault();
    // TODO: 오른쪽 클릭 시 메뉴 구현 또는 카드 정보 표시
    setMessage("카드 우클릭 메뉴 준비중입니다.");
    setShowMessage(true);
  };

  // 오른쪽 클릭 존 카드 핸들러
  const handleZoneRightClick = (
    e: React.MouseEvent<HTMLDivElement>,
    cardId: string
  ) => {
    e.preventDefault();
    setMessage("존 카드 우클릭 메뉴 준비중입니다.");
    setShowMessage(true);
  };

  // 메시지 박스 닫기
  const closeMessage = () => {
    setShowMessage(false);
  };

  // 메뉴 닫기
  const closeMenu = () => {
    setShowMenu(false);
    setSelectedCardId(null);
  };

  // 이벤트 표시 함수 (5턴마다 실행)
  const showEvent = () => {
    const eventId = Math.floor(Math.random() * 100000);
    const newEvent: Event = {
      id: eventId,
      type: 1,
      image: healImage,
      message: "체력을 회복합니다!",
      hp: 400,
      maxHp: 400,
      effect: () => {
        setPlayerHP((prev) => Math.min(2000, prev + 500));
        setMessage("체력 500 회복!");
        setShowMessage(true);
      },
    };

    setActiveEvents((prev) => [...prev, newEvent]);
  };

  // socket 이벤트 등록 및 해제
  useEffect(() => {
    socket.connect();
    socket.emit("joinRoom", roomCode);

    socket.on("gameStart", ({ currentTurn }) => {
      setIsMyTurn(socket.id === currentTurn);
    });

    socket.on("turnChanged", (newTurnPlayerId: string) => {
      setIsMyTurn(socket.id === newTurnPlayerId);
      setTimeLeft(INITIAL_TIME);
      setCanDrawThisTurn(true);
    });

    socket.on("opponentPlayCard", (card: Card) => {
      setEnemyCardsInZone((prev) => [...prev, card]);
    });

    socket.on("opponentLeft", () => {
      alert("상대방이 나갔습니다.");
      navigate("/");
    });

    return () => {
      socket.off("gameStart");
      socket.off("turnChanged");
      socket.off("opponentPlayCard");
      socket.off("opponentLeft");
      socket.disconnect();
    };
  }, [roomCode, navigate]);

  // 드롭 핸들러들
  const [, drop] = useDrop<DragItem, void, {}>({
    accept: "CARD",
    drop: (item) => {
      if (item.fromZone) {
        const fromIndex = myCardsInZone.findIndex(
          (card) => card.id === item.id
        );
        const toIndex = myCardsInZone.length - 1;
        moveCardInZone(fromIndex, toIndex);
      }
    },
  });

  const [, dropEnemyCard] = useDrop<DragItem, void, {}>({
    accept: "CARD",
    drop: (item) => {
      const droppedCard = myCardsInZone.find((card) => card.id === item.id);
      if (droppedCard && typeof droppedCard.attack === "number") {
        playerupdateHP("enemyCard", -droppedCard.attack);
      }
    },
  });

  const [, dropEnemy] = useDrop<DragItem, void, {}>({
    accept: "CARD",
    drop: (item) => {
      const droppedCard = myCardsInZone.find((card) => card.id === item.id);
      if (droppedCard && typeof droppedCard.attack === "number") {
        playerupdateHP("enemy", -droppedCard.attack);
      }
    },
  });

  // useEffect로 드롭 영역 ref 연결
  useEffect(() => {
    if (enemyCardZoneRef.current) {
      dropEnemyCard(enemyCardZoneRef.current);
    }
  }, [dropEnemyCard]);

  useEffect(() => {
    if (enemyAvatarRef.current) {
      dropEnemy(enemyAvatarRef.current);
    }
  }, [dropEnemy]);

  useEffect(() => {
    if (myZoneRef.current) {
      drop(myZoneRef.current);
    }
  }, [drop]);

  useEffect(() => {
    if (playerZoneRef.current) {
      drop(playerZoneRef.current);
    }
  }, [drop]);

  // 카드 렌더링 함수
  const renderMyCard = (card: Card, fromZone: boolean, index: number) => {
    const isHovered = hoveredCardId === card.id;

    return (
      <div key={card.id} className="card-slot">
        <Card
          card={card}
          fromZone={fromZone}
          index={index}
          moveCard={moveCardInZone}
          onClick={(e) => handleCardClick(card.id, fromZone, e)}
          onContextMenu={(e) =>
            fromZone
              ? handleZoneRightClick(e, card.id)
              : handleCardRightClick(e, card.id)
          }
          costIcons={playerCostIcons}
          isHovered={isHovered}
        />
      </div>
    );
  };

  // 중앙 horizontal line 컴포넌트
  const BurnLineComponent = () => {
    const [burnProgress, setBurnProgress] = useState(0);

    useEffect(() => {
      const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;
      setBurnProgress(Math.min(progress, 100));
    }, [timeLeft]);

    const getFireColor = (progress: number) => {
      if (progress < 25) {
        return "#00FF00";
      } else if (progress < 50) {
        return "#FFFF00";
      } else if (progress < 75) {
        return "#FF8800";
      } else {
        return "#FF0000";
      }
    };

    return (
      <div
        className="horizontal-line"
        style={{
          background:
            burnProgress > 0
              ? `linear-gradient(to right, ${getFireColor(
                  burnProgress
                )} ${burnProgress}%, #ffffff ${burnProgress}%)`
              : "linear-gradient(to right, #ffffff 0%, #ffffff 100%)",
        }}
      />
    );
  };

  // 타이머 색상 함수
  const getTimerColor = (timeLeft: number) => {
    const timeRatio = timeLeft / INITIAL_TIME;

    if (timeRatio > 0.75) {
      return "#00FF00";
    } else if (timeRatio > 0.5) {
      return "#FFFF00";
    } else if (timeRatio > 0.25) {
      return "#FF8800";
    } else {
      return "#FF0000";
    }
  };

  // 원형 타이머 컴포넌트
  const CircularTimer = () => {
    const timerColor = getTimerColor(timeLeft);
    const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;

    return (
      <div className="timer-container">
        <div
          className="timer"
          style={{
            background: `conic-gradient(${timerColor} ${
              progress * 3.6
            }deg, #eee 0deg)`,
          }}
        >
          <div className="timer-inner">
            <div className="timer-text">{timeLeft}초</div>
          </div>
        </div>
      </div>
    );
  };

  // 게임 다시 시작 함수
  const handleRestartGame = useCallback(() => {
    setTurn(1);
    setPlayerHP(2000);
    setEnemyHP(2000);
    setTimeLeft(INITIAL_TIME);
    setMyCardsInZone([]);
    initializeDeckAndHand(); // 덱과 손패 초기화
    setCanDrawThisTurn(true);
    setPlayerCostIcons(1);
    setOpponentCostIcons(1);
    setActiveEvents([]);
    setAnimatingCard(null);
    setAnimationPosition({ x: 0, y: 0 });
    setTimerKey(0); // 타이머 애니메이션 재시작
    setShowGameOver(false);
    setGameOverMessage("");
    setShowMessage(false); // 메시지 박스 숨기기
    setMessage(""); // 메시지 초기화
  }, [INITIAL_TIME, initializeDeckAndHand]);

  // 메인 메뉴로 이동 함수
  const handleGoToMainMenu = useCallback(() => {
    navigate("/"); // 메인 메뉴 경로로 이동
  }, [navigate]);

  // 타이머 카운트다운 (매초 감소)
  useEffect(() => {
    if (!isMyTurn) return;
    if (timeLeft <= 0) {
      handleendturn();
      return;
    }
    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, isMyTurn]);

  return (
    <div className="battle-container">
      {showMessage && (
        <MessageBox
          bgColor="#e3f2fd"
          borderColor="#2196f3"
          textColor="#0d47a1"
          onClose={closeMessage}
          closeborderColor="black"
        >
          {message}
        </MessageBox>
      )}

      {/* 애니메이션 중인 카드 */}
      {animatingCard && (
        <div className="animating-card-overlay">
          <div
            className="animating-card"
            style={{
              left: animationPosition.x,
              top: animationPosition.y,
            }}
          >
            <img
              src={animatingCard.image || "/placeholder.svg"}
              alt="애니메이션 카드"
            />
            <div className="card-cost">{animatingCard.cost}</div>
          </div>
        </div>
      )}

      <div className="field-container">
        {/* 적 필드 */}
        <div className="enemy-card-bg" />
        <div className="enemy-field">
          <div ref={enemyCardZoneRef} className="enemy-card-zone">
            {[...Array(5)].map((_, index) => (
              <div key={`enemy-card-${index}`} className="enemy-card-slot">
                <div className="enemy-card">
                  <div className="card-back" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 중앙 구분선 */}
        <BurnLineComponent />

        {/* 플레이어 필드 */}
        <div ref={playerZoneRef} className="player-field"></div>
        <div className="player-card-bg" />

        {/* 플레이어 카드존 */}
        <div ref={myZoneRef} className="player-card-zone">
          {myCardsInZone.length > 0 ? (
            myCardsInZone.map((card, index) => renderMyCard(card, true, index))
          ) : (
            <div className="empty-zone">카드를 여기에 배치하세요</div>
          )}
        </div>

        {/* 타이머 존 */}
        <div className="time-zone">
          <div className="turn-indicator">턴: {turn}</div>
          <CircularTimer />
        </div>

        {/* 덱과 손패 영역 */}
        <div className="deck-area">
          <button
            className="deck-card"
            onClick={drawCard}
            disabled={!canDrawThisTurn || deckCards.length === 0}
            title={`덱에 ${deckCards.length}장 남음`}
          >
            <div className="deck-count">{deckCards.length}</div>
          </button>
          <div className="hand-cards">
            {handCards.map((card, index) => renderMyCard(card, false, index))}
          </div>
        </div>

        {/* 코스트 존 */}
        <div className="enemy-cost-zone">
          {[...Array(opponentCostIcons)].map((_, index) => (
            <div key={`enemy-cost-${index}`} className="cost-icon" />
          ))}
        </div>
        <div className="player-cost-zone">
          {[...Array(playerCostIcons)].map((_, index) => (
            <div key={`player-cost-${index}`} className="cost-icon" />
          ))}
        </div>
      </div>

      <div className="right-container">
        {/* 적 정보 */}
        <div className="enemy-info">
          <div ref={enemyAvatarRef} className="enemy-avatar" />
          <div className="hp-bar">
            <div
              className="hp-bar-inner"
              style={{ width: `${(enemyHP / 2000) * 100}%` }}
            ></div>
            <div className="hp-text">{enemyHP}/2000</div>
          </div>
        </div>

        {/* 이벤트 존 */}
        <div className="event-zone">
          <div className="event-items-container">
            {activeEvents.map((event) => (
              <EventItem
                key={event.id}
                event={event}
                updateEventHP={updateEventHP}
              />
            ))}
          </div>
          <button className="endturn-button" onClick={handleendturn}>
            턴 종료
            <CiClock1 size={24} />
          </button>
        </div>

        {/* 플레이어 정보 */}
        <div className="player-info">
          <div className="player-avatar" />
          <div className="hp-bar">
            <div
              className="hp-bar-inner"
              style={{ width: `${(playerHP / 2000) * 100}%` }}
            ></div>
            <div className="hp-text">{playerHP}/2000</div>
          </div>
        </div>
      </div>

      {showMenu && (
        <CardMenu
          x={menuPosition.x}
          y={menuPosition.y}
          onClose={closeMenu}
          card={
            myCardsInZone.find((card) => card.id === selectedCardId) ||
            handCards.find((card) => card.id === selectedCardId)
          }
        />
      )}

      {showGameOver && (
        <GameOverScreen
          message={gameOverMessage}
          onRestart={handleRestartGame}
          onGoToMainMenu={handleGoToMainMenu}
        />
      )}
    </div>
  );
}

// Card 컴포넌트 (ref 문제 해결용 수정됨)
const Card = ({
  card,
  fromZone,
  index,
  moveCard,
  onClick,
  onContextMenu,
  costIcons,
  isHovered,
}: CardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: { id: card.id, fromZone, index, card },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: fromZone,
  });

  const [, drop] = useDrop({
    accept: "CARD",
    hover(item: DragItem, monitor) {
      if (!fromZone) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      moveCard(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  useEffect(() => {
    if (cardRef.current) {
      drag(cardRef.current);
      drop(cardRef.current);
    }
  }, [drag, drop]);

  const cardClassName = `my-card ${fromZone ? "in-zone" : ""} ${
    isDragging ? "dragging" : ""
  }`;

  return (
    <div
      ref={cardRef}
      className={cardClassName}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={{
        opacity: isDragging ? 0.5 : 1,
        position: "relative",
        transform: isHovered ? "scale(2.5)" : "scale(1)",
        transition: "transform 0.2s ease-in-out",
        zIndex: isHovered ? 10 : 1,
      }}
    >
      <img src={card.image} alt={card.name} />
      <div className="card-info">
        <div className="card-name">{card.name}</div>
        <div className="card-attack">{card.attack}</div>
        <div className="card-hp">
          {card.hp}/{card.maxhp}
        </div>
        <div className="card-cost">
          {Array.from({ length: card.cost }).map((_, i) => (
            <img key={i} src={costImage} alt="cost icon" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BattlePage;
