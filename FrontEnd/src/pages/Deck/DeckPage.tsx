import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DeckPage.css";

interface DeckPageProps {
  onDeckChange: (deck: string[]) => void;
  selectedDeck: string[];
}

interface UserCardDTO {
  cardId: string;
  name: string;
  damage: number;
  hp: number;
  tier: number;
  image: string;
  count: number;
}

const DeckPage: React.FC<DeckPageProps> = ({ onDeckChange, selectedDeck }) => {
  const [selectedCards, setSelectedCards] = useState<string[]>(selectedDeck || []);
  const [userCards, setUserCards] = useState<UserCardDTO[]>([]);
  const navigate = useNavigate();
  const maxSelectedCards = 30;

  const API_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api";
  const IMAGE_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app";

  // ✅ 유저 카드 정보 가져오기 (JWT 인증 헤더 포함)
  useEffect(() => {
    const fetchUserCards = async () => {
      try {
        const userStr = localStorage.getItem("user");
        const token = localStorage.getItem("token");
        const user = userStr ? JSON.parse(userStr) : null;
        if (!user?._id || !token) return;

        const res = await axios.get(
          `${API_URL}/usercard/${user._id}/cards`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setUserCards(res.data.userCards);
      } catch (err) {
        console.error("유저 카드 정보 불러오기 실패:", err);
      }
    };

    fetchUserCards();
  }, []);

  // ✅ selectedCards 변경 시 부모에 안전하게 알리기
  useEffect(() => {
    onDeckChange(selectedCards);
  }, [selectedCards, onDeckChange]);

  // 카드 선택
  const selectCard = (cardId: string) => {
    if (selectedCards.length >= maxSelectedCards) return;
    const card = userCards.find((c) => c.cardId === cardId);
    if (!card || card.count <= 0) return;

    setSelectedCards((prev) => [...prev, cardId]);

    // 선택 시 수량 감소
    setUserCards((prev) =>
      prev.map((c) =>
        c.cardId === cardId ? { ...c, count: c.count - 1 } : c
      )
    );
  };

  // 카드 제거
  const removeCard = (index: number) => {
    const removedCardId = selectedCards[index];
    setSelectedCards((prev) => {
      const newDeck = [...prev];
      newDeck.splice(index, 1);
      return newDeck;
    });

    // 제거 시 수량 복원
    setUserCards((prev) =>
      prev.map((c) =>
        c.cardId === removedCardId ? { ...c, count: c.count + 1 } : c
      )
    );
  };

  const handleMain = () => navigate("/main");
  const handleStore = () => navigate("/store");

  return (
    <div className="deck-page">
      <div className="navigation-section">
        <button className="nav-button" onClick={handleMain}>
          메인페이지
        </button>
        <div className="deck-header-image" />
        <button className="nav-button" onClick={handleStore}>
          상점페이지
        </button>
      </div>

      <div className="selected-cards-container">
        <div className="selected-cards">
          {selectedCards.map((cardId, index) => {
            const card = userCards.find((c) => c.cardId === cardId);
            return (
              <div
                key={index}
                className="selected-card"
                onClick={() => removeCard(index)}
              >
                {card && <img src={`${IMAGE_URL}/images/${card.image}`} alt={card.name} />}
              </div>
            );
          })}
          {Array.from({ length: maxSelectedCards - selectedCards.length }, (_, i) => (
            <div key={`empty-${i}`} className="selected-card">
              카드 {selectedCards.length + i + 1}
            </div>
          ))}
        </div>
      </div>

      <div className="card-list">
        {userCards.map((card) => (
          <div
            key={card.cardId}
            className={`card ${card.count <= 0 ? "unowned" : ""}`}
            onClick={() => selectCard(card.cardId)}
          >
            <img src={`${IMAGE_URL}/images/${card.image}`} alt={card.name} />
            <div className="card-info">
              <p className="card-name">{card.name}</p>
              <p>공격력: {card.damage}</p>
              <p>HP: {card.hp}</p>
              <p>등급: {card.tier}</p>
              <p>보유 수량: {card.count}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeckPage;
