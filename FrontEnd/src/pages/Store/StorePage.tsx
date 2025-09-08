// StorePage.tsx
import React, { useState, useEffect } from "react";
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
import { useUser, CardPack } from "../../context/UserContext";
import axiosInstance from "../../utils/axiosInstance";

function StorePage() {
  const navigate = useNavigate();
  const { userInfo, setUserInfo, addCardsToInventory } = useUser();

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  // 카드팩 정보
  const cards: {
    image: string;
    name: string;
    price: number;
    packImage: string;
    type: "B" | "A" | "S";
  }[] = [
    {
      image: bCard,
      name: "B급 카드팩",
      price: 100,
      packImage: bCard,
      type: "B",
    },
    {
      image: aCard,
      name: "A급 카드팩",
      price: 300,
      packImage: aCard,
      type: "A",
    },
    {
      image: sCard,
      name: "S급 카드팩",
      price: 500,
      packImage: sCard,
      type: "S",
    },
  ];

  // 카드팩 구매 처리
  const handleBuyCard = async (index: number) => {
    if (!userInfo) return;

    const selectedCard = cards[index];

    // 💰 UI에서 즉시 돈 차감 (실패 시 롤백)
    setUserInfo((prev) =>
      prev ? { ...prev, money: prev.money - selectedCard.price } : prev
    );

    try {
      // ✅ 카드팩 구매 요청 (JWT 포함)
      const res = await axiosInstance.post("/store/buy", {
        cardType: selectedCard.name,
      });

      // 서버에서 뽑힌 카드 가져오기
      const drawnCards: { userPackId: string }[] = res.data.drawnCards;

      // 카드팩 Context에 추가
      drawnCards.forEach((card) => {
        // 서버에서 카드팩 종류를 기반으로 type 지정
        const type: "B" | "A" | "S" = selectedCard.type;

        const newCardPack: CardPack = {
          id: card.userPackId,
          name: selectedCard.name,
          packImage: selectedCard.packImage,
          isOpened: false,
          type,
        };
        addCardsToInventory(newCardPack);
      });

      // 서버 반영된 최신 돈으로 업데이트
      setUserInfo((prev) => (prev ? { ...prev, money: res.data.money } : prev));

      setMessage(`${selectedCard.name} 구매 완료!`);
      setShowMessage(true);
    } catch (err: any) {
      // 구매 실패 시 메시지 출력
      setMessage(
        err.response?.data?.message || "구매 실패! 잔액 부족 또는 서버 오류"
      );
      setShowMessage(true);
      console.error(err);

      // 실패 시 UI 돈 되돌리기
      setUserInfo((prev) =>
        prev ? { ...prev, money: prev.money + selectedCard.price } : prev
      );
    }
  };

  // 메시지 닫기
  const closeMessage = () => {
    setShowMessage(false);
    setMessage("");
  };

  // ✅ 치트키: c 누르면 돈 10000 증가 (개발용)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === "c") {
        if (!userInfo) return;
        try {
          const res = await axiosInstance.post("/user/add-money", {
            amount: 10000,
          });
          setUserInfo((prev) =>
            prev ? { ...prev, money: res.data.money } : prev
          );
        } catch (err) {
          console.error("치트키 적용 오류:", err);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userInfo, setUserInfo]);

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
            <img
              src={card.image}
              alt={card.name}
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
