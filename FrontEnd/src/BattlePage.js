"use client"

import { useState, useEffect, useCallback } from "react"
import { useDrag, useDrop } from "react-dnd"
import "./BattlePage.css"
import CardMenu from "./CardMenu"
import { cardsData } from "./Inventory"

function BattlePage({ selectedDeck }) {
  const [turn, setTurn] = useState(1)
  const [playerHP, setPlayerHP] = useState(2000)
  const [enemyHP, setenemyHP] = useState(2000)
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
      }
    }),
  )

  const [costIcons, setCostIcons] = useState([1])
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [showMenu, setShowMenu] = useState(false)
  const [selectedCardId, setSelectedCardId] = useState(null)

  const handleendturn = () => {
    setTurn(turn + 1)
    setCostIcons((prev) => [...prev, turn].slice(-8))
    setTimeLeft(30)
  }

  const handleCardRightClick = (e, cardId) => {
    e.preventDefault()
    e.currentTarget.classList.toggle("righthover")
  }

  const handleZoneRightClick = (e, cardId) => {
    e.preventDefault()
    setMenuPosition({ x: e.clientX, y: e.clientY })
    setSelectedCardId(cardId)
    setShowMenu(true)
  }

  const closeMenu = () => {
    setShowMenu(false)
    setSelectedCardId(null)
  }

  const endTurn = useCallback(() => {
    setTurn((prevTurn) => {
      const turn = prevTurn + 1
      setCostIcons((prev) => [...prev, turn].slice(-7))
      setTimeLeft(30)
      return turn
    })
  }, [])

  const updateHP = (player, amount) => {
    if (player === "player") {
      setPlayerHP((prevHP) => Math.max(0, Math.min(2000, prevHP + amount)))
    } else {
      setenemyHP((prevHP) => Math.max(0, Math.min(2000, prevHP + amount)))
    }
  }

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

  const handleCardClick = (cardId, fromZone) => {
    if (fromZone) {
      return
    } else {
      const cardToMove = remainingCards.find((c) => c.id === cardId)
      setRemainingCards(remainingCards.filter((c) => c.id !== cardId))
      setMyCardsInZone([...myCardsInZone, cardToMove])
    }
  }

  const moveCardInZone = useCallback((fromIndex, toIndex) => {
    setMyCardsInZone((prevCards) => {
      const newCards = [...prevCards]
      const [movedCard] = newCards.splice(fromIndex, 1)
      newCards.splice(toIndex, 0, movedCard)
      return newCards
    })
  }, [])

  const [, drop] = useDrop({
    accept: "CARD",
    drop: (item, monitor) => {
      const dropResult = monitor.getDropResult()
      if (item.fromZone) {
        const fromIndex = myCardsInZone.findIndex((card) => card.id === item.id)
        const toIndex = myCardsInZone.length - 1 // 항상 맨 뒤로 이동
        moveCardInZone(fromIndex, toIndex)
      }
    },
  })

  const [, dropEnemy] = useDrop({
    accept: "CARD",
    drop: (item, monitor) => {
      const droppedCard = myCardsInZone.find((card) => card.id === item.id)
      if (droppedCard && typeof droppedCard.attack === "number") {
        updateHP("enemy", -droppedCard.attack)
      } else {
        console.error("Invalid attack value:", droppedCard)
      }
    },
  })

  const renderMyCard = (card, fromZone, index) => {
    return (
      <div key={card.id} className="card-slot">
        <Card
          card={card}
          fromZone={fromZone}
          index={index}
          moveCard={moveCardInZone}
          onClick={() => handleCardClick(card.id, fromZone)}
          onContextMenu={(e) => (fromZone ? handleZoneRightClick(e, card.id) : handleCardRightClick(e, card.id))}
        />
      </div>
    )
  }

  return (
    <div className="battle-container">
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
          {costIcons.map((_, index) => (
            <div key={`opponent-cost-${index}`} className="cost-icon" />
          ))}
        </div>

        <div ref={drop} className="card-zone my-zone">
          {myCardsInZone.length > 0 ? (
            myCardsInZone.map((card, index) => renderMyCard(card, true, index))
          ) : (
            <span></span>
          )}
        </div>
        <div className="cost-zone my-cost">
          {costIcons.map((_, index) => (
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
          <div>
            <button className="endturn-button" onClick={handleendturn}>
              턴 종료
            </button>
          </div>
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

const Card = ({ card, fromZone, index, moveCard, onClick, onContextMenu }) => {
  const [{ isDragging }, drag] = useDrag({
    type: "CARD",
    item: { id: card.id, fromZone, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    canDrag: fromZone, // 카드존에 있는 카드만 드래그 가능
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

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`my-card ${fromZone ? "in-zone" : ""} ${isDragging ? "dragging" : ""}`}
      onClick={onClick}
      onContextMenu={onContextMenu}
    >
      <div className="card-front">
        <img src={card.image || "/placeholder.svg"} alt="내 카드" />
      </div>
    </div>
  )
}

export default BattlePage

