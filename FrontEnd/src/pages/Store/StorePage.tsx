import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StorePage.css";
import BackgroundVideo from "../../components/common/global";
import storeVideo from "../../assets/videos/storevideo.mp4";
import bCard from "../../assets/images/b_card.png";
import aCard from "../../assets/images/a_card.png";
import sCard from "../../assets/images/s_card.png";
import MessageBox from "../../components/common/MessageBox"

import { useUser, CardPackType } from "../../context/UserContext";

function StorePage() {
  const navigate = useNavigate(); 
  const { userInfo, buyCardPack } = useUser();
  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const closeMessage = () => {
    setShowMessage(false);
    setMessage("");
  };

  const cards: { image: string; name: string; price: number; type: CardPackType }[] = [
    { image: bCard, name: "B급 카드팩", price: 100, type: "B" },
    { image: aCard, name: "A급 카드팩", price: 300, type: "A" },
    { image: sCard, name: "S급 카드팩", price: 500, type: "S" },
  ];

  const handleBuy = async (type: CardPackType, name: string) => {
    try {
      await buyCardPack(type);
      setMessage(`${name} 구매 완료!`);
      setShowMessage(true);
    } catch (err: any) {
      setMessage(err.message || "구매 실패");
      setShowMessage(true);
    }
    setTimeout(() => {
      setMessage("");
      setShowMessage(false);
  }, 2000);
  };

  return (
    
    <div className="store-container">
      
      <BackgroundVideo src={storeVideo} opacity={1} zIndex={-1} objectPosition="center top" />

      <div className="store-header">
        <div className="store-currency">
          {userInfo ? `${userInfo.nickname}님 - ${userInfo.money}G` : "로딩 중..."}
        </div>
        <div>
          <button className="inventory-button" onClick={() => navigate("/inventory")}>
            인벤토리
          </button>
          <button className="main-button" onClick={() => navigate("/main")}>
            메인페이지
          </button>
        </div>
      </div>
 
{/*      {message && <div className="store-message">{message}</div>} */}

      <div className="store-card-container">
        {cards.map((card, i) => (
          <div key={i} className="store-card">
            <img src={card.image} alt={card.name} className="store-card-image" />
            <p>{card.name} - {card.price}G</p>
            <button className="buy-button" onClick={() => handleBuy(card.type, card.name)}>
              구매
            </button>
          </div>
        ))}
      </div>
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
    </div>
  );
}

export default StorePage;
