// src/pages/deck/DeckPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./DeckPage.css";
import MessageBox from "../../components/common/MessageBox";

interface DeckPageProps {
  onDeckChange: (deck: string[]) => void;
  selectedDeck: string[];
}

interface UserCardDTO {
  _id?: string; // ✅ DB에서 온 카드 ObjectId
  id?: string; // ✅ 안전용
  cardId: string;
  name: string;
  cardType?: string; // ✅ 타입 추가
  attack: number;
  hp: number;
  tier: number;
  image: string;
  image2D?: string; // ✅ 서버 이미지 필드
  count: number;
  cost?: number;
}

const DeckPage: React.FC<DeckPageProps> = ({ onDeckChange }) => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [userCards, setUserCards] = useState<UserCardDTO[]>([]);
  const [allUserCards, setAllUserCards] = useState<UserCardDTO[]>([]);
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const maxSelectedCards = 30;
  const API_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api";
  const IMAGE_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app";

  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const user = userStr ? JSON.parse(userStr) : null;

  // ✅ 유저 카드 + 덱 불러오기
  useEffect(() => {
    if (!user?._id || !token) return;

    // ✅ 유저 카드 불러오기
    const fetchUserCards = async (): Promise<UserCardDTO[]> => {
      try {
        const res = await axios.get(`${API_URL}/usercard/${user._id}/cards`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const normalized = res.data.userCards.map((c: any) => ({
          _id: c._id ?? c.cardId, // ✅ DB ID 보존
          cardId: c.cardId ?? c._id, // ✅ fallback
          name: c.cardName ?? c.name,
          cardType: c.cardType ?? "normal",
          attack: c.attack ?? 0,
          hp: c.hp ?? 0,
          tier: c.tier ?? 1,
          cost: c.cost ?? c.tier ?? 1,
          image: c.image2D ?? c.image,
          image2D: c.image2D ?? c.image,
          count: c.count ?? 1,
        }));
        console.log("💾 userCards loaded:", normalized);
        setUserCards(normalized);
        setAllUserCards(normalized);
        return normalized;
      } catch (err) {
        console.error("유저 카드 정보 불러오기 실패:", err);
        return [];
      }
    };

    // ✅ 덱 불러오기
    const fetchUserDeck = async (cardsFromUser: UserCardDTO[]) => {
      try {
        const res = await axios.get(`${API_URL}/userdeck/single`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.data.deck) {
          const deckCards: UserCardDTO[] = res.data.deck.cards.map((c: any) => ({
            ...c,
            image: c.image2D || c.image || `${c.cardType ?? "fire"}Tier${c.tier ?? 1}.png`,
          }));

          const deckCardIds = deckCards.map((c) => c.id || c.cardId);
          setSelectedCards(deckCardIds);
          onDeckChange(deckCardIds);

          const updatedUserCards = cardsFromUser.map((c) => {
            const selectedCount = deckCardIds.filter((id) => id === c.cardId).length;
            return { ...c, count: c.count - selectedCount };
          });
          setUserCards(updatedUserCards);
        }
      } catch (err) {
        console.error("덱 불러오기 실패:", err);
      }
    };

    fetchUserCards().then((cardsFromUser) => {
      if (cardsFromUser.length > 0) {
        fetchUserDeck(cardsFromUser);
      }
    });
  }, []);

  // ✅ 카드 선택
  const selectCard = (cardId: string) => {
    const card = userCards.find((c) => c.cardId === cardId);
    if (!card || card.count <= 0) return;
    if (selectedCards.length >= maxSelectedCards) return;

    const newDeck = [...selectedCards, cardId];
    setSelectedCards(newDeck);
    onDeckChange(newDeck);

    setUserCards((prev) => prev.map((c) => (c.cardId === cardId ? { ...c, count: c.count - 1 } : c)));
  };

  // ✅ 카드 제거
  const removeCard = (index: number) => {
    const removedCardId = selectedCards[index];
    if (!removedCardId) return;

    const newDeck = selectedCards.filter((_, i) => i !== index);
    setSelectedCards(newDeck);
    onDeckChange(newDeck);

    setUserCards((prev) => prev.map((c) => (c.cardId === removedCardId ? { ...c, count: c.count + 1 } : c)));
  };

  // ✅ 새 덱 생성
  const createNewDeck = () => {
    setSelectedCards([]);
    onDeckChange([]);
    setUserCards(allUserCards);
  };

  // ✅ 덱 저장
  const saveDeck = async () => {
    if (!token) return;

    // 🔥 덱에 포함된 카드의 상세정보를 전부 포함하도록 수정
    const formattedDeck = selectedCards
      .map((cardId) => {
        const card = allUserCards.find((c) => c.cardId === cardId);
        if (!card) return null;

        return {
          id: card._id,
          name: card.name,
          cardType: card.cardType,
          attack: card.attack ?? 0,
          hp: card.hp ?? 0,
          maxhp: card.hp ?? 0,
          cost: card.cost ?? card.tier ?? 1,
          tier: card.tier ?? 1,
          // ✅ image2D 필드 유지
          image2D: card.image2D || card.image,

          // ✅ 백업용 image (optional)
          image: card.image,
        };
      })
      .filter(Boolean);

    try {
      await axios.post(
        `${API_URL}/userdeck/single/save`,
        { cards: formattedDeck }, // ✅ 카드 전체 데이터로 전송
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("🔥 formattedDeck before save:", formattedDeck);
      setMessage("덱 저장 완료!");
      setShowMessage(true);
    } catch (err) {
      console.error("덱 저장 실패:", err);
      setMessage("덱 저장 실패");
      setShowMessage(true);
    }
  };

  return (
    <div className="deck-page">
      {/* 상단 네비게이션 */}
      <div className="navigation-section">
        <button className="nav-button" onClick={() => navigate("/main")}>
          메인페이지
        </button>
        <div className="deck-header-image" />
        <button className="nav-button" onClick={() => navigate("/store")}>
          상점페이지
        </button>
      </div>

      {/* 버튼 영역 */}
      {/* <div style={{ margin: "1rem" }}>
        <button className="nav-button" onClick={createNewDeck} style={{ marginRight: "1rem" }}>
          새 덱 생성
        </button>
        <button className="nav-button" onClick={saveDeck}>
          덱 저장
        </button>
      </div> */}

      <div className="sticky-deck-row">
        <div className="button-deck-sidebar">
          {/* 버튼 영역 */}
          <div style={{ margin: "1rem" }}>
            <button className="deck-new-button" onClick={createNewDeck} style={{ marginRight: "1rem" }}>
              new
            </button>
            <button className="deck-save-button" onClick={saveDeck}>
              save
            </button>
          </div>
        </div>
        <div className="selected-cards-container">
          <div className="selected-cards">
            {Array.from({ length: maxSelectedCards }).map((_, index) => {
              const cardId = selectedCards[index];
              const card = userCards.find((c) => c.cardId === cardId);

              return (
                <div key={index} className="selected-card" onClick={() => cardId && removeCard(index)}>
                  <img
                    src={
                      card
                        ? card.image.startsWith("http")
                          ? card.image
                          : `${IMAGE_URL}/images/${card.image}`
                        : `${IMAGE_URL}/images/default.png`
                    }
                    alt={card?.name || `카드 ${index + 1}`}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {showMessage && (
        <MessageBox bgColor="#e3f2fd" borderColor="#2196f3" textColor="#0d47a1" onClose={() => setShowMessage(false)}>
          {message}
        </MessageBox>
      )}

      {/* 보유 카드 목록 */}
      <div className="card-list">
        {userCards.map((card) => (
          <div key={card.cardId} className={`card ${card.count <= 0 ? "unowned" : ""}`} onClick={() => selectCard(card.cardId)}>
            <img
              src={card.image.startsWith("http") ? card.image : `${IMAGE_URL}/images/${card.image}`}
              alt={card.name}
              className={card.count <= 0 ? "grayscale" : ""}
            />
            <div className="card-info">
              <p className="card-name">{card.name}</p>
              <p>공격력: {card.attack}</p>
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
