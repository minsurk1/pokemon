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
  // openedCards 타입에 tier 정보가 포함되도록 가정하고 any로 처리
  const [openedCards, setOpenedCards] = useState<any[]>([]); 

  if (!userInfo) return <div>로딩 중...</div>;

  const API_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api";
  const IMAGE_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app";

  // 카드팩 개봉 핸들러
  const openCardPack = async (packId: string, packType: string) => {
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

      // 1) 개봉된 카드 저장 (CSS 구조에 맞게, tier 정보 포함)
      setOpenedCards(
        drawnCards.map((c: any) => ({
          id: c.id,
          name: c.name,          // 서버 필드명 그대로
          type: packType as CardPack["type"],
          quantity: 1,
          isOpened: true,
          packImage: c.image,    // 서버 필드명 그대로
          tier: c.tier,          // 👈 서버 응답에서 tier를 가져온다고 가정
        }))
      );


      // 2) 유저 인벤토리 업데이트
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
      alert(err.response?.data?.message || "카드팩 개봉 실패");
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
                    {/* 👇 수량 및 이름 표시 개선 */}
                    <div className="pack-info">
                      <p className="pack-name">{pack.name}</p>
                      <span className="pack-quantity">재고: {pack.quantity}개</span>
                    </div>
                    {/* 👆 수량 및 이름 표시 개선 */}
                    <button
                      className="open-button"
                      onClick={() => openCardPack(pack.id, pack.type)}
                      disabled={pack.quantity <= 0}
                    >
                      카드팩 개봉
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
              {openedCards.map((card) => (
                <div key={card.id} className="modal-card">
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
                  {/* 👇 등급 표시 추가 */}
                  <p className="card-tier">⭐ {card.tier} 등급</p>
                  {/* 👆 등급 표시 추가 */}
                  <p>{card.name}</p>
                </div>
              ))}
            </div>
            <button className="close-modal" onClick={() => setShowModal(false)}>
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