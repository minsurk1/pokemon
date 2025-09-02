// StorePage.tsx: 유저 정보와 카드 구매를 Context로 관리하는 상점 페이지

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./StorePage.css";
import { MdInventory } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import MessageBox from "../../components/common/MessageBox";
import bCard from "../../assets/images/b_card.png";
import aCard from "../../assets/images/a_card.png";
import sCard from "../../assets/images/s_card.png";
import type { Card, CardPack } from "../Inventory/Inventory";
import BackgroundVideo from "../../components/common/global";
import storeVideo from "../../assets/videos/storevideo.mp4";
import axios from "axios";
import { useUser } from "../../context/UserContext";

function StorePage() {
  const navigate = useNavigate();
  const { userInfo, addCardsToInventory, refreshUser } = useUser(); // Context에서 가져오기

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const cards: Card[] = [
    { image: bCard, name: "B급 카드팩", price: 100, packImage: bCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard },
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
  ];

  // 카드 구매 - 서버 요청 및 Context 갱신
  const handleBuyCard = async (index: number) => {
    if (!userInfo) return;
    const selectedCard = cards[index];

    try {
      // 서버 요청
      await axios.post(
        "/api/store/buy",
        { cardType: selectedCard.name },
        { withCredentials: true }
      );

      // 카드팩을 Context에 추가
      const type: "B" | "A" | "S" = selectedCard.name.includes("S급")
        ? "S"
        : selectedCard.name.includes("A급")
        ? "A"
        : "B";

      const newCardPack: CardPack = {
        name: selectedCard.name,
        packImage: selectedCard.packImage,
        isOpened: false,
        type,
      };

      addCardsToInventory(newCardPack); // Context 반영

      // 최신 유저 정보 갱신 (돈 등)
      await refreshUser();

      setMessage(`${selectedCard.name} 카드팩을 구매했습니다!`);
      setShowMessage(true);
    } catch (err: any) {
      setMessage("구매 실패! 잔액 부족 또는 서버 오류");
      setShowMessage(true);
      console.error(err);
    }
  };

  const closeMessage = (): void => {
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
          closeborderColor="black"
        >
          {message}
        </MessageBox>
      )}

      <div className="store-header">
        <div className="store-currency">
          {userInfo
            ? `${userInfo.nickname} 님 - 보유 재화: ${userInfo.money} G`
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
            <img
              src={card.image || "/placeholder.svg"}
              alt={`Card ${index + 1}`}
              className="store-card-image"
            />
            <p>
              {card.name} - {card.price} G
            </p>
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
