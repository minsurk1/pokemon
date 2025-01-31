import React, { useState, useEffect } from "react"
import "./BattlePage.css"

function BattlePage({ selectedDeck }) {
  const [turn, setTurn] = useState(1)
  const [playerHP, setPlayerHP] = useState(1000)
  const [opponentHP, setOpponentHP] = useState(1000)
  const [timeLeft, setTimeLeft] = useState(30)
  const [myCardsInZone, setMyCardsInZone] = useState([])
  const [remainingCards, setRemainingCards] = useState(
    selectedDeck.map((card, index) => ({
      id: `card-${index}`,
      image: card,
    }))
  )
  const [costIcons, setCostIcons] = useState([1])

  const handleendturn = () => {
    setTurn(turn + 1);
    setCostIcons((prev) => [...prev, turn].slice(-7))
    setTimeLeft(30) 
  }

  const endTurn = () => {
    setTurn((prevTurn) => {
      const turn = prevTurn + 1
      setCostIcons((prev) => [...prev, turn].slice(-7))
      setTimeLeft(30) 
      return turn
    })
  }

  const updateHP = (player, amount) => {
    if (player === 'player') {
      setPlayerHP(prevHP => Math.max(0, Math.min(1000, prevHP + amount)))
    } else {
      setOpponentHP(prevHP => Math.max(0, Math.min(1000, prevHP + amount)))
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          endTurn()
          return 30;
        }
        return prevTime - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [endTurn]) 

  const handleCardClick = (cardId, fromZone) => {
    if (fromZone) {
   
      return;
    } else {
      const cardToMove = remainingCards.find((c) => c.id === cardId)
      setRemainingCards(remainingCards.filter((c) => c.id !== cardId))
      setMyCardsInZone([...myCardsInZone, cardToMove])
    }
  }

  const handleCardRightClick = (e, cardId) => {
    e.preventDefault();
    e.currentTarget.classList.toggle("righthover");
  }

  const renderMyCard = (card, fromZone, index) => {
    return (
      <div key={card.id} className="card-slot">
        <div
          className={`my-card ${fromZone ? "in-zone" : ""} hoverable`}
          onClick={() => handleCardClick(card.id, fromZone)}
          onContextMenu={(e) => handleCardRightClick(e, card.id)}
        >
          <div className="card-front">
            <img src={card.image || "/placeholder.svg"} alt="내 카드" />
          </div>
        </div>
      </div>
    )
  }


  return (
    <div className="battle-container">
      {/* 기존 코드는 그대로 유지 */}
      <div className="game-info">
        <div className="turn-indicator">턴: {turn}</div>
        <div className="timer">시간: {timeLeft}초</div>
      </div>

      <div className="player-section enemy-section">
        <div className="opponent-area">
          <div className="enemy-avatar"/>
          <div className="hp-bar">
            <div className="hp-bar-inner" style={{width: `${opponentHP / 10}%`}}></div>
            <div className="hp-text">{opponentHP}/1000</div>
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
          <span>상대방 카드존</span>
        </div>
        <div className="cost-zone opponent-cost">
          {costIcons.map((_, index) => (
            <div key={`opponent-cost-${index}`} className="cost-icon" />
          ))}
        </div>

        <div className="card-zone my-zone">
          {myCardsInZone.length > 0 ? (
            myCardsInZone.map((card, index) => renderMyCard(card, true, index))
          ) : (
            <span>내 카드존</span>
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
            <div className="hp-bar-inner" style={{width: `${playerHP / 10}%`}}></div>
            <div className="hp-text">{playerHP}/1000</div>
          </div>
          <div>
            <button className="endturn-button" onClick={handleendturn}>턴끝</button>
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
    </div>
  )
}

export default BattlePage