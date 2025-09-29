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

  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const user = userStr ? JSON.parse(userStr) : null;

  // 유저 카드 & 기존 덱 가져오기
  useEffect(() => {
    const fetchUserCards = async () => {
      if (!user?._id || !token) return;
      try {
        const res = await axios.get(`${API_URL}/usercard/${user._id}/cards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUserCards(res.data.userCards);
      } catch (err) {
        console.error("유저 카드 정보 불러오기 실패:", err);
      }
    };

    const fetchUserDeck = async () => {
      if (!token) return;
      try {
        const res = await axios.get(`${API_URL}/userdeck`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.deck) {
          setSelectedCards(res.data.deck);
          onDeckChange(res.data.deck);
        }
      } catch (err) {
        console.error("덱 불러오기 실패:", err);
      }
    };

    fetchUserCards();
    fetchUserDeck();
  }, []);

  // 카드 선택
  const selectCard = (cardId: string) => {
    if (selectedCards.length >= maxSelectedCards) return;
    const card = userCards.find((c) => c.cardId === cardId);
    if (!card || card.count <= 0) return;

    const newDeck = [...selectedCards, cardId];
    setSelectedCards(newDeck);
    onDeckChange(newDeck);

    setUserCards((prev) => prev.map((c) => (c.cardId === cardId ? { ...c, count: c.count - 1 } : c)));
  };

  // 카드 제거
  const removeCard = (index: number) => {
    const removedCardId = selectedCards[index];
    const newDeck = selectedCards.filter((_, i) => i !== index);
    setSelectedCards(newDeck);
    onDeckChange(newDeck);

    if (removedCardId) {
      setUserCards((prev) => prev.map((c) => (c.cardId === removedCardId ? { ...c, count: c.count + 1 } : c)));
    }
  };

  // 새 덱 생성
  const createNewDeck = () => {
    setSelectedCards([]);
    onDeckChange([]);
  };

  // 덱 저장
  const saveDeck = async () => {
    if (!token) return;
    try {
      await axios.post(`${API_URL}/userdeck/save`, { deck: selectedCards }, { headers: { Authorization: `Bearer ${token}` } });
      alert("덱 저장 완료!");
    } catch (err) {
      console.error("덱 저장 실패:", err);
      alert("덱 저장 실패");
    }
  };

  return (
    <div className="deck-page">
      <div className="navigation-section">
        <button className="nav-button" onClick={() => navigate("/main")}>
          메인페이지
        </button>
        <div className="deck-header-image" />
        <button className="nav-button" onClick={() => navigate("/store")}>
          상점페이지
        </button>
      </div>

      <div style={{ margin: "1rem" }}>
        <button className="nav-button" onClick={createNewDeck} style={{ marginRight: "1rem" }}>
          새 덱 생성
        </button>
        <button className="nav-button" onClick={saveDeck}>
          덱 저장
        </button>
      </div>

      {/* 선택 카드 영역: 항상 30칸 */}
      <div className="selected-cards-container">
        <div className="selected-cards">
          {Array.from({ length: maxSelectedCards }).map((_, index) => {
            const cardId = selectedCards[index];
            const card = userCards.find((c) => c.cardId === cardId);

            return (
              <div key={index} className="selected-card" onClick={() => cardId && removeCard(index)}>
                {card ? (
                  <img src={`${IMAGE_URL}/images/${card.image}`} alt={card.name} />
                ) : (
                  <img src={`${IMAGE_URL}/images/default.png`} alt={`카드 ${index + 1}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 유저 카드 목록 */}
      <div className="card-list">
        {userCards.map((card) => (
          <div key={card.cardId} className={`card ${card.count <= 0 ? "unowned" : ""}`} onClick={() => selectCard(card.cardId)}>
            <img src={`${IMAGE_URL}/images/${card.image}`} alt={card.name} className={card.count <= 0 ? "grayscale" : ""} />
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
