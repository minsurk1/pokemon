import "./CardMenu.css"
import "./BattlePage.js"

const CardMenu = ({ x, y, onClose, card }) => {
  if (!card) return null

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
  )
}

export default CardMenu
