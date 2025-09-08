// FrontEnd/src/pages/Inventory.tsx
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Inventory.css";
import BackgroundVideo from "../../components/common/global";
import inventoryVideo from "../../assets/videos/arceus.mp4";
import { CardData, CardPack } from "../../types/cardsTypes";
import { getCardImageByNameAndTier } from "../../data/cardsData";

interface InventoryProps {
  inventory: CardPack[];
  setInventory: React.Dispatch<React.SetStateAction<CardPack[]>>;
}

// 서버에서 받은 카드 데이터 + 소유 상태
export interface CardWithOwned extends CardData {
  owned: boolean;
}

// 문자열 티어를 숫자 티어로 매핑
const tierMap: Record<string, number> = {
  B: 1,
  A: 2,
  S: 3,
};

function Inventory({ inventory, setInventory }: InventoryProps) {
  const [showModal, setShowModal] = useState(false);
  const [openedCards, setOpenedCards] = useState<CardWithOwned[]>([]);

  const user = localStorage.getItem("user");
  const parsedUser = user ? JSON.parse(user) : null;
  const userId = parsedUser?.id;

  // 카드팩 개봉
  const openCardPack = async (index: number) => {
    if (!userId) return;
    const cardPack = inventory[index];
    if (!cardPack) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`/api/user/draw-cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packType: cardPack.type }),
      });

      if (!res.ok) throw new Error("카드 뽑기 실패");

      const data: { drawnCards: CardData[] } = await res.json();

      const cardsWithOwned: CardWithOwned[] = data.drawnCards.map((card) => ({
        ...card,
        owned: true,
      }));

      setOpenedCards(cardsWithOwned);
      setShowModal(true);

      // Inventory에서 개봉한 카드팩 제거
      setInventory((prev) => prev.filter((_, i) => i !== index));
    } catch (error) {
      console.error(error);
      alert("카드팩 개봉 실패");
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setOpenedCards([]);
  };

  return (
    <div className="inventory-page">
      <BackgroundVideo
        src={inventoryVideo}
        opacity={1}
        zIndex={-1}
        objectPosition="center top"
      />

      {inventory.length === 0 ? (
        <div className="inventory-empty">구매한 카드팩이 없습니다.</div>
      ) : (
        <div className="pack-zone">
          <div className="inventory-list">
            {inventory.map((cardPack, index) => (
              <div key={cardPack.id || index} className="inventory-item">
                <div className="card-pack">
                  {cardPack.packImage ? (
                    <img
                      src={cardPack.packImage}
                      alt={cardPack.name}
                      className="card-pack-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                  <p>{cardPack.name}</p>
                  <button
                    className="open-button"
                    onClick={() => openCardPack(index)}
                  >
                    카드팩 개봉
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-card-message">새로운 카드가 나왔습니다!</div>
            <div className="modal-cards">
              {openedCards.map((card, index) => (
                <div key={card.name + index} className="modal-card">
                  <img
                    src={
                      card.owned
                        ? getCardImageByNameAndTier(
                            card.name as any,
                            tierMap[card.tier]
                          )
                        : "/placeholder.svg"
                    }
                    alt={card.name}
                    className={`modal-card-image ${
                      !card.owned ? "grayscale" : ""
                    }`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = "/placeholder.svg";
                    }}
                  />
                  <p>
                    {card.name} (Tier {card.tier})
                  </p>
                </div>
              ))}
            </div>
            <button className="close-modal" onClick={closeModal}>
              X
            </button>
          </div>
        </div>
      )}

      <Link to="/store" className="back-button">
        상점페이지
      </Link>
    </div>
  );
}

export default Inventory;
