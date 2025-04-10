import React, { useState } from "react";
import "./Dex.css";
import { useNavigate } from "react-router-dom";
import fireimage from "./assets/images/fire.png";
import waterimage from "./assets/images/water.png";
import forestimage from "./assets/images/forest.png";
import wormimage from "./assets/images/worm.png";
import landimage from "./assets/images/land.png";
import poisonimage from "./assets/images/poison.png";
import normalimage from "./assets/images/normal.png";
import iceimage from "./assets/images/ice.png";
import electricimage from "./assets/images/electric.png";
import esperimage from "./assets/images/esper.png";
import legendimage from "./assets/images/legend.png";
import sCard from "./assets/images/s_card.png";
import aCard from "./assets/images/a_card.png";
import bCard from "./assets/images/b_card.png";
import type { Card } from "./Inventory";

function Dex() {
  const navigate = useNavigate();

  const handleMain = (): void => {
    navigate("/main");
  };

  const icons = [
    { src: fireimage, alt: "불" },
    { src: waterimage, alt: "물" },
    { src: forestimage, alt: "숲" },
    { src: wormimage, alt: "벌레" },
    { src: landimage, alt: "땅" },
    { src: poisonimage, alt: "독" },
    { src: normalimage, alt: "노멀" },
    { src: iceimage, alt: "얼음" },
    { src: electricimage, alt: "전기" },
    { src: esperimage, alt: "에스퍼" },
    { src: legendimage, alt: "전설" },
  ];

  const [cards] = useState<Card[]>([
    { image: bCard, name: "B급 카드팩", price: 100, packImage: bCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard },
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard },
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard },
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard },
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
  ]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const cardsPerPage = 3;

  const handleNext = () => {
    if (currentIndex + cardsPerPage < cards.length) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };
  
  const visibleCards = cards.slice(currentIndex, currentIndex + 3);

  return (
    <div className="dex-page">
      <div className="dex-header">
        {icons.map((icon, index) => (
          <img
            key={index}
            src={icon.src}
            alt={icon.alt}
            className="header-icon"
          />
        ))}
        <button onClick={handleMain}>메인페이지</button>
      </div>

      <div className="dex-container">
        <div className="dex-card-container">
        <button className="card-nav-button" onClick={handlePrev} disabled={currentIndex === 0}>◀</button>
          {visibleCards.map((card, index) => (
            <div key={index} className="store-card">
              <img
                src={card.image || "/placeholder.svg"}
                alt={`Card ${currentIndex + index + 1}`}
                className="store-card-image"
              />
              <p>{card.name} - {card.price} G</p>
            </div>
          ))}
           <button className="card-nav-button" onClick={handleNext} disabled={currentIndex + cardsPerPage >= cards.length}>▶</button>
        </div>
      </div>
    </div>
  );
}

export default Dex;
