import React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import "./StorePage.css"
import { MdInventory } from "react-icons/md";
import { FaHome } from "react-icons/fa";
import MessageBox from "../../components/common/MessageBox.tsx"
import bCard from "../../assets/images/b_card.png"
import aCard from "../../assets/images/a_card.png"
import sCard from "../../assets/images/s_card.png"
import type { Card, CardPack } from "../Inventory/Inventory"
import BackgroundVideo from "../../components/common/global.tsx"
import storeVideo from "../../assets/videos/rulevideo.mp4"

// StorePage 컴포넌트 props 인터페이스
interface StorePageProps {
  buyCardPack: (card: Card) => boolean
  currency: number
  addCardsToInventory: (cardPack: CardPack) => void
  setCurrency: React.Dispatch<React.SetStateAction<number>>
}

function StorePage({ buyCardPack, currency, addCardsToInventory, setCurrency }: StorePageProps) {
  const navigate = useNavigate()
  const [message, setMessage] = useState<string>("") // 메시지 상태 추가
  const [showMessage, setShowMessage] = useState<boolean>(false) // 메시지 박스 표시 여부
  const [cards] = useState<Card[]>([
    { image: bCard, name: "B급 카드팩", price: 100, packImage: bCard },
    { image: sCard, name: "S급 카드팩", price: 500, packImage: sCard },
    { image: aCard, name: "A급 카드팩", price: 300, packImage: aCard },
  ])

  const handleBuyCard = (index: number): void => {
    const selectedCard = cards[index]
    if (buyCardPack(selectedCard)) {
      // 여기서 setCurrency를 직접 호출하지 않고 buyCardPack 함수의 반환값에 의존합니다

      // 카드 이름에서 타입 추출
      let type: "B" | "A" | "S" = "B" // 기본값
      if (selectedCard.name.includes("S급")) {
        type = "S"
      } else if (selectedCard.name.includes("A급")) {
        type = "A"
      }

      addCardsToInventory({
        name: selectedCard.name,
        packImage: selectedCard.packImage,
        isOpened: false,
        type: type, // type 정보 추가
      })

      setMessage(`${selectedCard.name} 카드팩을 구매했습니다!`)
      setShowMessage(true)
    } else {
      setMessage("재화가 부족합니다.")
      setShowMessage(true)
    }
  }

  // 메시지 박스 닫기 함수
  const closeMessage = (): void => {
    setShowMessage(false)
    setMessage("")
  }

  return (
    <div className="store-container">
      <BackgroundVideo
          src={storeVideo}
          opacity={1}
          zIndex={-1}
          objectPosition="center top"
        />
      {showMessage && (
        <MessageBox
          bgColor="#e3f2fd"
          borderColor="#2196f3"
          textColor="#0d47a1"
          onClose={closeMessage}
          closeborderColor="black"
        >
          {message}
        </MessageBox>
      )}

      <div className="store-header">
        <div className="store-currency">보유 재화: {currency} G</div>
        <div>
          <button className="inventory-button" onClick={() => navigate("/inventory")}>
            인벤토리  <MdInventory/>
          </button>
          <button className="main-button" onClick={() => navigate("/main")}>
            메인페이지  <FaHome/>
          </button>
        </div>
      </div>

      <div className="store-card-container">
        {cards.map((card, index) => (
          <div key={index} className="store-card">
            <img src={card.image || "/placeholder.svg"} alt={`Card ${index + 1}`} className="store-card-image" />
            <p>
              {card.name} - {card.price} G
            </p>
            <button className="buy-button" onClick={() => handleBuyCard(index)}>
              구매하기
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default StorePage
