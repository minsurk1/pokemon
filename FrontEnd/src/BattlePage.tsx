import { useState, useEffect, useCallback, useRef } from "react"
import React from "react"

import { useDrag, useDrop } from "react-dnd"
import "./BattlePage.css"
import CardMenu from "./CardMenu.tsx"
import { cardsData } from "./Inventory.tsx"
import costImage from "./assets/images/cost.png"
import healImage from "./assets/images/heal.png"
import bombImage from "./assets/images/bomb.png"
import EventItem from "./Eventitem.tsx"

// 카드 인터페이스 정의
interface Card {
  id: string
  image: string
  name: string
  attack: number
  hp: number
  maxhp: number
  cost: number
}

// 이벤트 인터페이스 정의
interface Event {
  id: number
  type: number
  image: string
  message: string
  hp: number
  maxHp: number
  effect: () => void
}

// 메뉴 위치 인터페이스 정의
interface Position {
  x: number
  y: number
}

// BattlePage 컴포넌트 props 인터페이스
interface BattlePageProps {
  selectedDeck: string[]
}

// Card 컴포넌트 props 인터페이스
interface CardProps {
  card: Card
  fromZone: boolean
  index: number
  moveCard: (fromIndex: number, toIndex: number) => void
  onClick: () => void
  onContextMenu: (e: React.MouseEvent<HTMLDivElement>) => void
  costIcons: number
  isHovered: boolean
}

// 드래그 아이템 인터페이스
interface DragItem {
  id: string
  fromZone: boolean
  index: number
  card: Card
}

interface CardData {
  name: string
  tier?: number
  image: string
  attack: number
  hp: number
  cost: number
}

