import { useDrop } from "react-dnd"

// 이벤트 아이템 컴포넌트
function EventItem({ event, updateEventHP }) {
  // 각 이벤트 아이템에 개별 드롭 핸들러 적용
  const [{ isOver }, drop] = useDrop({
    accept: "CARD",
    drop: (item, monitor) => {
      // 드롭된 카드의 공격력으로 이벤트 HP 감소
      if (item.card && typeof item.card.attack === "number") {
        updateEventHP(event.id, -item.card.attack)

        // HP가 0 이하가 되면 효과 적용
        if (event.hp - item.card.attack <= 0 && event.effect) {
          event.effect() // 저장된 효과 함수 실행
        }
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  })

  // 드롭 영역 위에 있을 때 시각적 피드백
  const itemStyle = {
    backgroundImage: `url(${event.image})`,
    width: "80px",
    height: "80px",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    margin: "0 10px",
    display: "inline-block",
    // 드롭 영역 위에 있을 때 효과
    filter: isOver ? "brightness(1.3)" : "none",
    transform: isOver ? "scale(1.1)" : "scale(1)",
    transition: "all 0.3s ease",
  }

  return (
    <div className="event-item-wrapper">
      <div
        ref={drop}
        className="event-item"
        style={itemStyle}
        title={`${event.message} - 이 이벤트에 카드를 드래그하여 공격하세요!`}
      />
      <div className="event-hp-container">
        <div className="card-hp-bar">
          <div className="card-hp-bar-inner" style={{ width: `${(event.hp / event.maxHp) * 100}%` }} />
          <div className="card-hp-text">
            {event.hp}/{event.maxHp}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EventItem

