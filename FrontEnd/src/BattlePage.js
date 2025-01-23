import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BattlePage.css';
import defaultImage from './assets/images/default.png'

function BattlePage({selectedDeck}) {
  const [turn, setTurn] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myCardsInZone, setMyCardsInZone] = useState([]);
  const [remainingCards, setRemainingCards] = useState(selectedDeck || []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 0) {
          clearInterval(timer);
          setTurn((prevTurn) => prevTurn + 1);
          return 30;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [turn]);

  
 const handleCardClick = (card, fromZone) => {
    if (fromZone) {
      setMyCardsInZone(myCardsInZone.filter((_,c) => c !== card));
      setRemainingCards([...remainingCards, card]);
    } else {
      setRemainingCards(remainingCards.filter((c) => c !== card));
      setMyCardsInZone([...myCardsInZone, card]);
    }
  };

  const renderMyCard = (card, fromZone, index) => (
    <div key={`${card}-${index}`} className="card-slot">
      <div
        className={`my-card ${fromZone ? 'in-zone' : ''}`}
        onClick={() => handleCardClick(card, fromZone)}
      >
        <div className="card-front">
          <img src={card || "/placeholder.svg"} alt="My Card" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="battle-container">
      <div className="game-info">
        <div className="turn-indicator">Turn: {turn}</div>
        <div className="timer">Time: {timeLeft}s</div>
      </div>

      <div className="player-section enemy-section">
        <div className="opponent-area">
          <div className="enemy-avatar" />
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
        <div className="card-zone opponent-zone">
          <span>상대방 카드존</span>
        </div>
      </div>

      <div className="player-section my-section">
        <div className="card-zone my-zone">
          {myCardsInZone.length > 0 ? (
            myCardsInZone.map((card, index) => renderMyCard(card, true, index))
          ) : (
            <span>내 카드존</span>
          )}
        </div>

        <div className="my-area">
          <div className="player-info">
            <div className="player-avatar" />
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
          </div>
          <div className="cards-row">
            {remainingCards.map((card, index) => renderMyCard(card, false, index))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BattlePage;

