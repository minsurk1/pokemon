import React from "react";
import "./CardMenu.css";

// 카드 타입 정의
interface Card {
  name?: string;
  attack?: number;
  hp?: number;
  cost?: number;
}

// props 타입 정의
interface CardMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  card?: Card | null;
}

// 타입 적용된 컴포넌트
const CardMenu: React.FC<CardMenuProps> = ({ x, y, onClose, card }) => {
  if (!card) return null;

  return (
    <div
      className="card-menu"
      style={{
        left: `${x}px`,
        top: `${y}px`,
      }}
    >
      <div className="card-info">
        <h3>{card.name || "알 수 없는 카드"}</h3>
        <p>공격력: {card.attack || "알 수 없음"}</p>
        <p>체력: {card.hp || "알 수 없음"}</p>
        <p>코스트 : {card.cost || "알 수 없음"}</p>
      </div>
      <button onClick={onClose}>닫기</button>
    </div>
  );
};

export default CardMenu;
