import React, { useState, useEffect } from 'react';
import './BattlePage.css';

const myDeck = [
  './assets/images/legendtier6.png',
  './assets/images/legendtier5.png',
  './assets/images/legendtier4.png',
  './assets/images/legendtier3.png'
];

export default function BattlePage() {
  const [turn, setTurn] = useState(1);
  const [timeLeft, setTimeLeft] = useState(30);
  const [myCardsInZone, setMyCardsInZone] = useState([]); // 카드존의 카드들
  const [remainingCards, setRemainingCards] = useState(myDeck); // 남은 카드들

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
      // 카드존에서 클릭 -> 원래 자리로 이동
      setMyCardsInZone(myCardsInZone.filter((c) => c !== card));
      setRemainingCards([...remainingCards, card]);
    } else {
      // 남은 카드에서 클릭 -> 카드존으로 이동
      setRemainingCards(remainingCards.filter((c) => c !== card));
      setMyCardsInZone([...myCardsInZone, card]);
    }
  };

  const renderMyCard = (card, fromZone) => (
    <div
      key={card}
      className={`card my-card ${fromZone ? 'in-zone' : ''}`} // 카드존 스타일 추가
      onClick={() => handleCardClick(card, fromZone)}
    >
      <div className="card-front">
        <img src={card} alt="My Card" />
      </div>
    </div>
  );

  return (
    <div className="battle-container">
      <div className="game-info">
        <div className="turn-indicator">Turn: {turn}</div>
        <div className="timer">Time: {timeLeft}s</div>
      </div>

      {/* 상대방 영역 */}
      <div className="player-section opponent">
        <div className="opponent-area">
          <div className="player-avatar" />
          <div className="cards-row">
            {[...Array(8)].map((_, index) => (
              <div key={`opponent-card-${index}`} className="card-slot">
                <div className="card opponent-card">
                  <div className="card-back" />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-zone opponent-zone">
          <span>니 카드존</span>
        </div>
      </div>

      {/* 내 영역 */}
      <div className="player-section my-section">
        {/* 카드존 */}
        <div className="card-zone my-zone">
          {myCardsInZone.length > 0 ? (
            myCardsInZone.map((card) => renderMyCard(card, true))
          ) : (
            <span>내 카드존</span>
          )}
        </div>

        {/* 내 카드 */}
        <div className="my-area">
          <div className="cards-row">
            {remainingCards.map((card) => renderMyCard(card, false))}
          </div>
          <div className="player-info">
            <div className="player-avatar" />
            <div className="card-deck">
              {remainingCards.map((_, index) => (
                <div
                  key={`deck-card-${index}`}
                  className="deck-card"
                  style={{ right: `${index * 5}px`, bottom: `${index * 2}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}