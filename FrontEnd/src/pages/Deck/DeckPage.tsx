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
  _id?: string;
  id?: string;
  cardId: string;
  name: string;
  cardType?: string;
  attack: number;
  hp: number;
  tier: number;
  image: string;
  image2D?: string;
  count: number;
  cost?: number;
}

interface DeckSaveCard {
  id: string;
  name: string;
  cardType: string;
  attack: number;
  hp: number;
  maxhp: number;
  cost: number;
  tier: number;
  image2D: string;
  image: string;
}

const DeckSmallStats: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div className="deck-small-stats">
      <span className={stats.tier8 > 2 ? "stat-bad" : ""}>전설: {stats.tier8}/2</span>
      <span className={stats.tier1_2 < 7 ? "stat-bad" : ""}>1~2티어: {stats.tier1_2}/7</span>
      <span className={stats.tier6_7 > 3 ? "stat-bad" : ""}>6~7티어: {stats.tier6_7}/3</span>
      <span className={stats.totalTier > 105 ? "stat-bad" : ""}>티어 합: {stats.totalTier}/105</span>
    </div>
  );
};

const DeckPage: React.FC<DeckPageProps> = ({ onDeckChange }) => {
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [userCards, setUserCards] = useState<UserCardDTO[]>([]);
  const [allUserCards, setAllUserCards] = useState<UserCardDTO[]>([]);
  const navigate = useNavigate();

  const [message, setMessage] = useState("");
  const [showMessage, setShowMessage] = useState(false);

  const [filterType, setFilterType] = useState("all");
  // ▼▼▼ [버그 수정] setFilterType -> setFilterCost로 변경 ▼▼▼
  const [filterCost, setFilterCost] = useState("all");
  // ▲▲▲ [버그 수정] setFilterType -> setFilterCost로 변경 ▲▲▲

  const maxSelectedCards = 30;
  const API_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api";
  const IMAGE_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app";

  const userStr = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  const user = userStr ? JSON.parse(userStr) : null;

  // ✅ 덱 검증 함수
  function validateDeck(cards: DeckSaveCard[]) {
    const totalTier = cards.reduce((sum, c) => sum + Number(c.tier ?? 1), 0);

    const tierCount: Record<number, number> = {};
    cards.forEach((c) => {
      const t = Number(c.tier ?? 1);
      tierCount[t] = (tierCount[t] || 0) + 1;
    });

    const tier1_2 = (tierCount[1] ?? 0) + (tierCount[2] ?? 0);
    const tier6_7 = (tierCount[6] ?? 0) + (tierCount[7] ?? 0);
    const tier8 = tierCount[8] ?? 0;

    const errors: string[] = [];

    if (cards.length < 12) errors.push("덱은 최소 12장이 필요합니다.");
    if (cards.length > 30) errors.push("덱은 최대 30장까지 가능합니다.");

    if (tier8 > 2) errors.push("8티어(전설)는 최대 2장까지 가능");
    if (tier1_2 < 7) errors.push("1~2티어는 최소 7장 필요");
    if (tier6_7 > 3) errors.push("6~7티어는 합쳐서 최대 3장까지 가능");
    if (totalTier > 105) errors.push(`총 티어 합계 초과: ${totalTier}/105`);

    return errors;
  }

  function getDeckStats(cards: DeckSaveCard[]) {
    const totalTier = cards.reduce((sum, c) => sum + Number(c.tier ?? 1), 0);

    const tierCount: Record<number, number> = {};
    cards.forEach((c) => {
      const t = Number(c.tier ?? 1);
      tierCount[t] = (tierCount[t] || 0) + 1;
    });

    return {
      totalTier,
      tier1_2: (tierCount[1] ?? 0) + (tierCount[2] ?? 0),
      tier6_7: (tierCount[6] ?? 0) + (tierCount[7] ?? 0),
      tier8: tierCount[8] ?? 0,
    };
  }

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
          _id: c._id ?? c.cardId,
          cardId: c.cardId ?? c._id,
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
            image: c.image2D || c.image || `${c.cardType ?? "normal"}Tier${c.tier ?? 1}.png`,
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

  const liveDeck: DeckSaveCard[] = selectedCards
    .map((cardId) => {
      const card = allUserCards.find((c) => c.cardId === cardId);
      if (!card) return null;
      return {
        id: card._id ?? card.cardId,
        name: card.name,
        cardType: card.cardType ?? "normal",
        attack: card.attack ?? 0,
        hp: card.hp ?? 0,
        maxhp: card.hp ?? 0,
        cost: card.cost ?? card.tier ?? 1,
        tier: card.tier ?? 1,
        image2D: card.image2D || card.image,
        image: card.image,
      };
    })
    .filter((c): c is DeckSaveCard => c !== null);

  const stats = getDeckStats(liveDeck);

  // ✅ 덱 저장
  const saveDeck = async () => {
    if (!token) return;

    const formattedDeck: DeckSaveCard[] = selectedCards
      .map((cardId) => {
        const card = allUserCards.find((c) => c.cardId === cardId);
        if (!card) return null;

        return {
          id: card._id ?? card.cardId,
          name: card.name,
          cardType: card.cardType ?? "normal",
          attack: card.attack ?? 0,
          hp: card.hp ?? 0,
          maxhp: card.hp ?? 0,
          cost: card.cost ?? card.tier ?? 1,
          tier: card.tier ?? 1,
          image2D: card.image2D || card.image,
          image: card.image,
        };
      })
      .filter((c): c is DeckSaveCard => c !== null);

    // ✅ 덱 검증 추가!
    const errors = validateDeck(formattedDeck);

    if (errors.length > 0) {
      setMessage(`덱 제한 위반:\n${errors.join("\n")}`);
      setShowMessage(true);
      return;
    }

    try {
      await axios.post(`${API_URL}/userdeck/single/save`, { cards: formattedDeck }, { headers: { Authorization: `Bearer ${token}` } });

      setMessage("덱 저장 완료!");
      setShowMessage(true);
    } catch (err: any) {
      console.error("덱 저장 실패:", err);
      setMessage(err.response?.data?.message || "덱 저장 실패");
      setShowMessage(true);
    }
  };

  return (
    // ▼▼▼ [수정 1] .deck-page가 배경을 갖도록 CSS에서 수정할 예정 ▼▼▼
    <div className="deck-page">
      {/* <div className="deck-header"/> */}

      <div className="navigation-section">
        <button className="nav-button" onClick={() => navigate("/main")}>
          메인페이지
        </button>
        <div className="deck-header-image" />
        <button className="nav-button" onClick={() => navigate("/store")}>
          상점페이지
        </button>
      </div>

      <div className="sticky-deck-row">
        <div className="deck-controls">
          <div className="button-group">
            <button className="deck-new-button" onClick={createNewDeck}>
              new
            </button>
            <button className="deck-save-button" onClick={saveDeck}>
              save
            </button>
          </div>
          <DeckSmallStats stats={stats} /> {/* ✅ 덱 현황 박스 추가 */}
          <div className="filter-group">
            <span style={{ color: "white", fontFamily: "Do Hyeon", marginRight: "5px" }}>속성:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              style={{ marginRight: "10px", padding: "5px", fontFamily: "Do Hyeon", borderRadius: "5px", height: "30px" }}
            >
              <option value="all">모든 속성</option>
              <option value="fire">불</option>
              <option value="water">물</option>
              <option value="forest">풀</option>
              <option value="electric">전기</option>
              <option value="fly">비행</option>
              <option value="ice">얼음</option>
              <option value="land">땅</option>
              <option value="normal">노말</option>
              <option value="poison">독</option>
              <option value="worm">벌레</option>
              <option value="esper">에스퍼</option>
              <option value="legend">전설</option>
            </select>

            <span style={{ color: "white", fontFamily: "Do Hyeon", marginRight: "5px" }}>코스트:</span>
            <select
              value={filterCost}
              onChange={(e) => setFilterCost(e.target.value)}
              style={{ padding: "5px", fontFamily: "Do Hyeon", borderRadius: "5px", height: "30px" }}
            >
              <option value="all">모든 코스트</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
            </select>
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

      <div className="card-list">
        {userCards
          .filter((card) => {
            return filterType === "all" ? true : card.cardType === filterType;
          })
          .filter((card) => {
            const cardCost = card.cost ?? card.tier;
            return filterCost === "all" ? true : String(cardCost) === filterCost;
          })
          .map((card) => (
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
