import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Inventory.css";
import BackgroundVideo from "../../components/common/global";
import inventoryVideo from "../../assets/videos/arceus.mp4";
import { useUser, CardPack } from "../../context/UserContext";
import axios from "axios";

function Inventory() {
  const { userInfo, setUserInfo } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [openedCards, setOpenedCards] = useState<any[]>([]);
  // --- ▼ [수정됨] null(null) -> null>(null) ---
  const [lastOpenedPack, setLastOpenedPack] = useState<{ id: string; type: string } | null>(null);
  // --- ▲ [수정됨] ---

  if (!userInfo) return <div>로딩 중...</div>;

  const API_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api";
  const IMAGE_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app";

  const openCardPack = async (packId: string, packType: string) => {
    setLastOpenedPack({ id: packId, type: packType });

    try {
      const res = await axios.post(
        `${API_URL}/inventory/open-pack`,
        { type: packType },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      const drawnCards = res.data.drawnCards || [];
      const userPacks = res.data.userPacks || [];

      // [정상] 누적이 아닌 '교체' 방식
      setOpenedCards(
        drawnCards.map((c: any) => ({
          id: c.id,
          name: c.name, 
          type: packType as CardPack["type"],
          quantity: 1,
          isOpened: true,
          packImage: c.image, 
          tier: c.tier, 
        }))
      );

      setUserInfo((prev) => {
        if (!prev) return prev;
        const updatedInventory: CardPack[] = userPacks.map((p: any) => ({
          id: p.packId,
          name: p.name || "",
          packImage: p.image || "",
          type: p.type,
          isOpened: false,
          quantity: p.quantity,
        }));
        return { ...prev, inventory: updatedInventory };
      });

      setShowModal(true);
    } catch (err: any) {
      console.error("카드팩 개봉 실패:", err);
      if (err.response?.status === 400) {
        alert(err.response?.data?.message || "재고가 없습니다.");
        setShowModal(false); 
      } else {
        alert(err.response?.data?.message || "카드팩 개봉 실패");
      }
    }
  };

  return (
    <div className="inventory-page">
      <BackgroundVideo src={inventoryVideo} opacity={1} zIndex={-1} objectPosition="center top" />

      {userInfo.inventory.length === 0 ? (
        <div className="inventory-empty">구매한 카드팩이 없습니다.</div>
      ) : (
        <div className="pack-zone">
          <div className="inventory-list">
            {userInfo.inventory.map((pack) => {
              const imageSrc = pack.packImage ? `${IMAGE_URL}/images/${pack.packImage}` : null;
              return (
                <div key={pack.id} className="inventory-item">
                  <div className="card-pack">
                    {imageSrc ? (
                      <img
                        src={imageSrc}
                        alt={pack.name}
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
                    <div className="pack-info">
                      <p className="pack-name">{pack.name}</p>
                      <span className="pack-quantity">재고: {pack.quantity}개</span>
                    </div>
                    <button
                      className="open-button"
                      onClick={() => openCardPack(pack.id, pack.type)}
                      disabled={pack.quantity <= 0}
                    >
                      {pack.quantity <= 0 ? "재고 없음" : "카드팩 개봉"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-card-message">카드팩을 개봉했습니다!</div>
            <div className="modal-cards">
              {/* --- ▼ [수정됨] key에 index를 추가하여 '이어뽑기' 버그 해결 --- */}
              {openedCards.map((card, index) => (
                <div key={`${card.id}-${index}`} className="modal-card">
              {/* --- ▲ [수정됨] --- */}
                  {card.packImage ? (
                    <img
                      src={`${IMAGE_URL}/images/${card.packImage}`}
                      alt={card.name}
                      className="modal-card-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = "/placeholder.svg";
                      }}
                    />
                  ) : (
                    <div className="placeholder-image">No Image</div>
                  )}
                  <p className="card-tier">⭐ {card.tier} 등급</p>
                  <p>{card.name}</p>
                </div>
              ))}
            </div>

            {(() => {
              const currentPack = userInfo.inventory.find(
                (p) => p.type === lastOpenedPack?.type
              );
              const hasMorePacks = currentPack && currentPack.quantity > 0;

              return (
                <div className="modal-actions">
                  <button
                    className="continue-open-button"
                    onClick={() => {
                      if (lastOpenedPack) {
                        openCardPack(lastOpenedPack.id, lastOpenedPack.type);
                      }
                    }}
                    disabled={!hasMorePacks}
                  >
                    {hasMorePacks
                      ? `계속 뽑기 (남은 재고: ${currentPack.quantity}개)`
                      : "재고 없음"}
                  </button>
                </div>
              );
            })()}

            <button className="close-modal" onClick={() => setShowModal(false)}>
              X
            </button>
          </div>
        </div>
      )}
      <div>
        <Link to="/store" className="back-button">
          상점페이지
        </Link>
        <Link to="/main" className="inv-main-button">
          메인 페이지
        </Link>
      </div>
    </div>
  );
}

export default Inventory;