import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import axios from "axios"
import "./DeckPage.css"

import fireTier1 from "../../assets/images/firetier1.png"
import fireTier2 from "../../assets/images/firetier2.png"
import fireTier3 from "../../assets/images/firetier3.png"
import fireTier4 from "../../assets/images/firetier4.png"
import fireTier5 from "../../assets/images/firetier5.png"
import fireTier6 from "../../assets/images/firetier6.png"
import fireTier7 from "../../assets/images/firetier7.png"

import waterTier1 from "../../assets/images/watertier1.png"
import waterTier2 from "../../assets/images/watertier2.png"
import waterTier3 from "../../assets/images/watertier3.png"
import waterTier4 from "../../assets/images/watertier4.png"
import waterTier5 from "../../assets/images/watertier5.png"
import waterTier6 from "../../assets/images/watertier6.png"
import waterTier7 from "../../assets/images/watertier7.png"

import forestTier1 from "../../assets/images/foresttier1.png"
import forestTier2 from "../../assets/images/foresttier2.png"
import forestTier3 from "../../assets/images/foresttier3.png"
import forestTier4 from "../../assets/images/foresttier4.png"
import forestTier5 from "../../assets/images/foresttier5.png"
import forestTier6 from "../../assets/images/foresttier6.png"
import forestTier7 from "../../assets/images/foresttier7.png"

import iceTier1 from "../../assets/images/icetier1.png"
import iceTier2 from "../../assets/images/icetier2.png"
import iceTier3 from "../../assets/images/icetier3.png"
import iceTier4 from "../../assets/images/icetier4.png"
import iceTier5 from "../../assets/images/icetier5.png"
import iceTier6 from "../../assets/images/icetier6.png"
import iceTier7 from "../../assets/images/icetier7.png"

import electricTier1 from "../../assets/images/electrictier1.png"
import electricTier2 from "../../assets/images/electrictier2.png"
import electricTier3 from "../../assets/images/electrictier3.png"
import electricTier4 from "../../assets/images/electrictier4.png"
import electricTier5 from "../../assets/images/electrictier5.png"
import electricTier6 from "../../assets/images/electrictier6.png"
import electricTier7 from "../../assets/images/electrictier7.png"

import esperTier1 from "../../assets/images/espertier1.png"
import esperTier2 from "../../assets/images/espertier2.png"
import esperTier3 from "../../assets/images/espertier3.png"
import esperTier4 from "../../assets/images/espertier4.png"
import esperTier5 from "../../assets/images/espertier5.png"
import esperTier6 from "../../assets/images/espertier6.png"
import esperTier7 from "../../assets/images/espertier7.png"

import flyTier1 from "../../assets/images/flytier1.png"
import flyTier2 from "../../assets/images/flytier2.png"
import flyTier3 from "../../assets/images/flytier3.png"
import flyTier4 from "../../assets/images/flytier4.png"
import flyTier5 from "../../assets/images/flytier5.png"
import flyTier6 from "../../assets/images/flytier6.png"
import flyTier7 from "../../assets/images/flytier7.png"

import landTier1 from "../../assets/images/landtier1.png"
import landTier2 from "../../assets/images/landtier2.png"
import landTier3 from "../../assets/images/landtier3.png"
import landTier4 from "../../assets/images/landtier4.png"
import landTier5 from "../../assets/images/landtier5.png"
import landTier6 from "../../assets/images/landtier6.png"
import landTier7 from "../../assets/images/landtier7.png"

import normalTier1 from "../../assets/images/normaltier1.png"
import normalTier2 from "../../assets/images/normaltier2.png"
import normalTier3 from "../../assets/images/normaltier3.png"
import normalTier4 from "../../assets/images/normaltier4.png"
import normalTier5 from "../../assets/images/normaltier5.png"
import normalTier6 from "../../assets/images/normaltier6.png"
import normalTier7 from "../../assets/images/normaltier7.png"

import poisonTier1 from "../../assets/images/poisontier1.png"
import poisonTier2 from "../../assets/images/poisontier2.png"
import poisonTier3 from "../../assets/images/poisontier3.png"
import poisonTier4 from "../../assets/images/poisontier4.png"
import poisonTier5 from "../../assets/images/poisontier5.png"
import poisonTier6 from "../../assets/images/poisontier6.png"
import poisonTier7 from "../../assets/images/poisontier7.png"

import wormTier1 from "../../assets/images/wormtier1.png"
import wormTier2 from "../../assets/images/wormtier2.png"
import wormTier3 from "../../assets/images/wormtier3.png"
import wormTier4 from "../../assets/images/wormtier4.png"
import wormTier5 from "../../assets/images/wormtier5.png"
import wormTier6 from "../../assets/images/wormtier6.png"
import wormTier7 from "../../assets/images/wormtier7.png"

