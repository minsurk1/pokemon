// FrontEnd/src/components/battle/Eventitem.tsx

import type React from "react"; // React 타입 임포트

// ✅ Event 인터페이스 (gameTypes.ts와 동일)
interface Event {
  id: number;
  type: number;
  image: string;
  message: string;
  hp: number;
  maxHp: number;
}

// ✅ Props 수정: updateEventHP 대신 onClick 받기
interface EventItemProps {
  event: Event;
  onClick: () => void; // ✅ 1번 파일의 공격 방식(클릭)과 통일
}

// 이벤트 아이템 컴포넌트
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
        // 원래 상태로
        e.currentTarget.style.filter = "brightness(1)";
        e.currentTarget.style.transform = "scale(1)";
      }}
      style={{
        display: "inline-block",
        margin: "0 10px",
        cursor: "pointer",
        transition: "0.2s",
      }}
    >
      <div id={`event-monster-${event.id}`} data-event-id={event.id} className="event-item" style={baseStyle} />

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
