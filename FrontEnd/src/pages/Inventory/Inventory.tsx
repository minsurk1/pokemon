import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Inventory.css";
import BackgroundVideo from "../../components/common/global";
import inventoryVideo from "../../assets/videos/arceus.mp4";
import { useUser, CardPack } from "../../context/UserContext";

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
            {inventory.map((pack) => (
              <div key={pack.id} className="inventory-item">
                <div className="card-pack">
                  {pack.packImage ? (
                    <img
                      src={pack.packImage}
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
            ))}
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