import legendTier1 from "../../assets/images/legendtier1.png"
import legendTier2 from "../../assets/images/legendtier2.png"
import legendTier3 from "../../assets/images/legendtier3.png"
import legendTier4 from "../../assets/images/legendtier4.png"
import legendTier5 from "../../assets/images/legendtier5.png"
import legendTier6 from "../../assets/images/legendtier6.png"
import legendTier7 from "../../assets/images/legendtier7.png"

// DeckPage 컴포넌트 props 인터페이스
interface DeckPageProps {
  onDeckChange: (deck: string[]) => void
  selectedDeck: string[]
}

interface UserCard {
  cardId: string  // 카드 이미지 이름 기반 키로 대응할 것
  owned: boolean
}

const DeckPage: React.FC<DeckPageProps> = ({ onDeckChange, selectedDeck }) => {
  const [selectedCards, setSelectedCards] = useState<string[]>(selectedDeck || [])
  const [userCards, setUserCards] = useState<UserCard[]>([])
  const navigate = useNavigate()
  const maxSelectedCards = 30

  // 카드 전체 배열
  const cards: string[] = [
    fireTier1, fireTier2, fireTier3, fireTier4, fireTier5, fireTier6, fireTier7,
    waterTier1, waterTier2, waterTier3, waterTier4, waterTier5, waterTier6, waterTier7,
    forestTier1, forestTier2, forestTier3, forestTier4, forestTier5, forestTier6, forestTier7,
    electricTier1, electricTier2, electricTier3, electricTier4, electricTier5, electricTier6, electricTier7,
    esperTier1, esperTier2, esperTier3, esperTier4, esperTier5, esperTier6, esperTier7,
    flyTier1, flyTier2, flyTier3, flyTier4, flyTier5, flyTier6, flyTier7,
    iceTier1, iceTier2, iceTier3, iceTier4, iceTier5, iceTier6, iceTier7,
    landTier1, landTier2, landTier3, landTier4, landTier5, landTier6, landTier7,
    normalTier1, normalTier2, normalTier3, normalTier4, normalTier5, normalTier6, normalTier7,
    poisonTier1, poisonTier2, poisonTier3, poisonTier4, poisonTier5, poisonTier6, poisonTier7,
    wormTier1, wormTier2, wormTier3, wormTier4, wormTier5, wormTier6, wormTier7,
    legendTier1, legendTier2, legendTier3, legendTier4, legendTier5, legendTier6, legendTier7,
  ]

  // ✅ 유저 카드 정보 가져오기
  useEffect(() => {
    const fetchUserCards = async () => {
      try {
      const user = localStorage.getItem("user");
      const parsedUser = user ? JSON.parse(user) : null;
      const userId = parsedUser?.id;
        const res = await axios.get(`/api/user/${userId}/cards`)
        setUserCards(res.data.userCards)
      } catch (err) {
        console.error("유저 카드 정보 불러오기 실패:", err)
      }
    }

    fetchUserCards()
  }, [])

  const handleMain = () => navigate("/main")
  const handleStore = () => navigate("/store")

  const isOwned = (cardPath: string): boolean => {
    const imageName = cardPath.split("/").pop()?.replace(".png", "")
    return userCards.some((uc) => uc.cardId === imageName && uc.owned)
  }

  const selectCard = (card: string): void => {
    if (selectedCards.length >= maxSelectedCards) return
    if (!isOwned(card)) return // 보유하지 않은 카드 클릭 방지

    const newSelectedCards = [...selectedCards, card]
    setSelectedCards(newSelectedCards)
    onDeckChange(newSelectedCards)
  }

  const removeCard = (index: number): void => {
    const updatedCards = [...selectedCards]
    updatedCards.splice(index, 1)
    setSelectedCards(updatedCards)
    onDeckChange(updatedCards)
  }

  return (
    <div className="deck-page">
      <div className="navigation-section">
        <button className="nav-button" onClick={handleMain}>메인페이지</button>
        <div className="deck-header-image" />
        <button className="nav-button" onClick={handleStore}>상점페이지</button>
      </div>

      <div className="selected-cards-container">
        <div className="selected-cards">
          {selectedCards.map((card, index) => (
            <div key={index} className="selected-card" onClick={() => removeCard(index)}>
              <img src={card} alt={`Selected ${index}`} />
            </div>
          ))}
          {Array.from({ length: maxSelectedCards - selectedCards.length }, (_, index) => (
            <div key={`empty-${index}`} className="selected-card">
              {`카드 ${selectedCards.length + index + 1}`}
            </div>
          ))}
        </div>
      </div>

      <div className="card-list">
        {cards.map((card, index) => {
          const owned = isOwned(card)
          return (
            <div
              key={index}
              className={`card ${!owned ? "unowned" : ""}`}
              onClick={() => selectCard(card)}
            >
              <img
                src={card}
                alt={`Card ${index}`}
                className={!owned ? "grayscale" : ""}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default DeckPage
