'use client'
import { useState, useEffect, useCallback } from "react"
import { useDrag, useDrop } from "react-dnd"
import "./BattlePage.css"
import CardMenu from "./CardMenu"
import { cardsData } from "./Inventory"
import costImage from "./assets/images/cost.png"
import healImage from "./assets/images/heal.png"
import bombImage from "./assets/images/bomb.png"
import EventItem from "./Eventitem"

function BattlePage({ selectedDeck }) {
  const [message, setMessage] = useState("")
  const [showMessage, setShowMessage] = useState(false)
  const [turn, setTurn] = useState(1)
  const [playerHP, setPlayerHP] = useState(2000)
  const [enemyHP, setEnemyHP] = useState(2000)
  const [timeLeft, setTimeLeft] = useState(30)
  const [myCardsInZone, setMyCardsInZone] = useState([])
  const [remainingCards, setRemainingCards] = useState(
    selectedDeck.map((cardImage, index) => {
      const cardData = cardsData.find((card) => card.image === cardImage)
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
  const [enemyremainingCards, enemysetRemainingCards] = useState(
    selectedDeck.map((cardImage, index) => {
      const enemycardData = cardsData.find((card) => card.image === cardImage)
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

  const [playerCostIcons, setPlayerCostIcons] = useState(1)
  const [opponentCostIcons, setOpponentCostIcons] = useState(1)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [showMenu, setShowMenu] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState(null)
  const [hoveredCardId, setHoveredCardId] = useState(null)
  const [eventMessage, setEventMessage] = useState("")
  const [eventImage, setEventImage] = useState("")
  const [activeEvents, setActiveEvents] = useState([])
  const [showEventHP, setShowEventHP] = useState(false)
  const [eventHP, setEventHP] = useState(400)
  const [eventmaxHP, setEventMaxHP] = useState(400)

  // 턴 종료 버튼 핸들러
  const handleendturn = () => {
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
  const handleCardRightClick = (e, cardId) => {
    e.preventDefault()
    e.currentTarget.classList.toggle("righthover")
  }

  // 존 우클릭 핸들러
  const handleZoneRightClick = (e, cardId) => {
    e.preventDefault()
    setMenuPosition({ x: e.clientX, y: e.clientY })
    setSelectedCardId(cardId)
    setShowMenu(true)
  }

  // 메뉴 닫기
  const closeMenu = () => {
    setShowMenu(false)
    setSelectedCardId(null)
  }

  // 턴 종료 함수
  const endTurn = useCallback(() => {
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
  const showEvent = () => {
    const event = Math.floor(Math.random() * 3)
    let eventMsg = ""
    let eventImg = null
    let eventEffect = null

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
    const calculateEventHP = () => {
      const baseHP = 100
      const turnMultiplier = Math.floor(turn / 5)
      return baseHP + turnMultiplier * 100
    }

    // 이벤트 존에 이벤트 추가
    const newEvent = {
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
  const playerupdateHP = (player, amount) => {
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
  const handleCardClick = (cardId, fromZone) => {
    if (fromZone) {
      return
    } else {
      const cardToMove = remainingCards.find((c) => c.id === cardId)
      if (playerCostIcons >= cardToMove.cost) {
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
  const closeMessage = () => {
    setShowMessage(false)
    setMessage("")
  }

  // 적 공격 함수
  const attackEnemy = (cardId) => {
    const attackingCard = myCardsInZone.find((card) => card.id === cardId)
    if (attackingCard && typeof attackingCard.attack === "number") {
      playerupdateHP("enemy", -attackingCard.attack)
    }
  }

  // 카드 이동 함수
  const moveCardInZone = useCallback((fromIndex, toIndex) => {
    setMyCardsInZone((prevCards) => {
      const newCards = [...prevCards]
      const [movedCard] = newCards.splice(fromIndex, 1)
      newCards.splice(toIndex, 0, movedCard)
      return newCards
    })
  }, [])

  // 드롭 핸들러
  const [, drop] = useDrop({
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
  const [, dropEnemyCard] = useDrop({
    accept: "CARD",
    drop: (item, moniter) => {
      const droppedCard = myCardsInZone.find((card) => card.id)
      if (droppedCard && typeof droppedCard.attack === "number") {
        playerupdateHP("enemyCard", -droppedCard.attack)
      } else {
        console.error("Invalid attack value:", droppedCard)
      }
    },
  })

  // 적 드롭 핸들러
  const [, dropEnemy] = useDrop({
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
  const updateEventHP = (eventId, amount) => {
    setActiveEvents((prevEvents) =>
      prevEvents.map((event) =>
        event.id === eventId ? { ...event, hp: Math.max(0, Math.min(event.maxHp, event.hp + amount)) } : event,
      ),
    )
  }

  // 이벤트 존에 카드를 드롭했을 때 이벤트 HP를 감소함
  const [, dropEvent] = useDrop({
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
  const renderMyCard = (card, fromZone, index) => {
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
          <div ref={dropEnemy} className="enemy-avatar" />
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
          <div className="event-zone">
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

        <div ref={drop} className="card-zone my-zone">
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
          cardId={selectedCardId}
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
const Card = ({ card, fromZone, index, moveCard, onClick, onContextMenu, costIcons, isHovered }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: { id: card.id, fromZone, index, card }, // card 객체 전체를 item에 포함
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: fromZone,
  })

  const [, drop] = useDrop({
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

  // 호버 효과를 위한 스타일 계산
  const cardStyle = {
    position: "relative",
    transform: isHovered ? "scale(2.5) translateY(-145px)" : "scale(1)",
    zIndex: isHovered ? 100 : 1,
    transition: "transform 0.7s ease-in-out",
  }

  return (
    <div
      ref={(node) => drag(drop(node))}
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

