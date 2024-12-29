import React, { useState } from 'react';
import './DeckPage.css';
import { useNavigate } from 'react-router-dom';
import fireTier1 from './assets/images/firetier1.png';
import fireTier2 from './assets/images/firetier2.png';
import fireTier3 from './assets/images/firetier3.png';
import fireTier4 from './assets/images/firetier4.png';
import fireTier5 from './assets/images/firetier5.png';
import fireTier6 from './assets/images/firetier6.png';

import waterTier1 from './assets/images/watertier1.png';
import waterTier2 from './assets/images/watertier2.png';
import waterTier3 from './assets/images/watertier3.png';
import waterTier4 from './assets/images/watertier4.png';
import waterTier5 from './assets/images/watertier5.png';
import waterTier6 from './assets/images/watertier6.png';

import forestTier1 from './assets/images/foresttier1.png';
import forestTier2 from './assets/images/foresttier2.png';
import forestTier3 from './assets/images/foresttier3.png';
import forestTier4 from './assets/images/foresttier4.png';
import forestTier5 from './assets/images/foresttier5.png';
import forestTier6 from './assets/images/foresttier6.png';

import legendTier1 from './assets/images/legendtier1.png';
import legendTier2 from './assets/images/legendtier2.png';
import legendTier3 from './assets/images/legendtier3.png';
import legendTier4 from './assets/images/legendtier4.png';
import legendTier5 from './assets/images/legendtier5.png';
import legendTier6 from './assets/images/legendtier6.png';

const DeckPage = () => {
  const [selectedCards, setSelectedCards] = useState([]);
  const maxSelectedCards = 8;
  const navigate = useNavigate();
  const cards = [
    fireTier1, fireTier2, fireTier3, fireTier4, fireTier5, fireTier6,
    waterTier1, waterTier2, waterTier3, waterTier4, waterTier5, waterTier6,
    forestTier1, forestTier2, forestTier3, forestTier4, forestTier5, forestTier6,
    legendTier1, legendTier2, legendTier3, legendTier4, legendTier5, legendTier6
  ];
  const handleMain = () => {
    navigate('/main');
  };
  const selectCard = (card) => {
    if (selectedCards.length >= maxSelectedCards || selectedCards.includes(card)) return;
    setSelectedCards([...selectedCards, card]);
  };

  const removeCard = (index) => {
    const updatedCards = [...selectedCards];
    updatedCards.splice(index, 1);
    setSelectedCards(updatedCards);
  };
  
  return (
    <div className="deck-page">
      <header className="deck-header">내 덱 설정</header>
      <button className="go-main" onClick={handleMain}>메인페이지</button>

      <div className="selected-cards-container">
        <div className="selected-cards">
          {Array.from({ length: maxSelectedCards }, (_, index) => (
            <div
              key={index}
              className="selected-card"
              onClick={() => removeCard(index)}
            >
              {selectedCards[index] ? (
                <img src={selectedCards[index]} alt={`Selected ${index}`} />
              ) : (
                `카드 ${index + 1}`
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="card-list">
        {cards.map((card, index) => (
          <div
            key={index}
            className={`card ${selectedCards.includes(card) ? 'disabled' : ''}`}
            onClick={() => selectCard(card)}
          >
            <img src={card} alt={`Card ${index}`} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeckPage;
