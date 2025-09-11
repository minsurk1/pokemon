import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StorePage.css";
import { MdInventory } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import MessageBox from "../../components/common/MessageBox";
import bCard from "../../assets/images/b_card.png";
import aCard from "../../assets/images/a_card.png";
import sCard from "../../assets/images/s_card.png";
import BackgroundVideo from "../../components/common/global";
import storeVideo from "../../assets/videos/storevideo.mp4";
import { useUser, CardPackType } from "../../context/UserContext";

function StorePage() {
  const navigate = useNavigate();
  const { userInfo, setUserInfo, buyCardPack } = useUser();

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // 카드팩 목록
  const cards: {
    image: string;
    name: string;
    price: number;
    type: CardPackType;
  }[] = [
    { image: bCard, name: "B급 카드팩", price: 100, type: "B" },
    { image: aCard, name: "A급 카드팩", price: 300, type: "A" },
    { image: sCard, name: "S급 카드팩", price: 500, type: "S" },
  ];

  const handleBuyCard = async (index: number) => {
    if (!userInfo) return;
    const selectedCard = cards[index];

    try {
      // packType 전달, 서버에서 최신 유저 정보 반환
      const updatedUser = await buyCardPack(selectedCard.type);
      setUserInfo(updatedUser); // 최신 유저 정보 반영
      setMessage(`${selectedCard.name} 구매 완료!`);
      setShowMessage(true);
    } catch (err: any) {
      setMessage(err.message || "구매 실패");
      setShowMessage(true);
    }
  };

  const closeMessage = () => {
    setShowMessage(false);
    setMessage("");
  };

  return (
    <div className="store-container">
      <BackgroundVideo
        src={storeVideo}
        opacity={1}
        zIndex={-1}
        objectPosition="center top"
      />

      {showMessage && (
        <MessageBox
          bgColor="#e3f2fd"
          borderColor="#2196f3"
          textColor="#0d47a1"
          onClose={closeMessage}
        >
          {message}
        </MessageBox>
      )}

      <div className="store-header">
        <div className="store-currency">
          {userInfo
            ? `${userInfo.nickname} - 보유 재화: ${userInfo.money} G`
            : "로딩 중..."}
        </div>
        <div>
          <button
            className="inventory-button"
            onClick={() => navigate("/inventory")}
          >
            인벤토리 <MdInventory />
          </button>
          <button className="main-button" onClick={() => navigate("/main")}>
            메인페이지 <FaHome />
          </button>
        </div>
      </div>

      <div className="store-card-container">
        {cards.map((card, index) => (
          <div key={index} className="store-card">
            <img src={card.image} alt={card.name} className="store-card-image" />
            <p>{card.name} - {card.price} G</p>
            <button className="buy-button" onClick={() => handleBuyCard(index)}>
              구매하기
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StorePage;
