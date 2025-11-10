// FrontEnd/src/components/battle/Eventitem.tsx

import type React from "react";

interface Event {
  id: number;
  type: number;
  image: string;
  message: string;
  hp: number;
  maxHp: number;
}

interface EventItemProps {
  event: Event;
  onClick?: () => void;
}

function EventItem({ event, onClick }: EventItemProps) {
  const baseStyle: React.CSSProperties = {
    backgroundImage: `url(${event.image})`,
    width: "80px",
    height: "80px",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    backgroundPosition: "center",
    margin: "0 10px",
    display: "inline-block",
    cursor: "pointer",
    transition: "all 0.2s ease",
    filter: "brightness(1)",
    transform: "scale(1)",
  };

  return (
    <div
      className="event-item-wrapper"
      onClick={onClick}
      title={`${event.message} - 클릭하여 공격하세요!`}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = "brightness(1.2) drop-shadow(0 0 5px #fff)";
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = "brightness(1)";
        e.currentTarget.style.transform = "scale(1)";
      }}
      /* ✅ 드래그 공격을 이 컴포넌트도 직접 받도록 처리 */
      onDragOver={(e) => {
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.preventDefault();
        const attackerId = e.dataTransfer.getData("attackerId");
        if (attackerId) {
          onClick?.(); // 드래그 공격 트리거
        }
      }}
      style={{
        display: "inline-block",
        margin: "0 10px",
        cursor: "pointer",
        transition: "0.2s",
      }}
    >
      {/* ✅ 반드시 문자열 변환! */}
      <div id={`event-monster-${String(event.id)}`} data-event-id={event.id} className="event-item" style={baseStyle} />

      <div className="event-hp-container">
        <div className="card-hp-bar">
          <div className="card-hp-bar-inner" style={{ width: `${(event.hp / event.maxHp) * 100}%` }} />
          <div className="card-hp-text">
            {event.hp}/{event.maxHp}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventItem;
