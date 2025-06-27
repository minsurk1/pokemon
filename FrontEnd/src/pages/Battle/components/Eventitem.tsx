import { useDrop } from "react-dnd"
import { useEffect, useRef } from "react"

// 드래그 아이템 인터페이스 정의
interface DragItem {
  id: string
  fromZone: boolean
  index: number
  card: {
    id: string
    image: string
    name: string
    attack: number
    hp: number
    maxhp: number
    cost: number
  }
}

// 이벤트 인터페이스 정의
interface Event {
  id: number
  type: number
  image: string
  message: string
  hp: number
  maxHp: number
  effect: () => void
}

// EventItem 컴포넌트 props 인터페이스
interface EventItemProps {
  event: Event
  updateEventHP: (eventId: number, amount: number) => void
}

// 이벤트 아이템 컴포넌트
function EventItem({ event, updateEventHP }: EventItemProps) {
  // ref 객체 생성
  const eventItemRef = useRef<HTMLDivElement>(null)

  const [{ isOver }, drop] = useDrop<DragItem, void, { isOver: boolean }>({
    accept: "CARD",
    drop: (item, monitor) => {
      if (item.card && typeof item.card.attack === "number") {
        updateEventHP(event.id, -item.card.attack)
      }
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  })

  // useEffect를 사용하여 ref와 drop 함수 연결
  useEffect(() => {
    if (eventItemRef.current) {
      drop(eventItemRef.current)
    }
  }, [drop])

  // 드롭 영역 위에 있을 때 시각적 피드백
  const itemStyle = {
    backgroundImage: `url(${event.image})`,
    width: "80px",
    height: "80px",
    backgroundSize: "contain",
    backgroundRepeat: "no-repeat",
    margin: "0 10px",
    display: "inline-block",
    filter: isOver ? "brightness(1.3)" : "none",
    transform: isOver ? "scale(1.1)" : "scale(1)",
    transition: "all 0.3s ease",
  }

  return (
    <div className="event-item-wrapper">
      <div
        ref={eventItemRef}
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
