import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Inventory.css";
import BackgroundVideo from "../../components/common/global";
import inventoryVideo from "../../assets/videos/arceus.mp4";
import { useUser } from "../../context/UserContext";

function Inventory() {
  const { userInfo, setUserInfo } = useUser();
  const [showModal, setShowModal] = useState(false);

  if (!userInfo) return <div>로딩 중...</div>;
  const inventory = userInfo.inventory;

  const openCardPack = (packId: string) => {
    setUserInfo((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        inventory: prev.inventory
          .map((p) =>
            p.id === packId
              ? { ...p, quantity: Math.max(0, p.quantity - 1) }
              : p
          )
          .filter((p) => p.quantity > 0),
      };
    });
    setShowModal(true);
  };

  // ✅ 백엔드 주소
  const API_URL = "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app";

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
            {inventory.map((pack) => {
              // ✅ 백엔드에서 이미지 불러오도록 수정
              const imageSrc = pack.packImage
                ? `${API_URL}/images/${pack.packImage}`
                : null;

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
                    <p>
                      {pack.name} x{pack.quantity}
                    </p>
                    <button
                      className="open-button"
                      onClick={() => openCardPack(pack.id)}
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
