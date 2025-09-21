// src/pages/store/StorePage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./StorePage.css";
import { MdInventory } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import MessageBox from "../../components/common/MessageBox";
import BackgroundVideo from "../../components/common/global";
import storeVideo from "../../assets/videos/storevideo.mp4";
import { useUser, CardPackType } from "../../context/UserContext";

interface CardPackData {
  _id: string;
  name: string;
  price: number;
  type: CardPackType;
  image: string;
}

function StorePage() {
  const navigate = useNavigate();
  const { userInfo, setUserInfo, buyCardPack } = useUser();

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);
  const [cardPacks, setCardPacks] = useState<CardPackData[]>([]);

  const API_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/"; // CRA 환경에서 사용

  // 서버에서 카드팩 목록 fetch
  const fetchCardPacks = async () => {
    try {
      const res = await fetch(`${API_URL}/card-packs`);
      if (!res.ok) throw new Error("카드팩 목록 로드 실패");
      const data = await res.json();
      if (data?.packs) setCardPacks(data.packs);
    } catch (err) {
      console.error("카드팩 목록 fetch 실패:", err);
    }
  };

  useEffect(() => {
    fetchCardPacks();
  }, []);

  const handleBuyCard = async (packType: CardPackType) => {
    if (!userInfo) return;

    try {
      const updatedUser = await buyCardPack(packType); // 서버에서 최신 유저 정보 반환
      setUserInfo(updatedUser); // 최신 유저 정보 반영
      const packName = cardPacks.find((p) => p.type === packType)?.name || "";
      setMessage(`${packName} 구매 완료!`);
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
        {cardPacks.length > 0 ? (
          cardPacks.map((card) => (
            <div key={card._id} className="store-card">
              <img
                src={card.image}
                alt={card.name}
                className="store-card-image"
              />
              <p>{card.name} - {card.price} G</p>
              <button
                className="buy-button"
                onClick={() => handleBuyCard(card.type)}
              >
                구매하기
              </button>
            </div>
          ))
        ) : (
          <p>카드팩 정보를 불러오는 중...</p>
        )}
      </div>
    </div>
  );
}

export default StorePage;