function BattlePage({ selectedDeck }: BattlePageProps) {
  const [message, setMessage] = useState<string>("")
  const [showMessage, setShowMessage] = useState<boolean>(false)
  const [turn, setTurn] = useState<number>(1)
  const [playerHP, setPlayerHP] = useState<number>(2000)
  const [enemyHP, setEnemyHP] = useState<number>(2000)
  const [timeLeft, setTimeLeft] = useState<number>(30)
  const [myCardsInZone, setMyCardsInZone] = useState<Card[]>([])
  const [remainingCards, setRemainingCards] = useState<Card[]>(
    selectedDeck.map((cardImage, index) => {
      const cardData = (cardsData as any[]).find((card) => card.image === cardImage)
      return {
        id: `card-${index}`,
        image: cardImage,
        name: cardData ? cardData.name : "Unknown Card",
        attack: cardData ? cardData.attack : 0,
        hp: cardData ? cardData.hp : 0,
        maxhp: cardData ? cardData.hp : 0,
        cost: cardData ? cardData.cost : 0,
      }
    }),
  )
  const [enemyremainingCards, enemysetRemainingCards] = useState<Card[]>(
    selectedDeck.map((cardImage, index) => {
      const enemycardData = (cardsData as any[]).find((card) => card.image === cardImage)
      return {
        id: `card-${index}`,
        image: cardImage,
        name: enemycardData ? enemycardData.name : "Unknown Card",
        attack: enemycardData ? enemycardData.attack : 0,
        hp: enemycardData ? enemycardData.hp : 0,
        maxhp: enemycardData ? enemycardData.hp : 0,
        cost: enemycardData ? enemycardData.cost : 0,
      }
    }),
  )

  const [playerCostIcons, setPlayerCostIcons] = useState<number>(1)
  const [opponentCostIcons, setOpponentCostIcons] = useState<number>(1)
  const [menuPosition, setMenuPosition] = useState<Position>({ x: 0, y: 0 })
  const [showMenu, setShowMenu] = useState<boolean>(false)
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null)
  const [hoveredCardId, setHoveredCardId] = useState<string | null>(null)
  const [eventMessage, setEventMessage] = useState<string>("")
  const [eventImage, setEventImage] = useState<string>("")
  const [activeEvents, setActiveEvents] = useState<Event[]>([])
  const [showEventHP, setShowEventHP] = useState<boolean>(false)
  const [eventHP, setEventHP] = useState<number>(400)
  const [eventmaxHP, setEventMaxHP] = useState<number>(400)

  // ref 객체 생성
  const enemyAvatarRef = useRef<HTMLDivElement>(null)
  const myZoneRef = useRef<HTMLDivElement>(null)
  const eventZoneRef = useRef<HTMLDivElement>(null)

  // 턴 종료 버튼 핸들러
  const handleendturn = (): void => {
    setTurn(turn + 1)
    const newTotal = Math.min(turn + 1, 8)
    setPlayerCostIcons(newTotal)
    setOpponentCostIcons(newTotal)
    setTimeLeft(30)

    // 5턴마다 이벤트 발생
    if ((turn + 1) % 5 === 0) {
      showEvent()
    }
  }

  // 카드 우클릭 핸들러
  const handleCardRightClick = (e: React.MouseEvent<HTMLDivElement>, cardId: string): void => {
    e.preventDefault()
    e.currentTarget.classList.toggle("righthover")
  }

  // 존 우클릭 핸들러
  const handleZoneRightClick = (e: React.MouseEvent<HTMLDivElement>, cardId: string): void => {
    e.preventDefault()
    setMenuPosition({ x: e.clientX, y: e.clientY })
    setSelectedCardId(cardId)
    setShowMenu(true)
  }

  // 메뉴 닫기
  const closeMenu = (): void => {
    setShowMenu(false)
    setSelectedCardId(null)
  }

  // 턴 종료 함수
  const endTurn = useCallback((): void => {
    setTurn((prevTurn) => {
      const newTurn = prevTurn + 1
      setPlayerCostIcons(Math.min(newTurn + 1, 8))
      setTimeLeft(30)

      // 5턴마다 이벤트 발생
      if (newTurn % 5 === 0) {
        showEvent()
      }

      return newTurn
    })
  }, [])

  // 이벤트 표시 함수 수정
  const showEvent = (): void => {
    const event = Math.floor(Math.random() * 3)
    let eventMsg = ""
    let eventImg = ""
    let eventEffect: () => void = () => {}

    if (event === 0) {
      eventMsg = "코스트 1 추가 이벤트"
      eventImg = costImage
      eventEffect = () => setPlayerCostIcons((prev) => Math.min(prev + 1, 8))
    } else if (event === 1) {
      eventMsg = "체력 200 회복 이벤트"
      eventImg = healImage
      eventEffect = () => setPlayerHP((prev) => Math.min(prev + 200, 2000))
    } else if (event === 2) {
      eventMsg = "적에게 200 데미지 이벤트"
      eventImg = bombImage
      eventEffect = () => setEnemyHP((prev) => Math.max(prev - 200, 0))
    }

    setMessage(`새로운 이벤트가 등장했습니다: ${eventMsg}`)
    setEventImage(eventImg)
    setShowMessage(true)

    //턴 지날떄 마다 이벤트 HP증가
    const calculateEventHP = (): number => {
      const baseHP = 100
      const turnMultiplier = Math.floor(turn / 5)
      return baseHP + turnMultiplier * 100
    }

    // 이벤트 존에 이벤트 추가
    const newEvent: Event = {
      id: Date.now(),
      type: event,
      image: eventImg,
      message: eventMsg,
      hp: calculateEventHP(),
      maxHp: calculateEventHP(),
      effect: eventEffect,
    }

    setActiveEvents((prev) => [...prev, newEvent])

    setTimeout(() => {
      setShowMessage(false)
    }, 3000)
  }

  // HP 업데이트 함수
  const playerupdateHP = (player: "player" | "enemy" | "enemyCard", amount: number): void => {
    if (player === "player") {
      setPlayerHP((prevHP) => Math.max(0, Math.min(2000, prevHP + amount)))
    } else {
      setEnemyHP((prevHP) => Math.max(0, Math.min(2000, prevHP + amount)))
    }
  }

  // 타이머 효과
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          endTurn()
          return 30
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [endTurn])

  // 카드 클릭 핸들러
  const handleCardClick = (cardId: string, fromZone: boolean): void => {
    if (fromZone) {
      return
    } else {
      const cardToMove = remainingCards.find((c) => c.id === cardId)
      if (cardToMove && playerCostIcons >= cardToMove.cost) {
        // 카드 호버 효과 적용
        setHoveredCardId(cardId)

        setTimeout(() => {
          setRemainingCards(remainingCards.filter((c) => c.id !== cardId))
          setMyCardsInZone([...myCardsInZone, cardToMove])
          setPlayerCostIcons((prevIcons) => prevIcons - cardToMove.cost)
          setHoveredCardId(null) // 호버 상태 초기화
        }, 500)
      } else {
        setMessage("코스트가 부족하여 이 카드를 사용할 수 없습니다!")
        setShowMessage(true)
      }
    }
  }

  // 메시지 닫기
  const closeMessage = (): void => {
    setShowMessage(false)
    setMessage("")
  }

  // 적 공격 함수
  const attackEnemy = (cardId: string): void => {
    const attackingCard = myCardsInZone.find((card) => card.id === cardId)
    if (attackingCard && typeof attackingCard.attack === "number") {
      playerupdateHP("enemy", -attackingCard.attack)
    }
  }

  // 카드 이동 함수
  const moveCardInZone = useCallback((fromIndex: number, toIndex: number): void => {
    setMyCardsInZone((prevCards) => {
      const newCards = [...prevCards]
      const [movedCard] = newCards.splice(fromIndex, 1)
      newCards.splice(toIndex, 0, movedCard)
      return newCards
    })
  }, [])

  // 드롭 핸들러
  const [, drop] = useDrop<DragItem, void, {}>({
    accept: "CARD",
    drop: (item, monitor) => {
      if (item.fromZone) {
        const fromIndex = myCardsInZone.findIndex((card) => card.id === item.id)
        const toIndex = myCardsInZone.length - 1
        moveCardInZone(fromIndex, toIndex)
      }
    },
  })

  // 적 카드 드롭 핸들러
  const [, dropEnemyCard] = useDrop<DragItem, void, {}>({
    accept: "CARD",
    drop: (item, monitor) => {
      const droppedCard = myCardsInZone.find((card) => card.id === item.id)
      if (droppedCard && typeof droppedCard.attack === "number") {
        playerupdateHP("enemyCard", -droppedCard.attack)
      } else {
        console.error("Invalid attack value:", droppedCard)
      }
    },
  })

  // 적 드롭 핸들러
  const [, dropEnemy] = useDrop<DragItem, void, {}>({
    accept: "CARD",
    drop: (item, monitor) => {
      const droppedCard = myCardsInZone.find((card) => card.id === item.id)
      if (droppedCard && typeof droppedCard.attack === "number") {
        playerupdateHP("enemy", -droppedCard.attack)
      } else {
        console.error("Invalid attack value:", droppedCard)
      }
    },
  })

  // 특정 이벤트의 HP를 업데이트하도록 변경합니다.
  const updateEventHP = (eventId: number, amount: number): void => {
    setActiveEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventId ? { ...event, hp: Math.max(0, Math.min(event.maxHp, event.hp + amount)) } : event,
      ),
    )
  }

  // 이벤트 존에 카드를 드롭했을 때 이벤트 HP를 감소함
  const [, dropEvent] = useDrop<DragItem, void, {}>({
    accept: "CARD", // CARD 타입을 받아들입니다 (EVENT가 아님)
    drop: (item, monitor) => {
      // 드롭된 카드 찾기
      const droppedCard = myCardsInZone.find((card) => card.id === item.id)

      // 활성화된 이벤트가 있는지 확인
      if (activeEvents.length > 0 && droppedCard && typeof droppedCard.attack === "number") {
        // 가장 최근 이벤트의 HP 감소 (또는 다른 로직으로 대상 이벤트 선택 가능)
        const targetEvent = activeEvents[activeEvents.length - 1]
        updateEventHP(targetEvent.id, -droppedCard.attack)

        // 이벤트 HP가 0이 되면 제거하는 로직 추가 (선택사항)
        if (targetEvent.hp - droppedCard.attack <= 0) {
          setActiveEvents((prev) => prev.filter((event) => event.id !== targetEvent.id))
        }
      }
    },
  })

  // 내 카드 렌더링 함수
  const renderMyCard = (card: Card, fromZone: boolean, index: number) => {
    // 호버 효과 적용 여부 확인
    const isHovered = hoveredCardId === card.id

    return (
      <div key={card.id} className="card-slot">
        <Card
          card={card}
          fromZone={fromZone}
          index={index}
          moveCard={moveCardInZone}
          onClick={() => handleCardClick(card.id, fromZone)}
          onContextMenu={(e) => (fromZone ? handleZoneRightClick(e, card.id) : handleCardRightClick(e, card.id))}
          costIcons={playerCostIcons}
          isHovered={isHovered}
        />
      </div>
    )
  }

  // useEffect를 사용하여 ref와 drop 함수 연결
  useEffect(() => {
    if (enemyAvatarRef.current) {
      dropEnemy(enemyAvatarRef.current)
    }
  }, [dropEnemy])

  useEffect(() => {
    if (myZoneRef.current) {
      drop(myZoneRef.current)
    }
  }, [drop])

  useEffect(() => {
    if (eventZoneRef.current) {
      dropEvent(eventZoneRef.current)
    }
  }, [dropEvent])

  return (
    <div className="battle-container">
      {showMessage && (
        <div className="message-box">
          <p>{message}</p>
          <button className="close-button" onClick={closeMessage}>
            확인
          </button>
        </div>
      )}
      <div className="game-info">
        <div className="turn-indicator">턴: {turn}</div>
        <div className="timer">시간: {timeLeft}초</div>
      </div>

      <div className="player-section enemy-section">
        <div className="opponent-area">
          <div ref={enemyAvatarRef} className="enemy-avatar" />
          <div className="hp-bar">
            <div className="hp-bar-inner" style={{ width: `${(enemyHP / 2000) * 100}%` }}></div>
            <div className="hp-text">{enemyHP}/2000</div>
          </div>
          <div className="cards-row">
            {[...Array(8)].map((_, index) => (
              <div key={`opponent-card-${index}`} className="card-slot">
                <div className="enemy-card">
                  <div className="card-back" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="game-zones">
        <div className="card-zone opponent-zone">
          <span></span>
        </div>
        <div className="cost-zone opponent-cost">
          {[...Array(opponentCostIcons)].map((_, index) => (
            <div key={`opponent-cost-${index}`} className="cost-icon" />
          ))}
        </div>

        {/* 이벤트 존 */}
        <div className="middle-zone">
          <div ref={eventZoneRef} className="event-zone">
            <div className="event-items-container">
              {activeEvents.map((event) => (
                <EventItem key={event.id} event={event} updateEventHP={updateEventHP} />
              ))}
            </div>
          </div>
          <button className="endturn-button" onClick={handleendturn}>
            턴 종료
          </button>
        </div>

        <div ref={myZoneRef} className="card-zone my-zone">
          {myCardsInZone.length > 0 ? (
            myCardsInZone.map((card, index) => renderMyCard(card, true, index))
          ) : (
            <span></span>
          )}
        </div>
        <div className="cost-zone my-cost">
          {[...Array(playerCostIcons)].map((_, index) => (
            <div key={`my-cost-${index}`} className="cost-icon" />
          ))}
        </div>
      </div>

      <div className="player-section my-section">
        <div className="my-area">
          <div className="player-info">
            <div className="player-avatar" />
          </div>
          <div className="hp-bar">
            <div className="hp-bar-inner" style={{ width: `${(playerHP / 2000) * 100}%` }}></div>
            <div className="hp-text">{playerHP}/2000</div>
          </div>
          <div></div>
        </div>
      </div>

      <div className="deck-area">
        <div className="card-deck">
          {remainingCards.map((_, index) => (
            <div
              key={`deck-card-${index}`}
              className="deck-card"
              style={{ right: `${index * 2}px`, bottom: `${index * 1}px` }}
            />
          ))}
        </div>
        <div className="cards-row">{remainingCards.map((card, index) => renderMyCard(card, false, index))}</div>
      </div>

      {showMenu && (
        <CardMenu
          x={menuPosition.x}
          y={menuPosition.y}
          onClose={closeMenu}
          card={
            myCardsInZone.find((card) => card.id === selectedCardId) ||
            remainingCards.find((card) => card.id === selectedCardId)
          }
        />
      )}
    </div>
  )
}

// Card 컴포넌트
const Card = ({ card, fromZone, index, moveCard, onClick, onContextMenu, costIcons, isHovered }: CardProps) => {
  // useRef를 사용하여 ref 객체 생성
  const cardRef = useRef<HTMLDivElement>(null)

  const [{ isDragging }, drag] = useDrag<DragItem, unknown, { isDragging: boolean }>({
    type: "CARD",
    item: { id: card.id, fromZone, index, card }, // card 객체 전체를 item에 포함
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: fromZone,
  })

  const [, drop] = useDrop<DragItem, void, {}>({
    accept: "CARD",
    hover(item, monitor) {
      if (!fromZone) {
        return
      }
      const dragIndex = item.index
      const hoverIndex = index

      if (dragIndex === hoverIndex) {
        return
      }

      moveCard(dragIndex, hoverIndex)
      item.index = hoverIndex
    },
  })

  // useEffect를 사용하여 ref와 drag, drop 함수 연결
  useEffect(() => {
    if (cardRef.current) {
      drag(drop(cardRef.current))
    }
  }, [drag, drop])

  // 호버 효과를 위한 스타일 계산
  const cardStyle = {
    position: "relative" as const,
    transform: isHovered ? "scale(2.5) translateY(-145px)" : "scale(1)",
    zIndex: isHovered ? 100 : 1,
    transition: "transform 0.7s ease-in-out",
  }

  return (
    <div
      ref={cardRef}
      className={`my-card ${fromZone ? "in-zone" : ""} ${isDragging ? "dragging" : ""}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
      style={cardStyle}
    >
      <div className="card-front">
        <img src={card.image || "/placeholder.svg"} alt="내 카드" />
        <div className="card-cost">{card.cost}</div>
      </div>
      {fromZone && (
        <div className="card-hp-bar">
          <div className="card-hp-bar-inner" style={{ width: `${(card.hp / card.maxhp) * 100}%` }}></div>
          <div className="card-hp-text">
            {card.hp}/{card.maxhp}
          </div>
        </div>
      )}
    </div>
  )
}

export default BattlePage

