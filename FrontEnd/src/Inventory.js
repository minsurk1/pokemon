import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Inventory.css';

function Inventory({ inventory, setInventory }) {
  const [showModal, setShowModal] = useState(false);
  const [openedCards, setOpenedCards] = useState([]);

  const cardsData = [
    { name: "파이리", tier: 1, image: require('./assets/images/firetier1.png') },
    { name: "포니타", tier: 2, image: require('./assets/images/firetier2.png') },
    { name: "부스터", tier: 3, image: require('./assets/images/firetier3.png') },
    { name: "윈디", tier: 4, image: require('./assets/images/firetier4.png') },
    { name: "초염몽", tier: 5, image: require('./assets/images/firetier5.png') },
    { name: "리자몽", tier: 6, image: require('./assets/images/firetier6.png') },
    { name: "꼬부기", tier: 1, image: require('./assets/images/watertier1.png') },
    { name: "고라파덕", tier: 2, image: require('./assets/images/watertier2.png') },
    { name: "샤미드", tier: 3, image: require('./assets/images/watertier3.png') },
    { name: "라프라스", tier: 4, image: require('./assets/images/watertier4.png') },
    { name: "갸라도스", tier: 5, image: require('./assets/images/watertier5.png') },
    { name: "거북왕", tier: 6, image: require('./assets/images/watertier6.png') },
    { name: "이상해씨", tier: 1, image: require('./assets/images/foresttier1.png') },
    { name: "모다피", tier: 2, image: require('./assets/images/foresttier2.png') },
    { name: "리피아", tier: 3, image: require('./assets/images/foresttier3.png') },
    { name: "나시", tier: 4, image: require('./assets/images/foresttier4.png') },
    { name: "세레비", tier: 5, image: require('./assets/images/foresttier5.png') },
    { name: "이상해꽃", tier: 6, image: require('./assets/images/foresttier6.png') },
    { name: "디아루가", tier: 7, image: require('./assets/images/legendtier1.png') },
    { name: "펄기아", tier: 7, image: require('./assets/images/legendtier2.png') },
    { name: "기라티나", tier: 7, image: require('./assets/images/legendtier3.png') },
    { name: "뮤츠", tier: 7, image: require('./assets/images/legendtier4.png') },
    { name: "뮤", tier: 7, image: require('./assets/images/legendtier5.png') },
    { name: "아르세우스", tier: 7, image: require('./assets/images/legendtier6.png') }
  ];

  const drawCards = (cardPack) => {
    const drawnCards = [];
    const packCards = cardsData;

    const probabilities = {
      1: 0.27,
      2: 0.22,
      3: 0.20,
      4: 0.15,
      5: 0.10,
      6: 0.05,
      7: 0.01
    };

    for (let i = 0; i < 5; i++) {
      const randomTier = getRandomTier(probabilities);
      const randomCard = getRandomCardFromTier(randomTier, packCards);
      drawnCards.push(randomCard);
    }
    return drawnCards;
  };

  const getRandomTier = (probabilities) => {
    const rand = Math.random();
    let cumulativeProb = 0;

    for (let tier = 1; tier <= 7; tier++) {
      cumulativeProb += probabilities[tier];
      if (rand <= cumulativeProb) {
        return tier;
      }
    }
  };

  const getRandomCardFromTier = (tier, packCards) => {
    const tierCards = packCards.filter(card => card.tier === tier);
    const randomIndex = Math.floor(Math.random() * tierCards.length);
    return tierCards[randomIndex];
  };

  const openCardPack = (index) => {
    const cardPack = inventory[index];
    const newCards = drawCards(cardPack);
    setOpenedCards(newCards);
    setShowModal(true);

    // Remove the opened card pack from the inventory
    setInventory(prevInventory => {
      const newInventory = [...prevInventory];
      newInventory.splice(index, 1);
      return newInventory;
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setOpenedCards([]);
  };

  return (
    <div className="inventory-page">
      <h2>내 인벤토리</h2>
      {inventory && inventory.length === 0 ? (
        <div className="inventory-empty">구매한 카드팩이 없습니다.</div>
      ) : (
        <div className="inventory-list">
          {inventory && inventory.map((cardPack, index) => (
            <div key={index} className="inventory-item">
              <div className="card-pack">
                <img src={cardPack.packImage} alt={cardPack.name} className="card-pack-image" />
                <p>{cardPack.name}</p>
                <button className="open-button" onClick={() => openCardPack(index)}>
                  카드팩 개봉
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-card-message">
              새로운 카드가 나왔습니다!
            </div>
            <div className="modal-cards">
              {openedCards.map((card, index) => (
                <div key={index} className="modal-card">
                  <img src={card.image} alt={card.name} className="modal-card-image" />
                  <p>{card.name}</p>
                </div>
              ))}
            </div>
            <button className="close-modal" onClick={closeModal}>X</button>
          </div>
        </div>
      )}

      <Link to="/store" className="back-button">상점으로 돌아가기</Link>
    </div>
  );
}

export default Inventory;