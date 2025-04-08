"use client"

import React from "react"
import { useState } from "react"
import { Link } from "react-router-dom"
import "./Inventory.css"

import fireTier1 from "./assets/images/firetier1.png"
import fireTier2 from "./assets/images/firetier2.png"
import fireTier3 from "./assets/images/firetier3.png"
import fireTier4 from "./assets/images/firetier4.png"
import fireTier5 from "./assets/images/firetier5.png"
import fireTier6 from "./assets/images/firetier6.png"
import fireTier7 from "./assets/images/firetier7.png"

import waterTier1 from "./assets/images/watertier1.png"
import waterTier2 from "./assets/images/watertier2.png"
import waterTier3 from "./assets/images/watertier3.png"
import waterTier4 from "./assets/images/watertier4.png"
import waterTier5 from "./assets/images/watertier5.png"
import waterTier6 from "./assets/images/watertier6.png"
import waterTier7 from "./assets/images/watertier7.png"

import forestTier1 from "./assets/images/foresttier1.png"
import forestTier2 from "./assets/images/foresttier2.png"
import forestTier3 from "./assets/images/foresttier3.png"
import forestTier4 from "./assets/images/foresttier4.png"
import forestTier5 from "./assets/images/foresttier5.png"
import forestTier6 from "./assets/images/foresttier6.png"
import forestTier7 from "./assets/images/foresttier7.png"

import electricTier1 from "./assets/images/electrictier1.png"
import electricTier2 from "./assets/images/electrictier2.png"
import electricTier3 from "./assets/images/electrictier3.png"
import electricTier4 from "./assets/images/electrictier4.png"
import electricTier5 from "./assets/images/electrictier5.png"
import electricTier6 from "./assets/images/electrictier6.png"
import electricTier7 from "./assets/images/electrictier7.png"

import flyTier1 from "./assets/images/flytier1.png"
import flyTier2 from "./assets/images/flytier2.png"
import flyTier4 from "./assets/images/flytier4.png"
import flyTier5 from "./assets/images/flytier5.png"
import flyTier6 from "./assets/images/flytier6.png"
import flyTier7 from "./assets/images/flytier7.png"

import iceTier1 from "./assets/images/icetier1.png"
import iceTier2 from "./assets/images/icetier2.png"
import iceTier3 from "./assets/images/icetier3.png"
import iceTier4 from "./assets/images/icetier4.png"
import iceTier5 from "./assets/images/icetier5.png"
import iceTier6 from "./assets/images/icetier6.png"
import iceTier7 from "./assets/images/icetier7.png"

import landTier1 from "./assets/images/landtier1.png"
import landTier2 from "./assets/images/landtier2.png"
import landTier3 from "./assets/images/landtier3.png"
import landTier4 from "./assets/images/landtier4.png"
import landTier5 from "./assets/images/landtier5.png"
import landTier6 from "./assets/images/landtier6.png"
import landTier7 from "./assets/images/landtier7.png"

import normalTier1 from "./assets/images/normaltier1.png"
import normalTier2 from "./assets/images/normaltier2.png"
import normalTier3 from "./assets/images/normaltier3.png"
import normalTier4 from "./assets/images/normaltier4.png"
import normalTier5 from "./assets/images/normaltier5.png"
import normalTier6 from "./assets/images/normaltier6.png"
import normalTier7 from "./assets/images/normaltier7.png"

import poisonTier1 from "./assets/images/poisontier1.png"
import poisonTier2 from "./assets/images/poisontier2.png"
import poisonTier3 from "./assets/images/poisontier3.png"
import poisonTier4 from "./assets/images/poisontier4.png"
import poisonTier5 from "./assets/images/poisontier5.png"
import poisonTier6 from "./assets/images/poisontier6.png"
import poisonTier7 from "./assets/images/poisontier7.png"

import wormTier1 from "./assets/images/wormtier1.png"
import wormTier2 from "./assets/images/wormtier2.png"
import wormTier3 from "./assets/images/wormtier3.png"
import wormTier4 from "./assets/images/wormtier4.png"
import wormTier5 from "./assets/images/wormtier5.png"
import wormTier6 from "./assets/images/wormtier6.png"
import wormTier7 from "./assets/images/wormtier7.png"

import esperTier1 from "./assets/images/espertier1.png"
import esperTier2 from "./assets/images/espertier2.png"
import esperTier3 from "./assets/images/espertier3.png"
import esperTier4 from "./assets/images/espertier4.png"
import esperTier5 from "./assets/images/espertier5.png"
import esperTier6 from "./assets/images/espertier6.png"
import esperTier7 from "./assets/images/espertier7.png"

import legendTier1 from "./assets/images/legendtier1.png"
import legendTier2 from "./assets/images/legendtier2.png"
import legendTier3 from "./assets/images/legendtier3.png"
import legendTier4 from "./assets/images/legendtier4.png"
import legendTier5 from "./assets/images/legendtier5.png"
import legendTier6 from "./assets/images/legendtier6.png"
import legendTier7 from "./assets/images/legendtier7.png"

// 카드 데이터 인터페이스 정의
export interface CardData {
  name: string
  tier: number
  image: string
  attack: number
  hp: number
  cost: number
}

// 카드 인터페이스 정의
export interface Card {
  image: string
  name: string
  price: number
  packImage: string
}

// 카드팩 인터페이스 정의
export interface CardPack {
  name: string
  packImage: string
  isOpened: boolean
  type: "B" | "A" | "S"
}

// 인벤토리 컴포넌트 props 인터페이스
interface InventoryProps {
  inventory: CardPack[]
  setInventory: React.Dispatch<React.SetStateAction<CardPack[]>>
}

// 확률 인터페이스 정의
interface Probabilities {
  [key: number]: number
}

const cardsData: CardData[] = [
  { name: "파이리", tier: 1, image: fireTier1, attack: 10, hp: 25, cost: 1 },
  { name: "포니타", tier: 2, image: fireTier2, attack: 40, hp: 100, cost: 2 },
  { name: "부스터", tier: 3, image: fireTier3, attack: 70, hp: 175, cost: 3 },
  { name: "윈디", tier: 4, image: fireTier4, attack: 110, hp: 275, cost: 4 },
  { name: "초염몽", tier: 5, image: fireTier5, attack: 150, hp: 375, cost: 5 },
  { name: "리자몽", tier: 6, image: fireTier6, attack: 200, hp: 500, cost: 6 },
  { name: "레시라무", tier: 7, image: fireTier7, attack: 300, hp: 750, cost: 7 },

  { name: "꼬부기", tier: 1, image: waterTier1, attack: 10, hp: 25, cost: 1 },
  { name: "고라파덕", tier: 2, image: waterTier2, attack: 40, hp: 100, cost: 2 },
  { name: "샤미드", tier: 3, image: waterTier3, attack: 70, hp: 175, cost: 3 },
  { name: "라프라스", tier: 4, image: waterTier4, attack: 110, hp: 275, cost: 4 },
  { name: "갸라도스", tier: 5, image: waterTier5, attack: 150, hp: 375, cost: 5 },
  { name: "거북왕", tier: 6, image: waterTier6, attack: 200, hp: 500, cost: 6 },
  { name: "가이오가", tier: 7, image: waterTier7, attack: 300, hp: 750, cost: 7 },

  { name: "이상해씨", tier: 1, image: forestTier1, attack: 10, hp: 25, cost: 1 },
  { name: "모다피", tier: 2, image: forestTier2, attack: 40, hp: 100, cost: 2 },
  { name: "리피아", tier: 3, image: forestTier3, attack: 70, hp: 175, cost: 3 },
  { name: "나시", tier: 4, image: forestTier4, attack: 110, hp: 275, cost: 4 },
  { name: "토대부기", tier: 5, image: forestTier5, attack: 150, hp: 375, cost: 5 },
  { name: "이상해꽃", tier: 6, image: forestTier6, attack: 200, hp: 500, cost: 6 },
  { name: "세레비", tier: 7, image: forestTier7, attack: 300, hp: 750, cost: 7 },

  { name: "플러쉬", tier: 1, image: electricTier1, attack: 10, hp: 25, cost: 1 },
  { name: "라이츄", tier: 2, image: electricTier2, attack: 40, hp: 100, cost: 2 },
  { name: "전룡", tier: 3, image: electricTier3, attack: 70, hp: 175, cost: 3 },
  { name: "자포코일", tier: 4, image: electricTier4, attack: 110, hp: 275, cost: 4 },
  { name: "볼트로스", tier: 5, image: electricTier5, attack: 150, hp: 375, cost: 5 },
  { name: "피카츄", tier: 6, image: electricTier6, attack: 200, hp: 500, cost: 6 },
  { name: "썬더", tier: 7, image: electricTier7, attack: 300, hp: 750, cost: 7 },

  { name: "찌르꼬", tier: 1, image: flyTier1, attack: 10, hp: 25, cost: 1 },
  { name: "깨비참", tier: 2, image: flyTier2, attack: 40, hp: 100, cost: 2 },
  { name: "구구", tier: 3, image: fireTier3, attack: 70, hp: 175, cost: 3 },
  { name: "깨비드릴조", tier: 4, image: flyTier4, attack: 110, hp: 275, cost: 4 },
  { name: "무장조", tier: 5, image: flyTier5, attack: 150, hp: 375, cost: 5 },
  { name: "토네로스", tier: 6, image: flyTier6, attack: 200, hp: 500, cost: 6 },
  { name: "루기아", tier: 7, image: flyTier7, attack: 300, hp: 750, cost: 7 },

  { name: "꾸꾸리", tier: 1, image: iceTier1, attack: 10, hp: 25, cost: 1 },
  { name: "메꾸리", tier: 2, image: iceTier2, attack: 40, hp: 100, cost: 2 },
  { name: "빙큐보", tier: 3, image: iceTier3, attack: 70, hp: 175, cost: 3 },
  { name: "얼음귀신", tier: 4, image: iceTier4, attack: 110, hp: 275, cost: 4 },
  { name: "크레베이이스", tier: 5, image: iceTier5, attack: 150, hp: 375, cost: 5 },
  { name: "레지아이스", tier: 6, image: iceTier6, attack: 200, hp: 500, cost: 6 },
  { name: "프리져", tier: 7, image: iceTier7, attack: 300, hp: 750, cost: 7 },

  { name: "톱치", tier: 1, image: landTier1, attack: 10, hp: 25, cost: 1 },
  { name: "코코리", tier: 2, image: landTier2, attack: 40, hp: 100, cost: 2 },
  { name: "히포포타스", tier: 3, image: landTier3, attack: 70, hp: 175, cost: 3 },
  { name: "대코파스", tier: 4, image: landTier4, attack: 110, hp: 275, cost: 4 },
  { name: "맘모꾸리", tier: 5, image: landTier5, attack: 150, hp: 375, cost: 5 },
  { name: "한카리아스", tier: 6, image: landTier6, attack: 200, hp: 500, cost: 6 },
  { name: "그란돈", tier: 7, image: landTier7, attack: 300, hp: 750, cost: 7 },

  { name: "부우부", tier: 1, image: normalTier1, attack: 10, hp: 25, cost: 1 },
  { name: "하데리어", tier: 2, image: normalTier2, attack: 40, hp: 100, cost: 2 },
  { name: "다부니", tier: 3, image: normalTier3, attack: 70, hp: 175, cost: 3 },
  { name: "해피너스", tier: 4, image: normalTier4, attack: 110, hp: 275, cost: 4 },
  { name: "링곰", tier: 5, image: normalTier5, attack: 150, hp: 375, cost: 5 },
  { name: "켄타로스", tier: 6, image: normalTier6, attack: 200, hp: 500, cost: 6 },
  { name: "레지기가스", tier: 7, image: normalTier7, attack: 300, hp: 750, cost: 7 },

  { name: "아보", tier: 1, image: poisonTier1, attack: 10, hp: 25, cost: 1 },
  { name: "니드리나", tier: 2, image: poisonTier2, attack: 40, hp: 100, cost: 2 },
  { name: "독개굴", tier: 3, image: poisonTier3, attack: 70, hp: 175, cost: 3 },
  { name: "펜드라", tier: 4, image: poisonTier4, attack: 110, hp: 275, cost: 4 },
  { name: "니드킹", tier: 5, image: poisonTier5, attack: 150, hp: 375, cost: 5 },
  { name: "독침붕", tier: 6, image: poisonTier6, attack: 200, hp: 500, cost: 6 },
  { name: "무한다이노", tier: 7, image: poisonTier7, attack: 300, hp: 750, cost: 7 },

  { name: "과사삭벌레", tier: 1, image: wormTier1, attack: 10, hp: 25, cost: 1 },
  { name: "두루지벌레", tier: 2, image: wormTier2, attack: 40, hp: 100, cost: 2 },
  { name: "케터피", tier: 3, image: wormTier3, attack: 70, hp: 175, cost: 3 },
  { name: "실쿤", tier: 4, image: wormTier4, attack: 110, hp: 275, cost: 4 },
  { name: "파라섹트", tier: 5, image: wormTier5, attack: 150, hp: 375, cost: 5 },
  { name: "핫삼", tier: 6, image: wormTier6, attack: 200, hp: 500, cost: 6 },
  { name: "게노세크트", tier: 7, image: wormTier7, attack: 300, hp: 750, cost: 7 },

  { name: "요가랑", tier: 1, image: esperTier1, attack: 10, hp: 25, cost: 1 },
  { name: "랄토스", tier: 2, image: esperTier2, attack: 40, hp: 100, cost: 2 },
  { name: "에브이", tier: 3, image: esperTier3, attack: 70, hp: 175, cost: 3 },
  { name: "고디모아젤", tier: 4, image: esperTier4, attack: 110, hp: 275, cost: 4 },
  { name: "가디안", tier: 5, image: esperTier5, attack: 150, hp: 375, cost: 5 },
  { name: "뮤", tier: 6, image: esperTier6, attack: 200, hp: 500, cost: 6 },
  { name: "뮤츠", tier: 7, image: esperTier7, attack: 300, hp: 750, cost: 7 },

  { name: "디아루가", tier: 8, image: legendTier1, attack: 400, hp: 1000, cost: 8 },
  { name: "펄기아", tier: 8, image: legendTier2, attack: 400, hp: 1000, cost: 8 },
  { name: "기라티나", tier: 8, image: legendTier3, attack: 400, hp: 1000, cost: 8 },
  { name: "제크로무", tier: 8, image: legendTier4, attack: 400, hp: 1000, cost: 8 },
  { name: "큐레무", tier: 8, image: legendTier5, attack: 400, hp: 1000, cost: 8 },
  { name: "레쿠자", tier: 8, image: legendTier6, attack: 400, hp: 1000, cost: 8 },
  { name: "아르세우스", tier: 8, image: legendTier7, attack: 400, hp: 1000, cost: 8 },
]

function Inventory({ inventory, setInventory }: InventoryProps) {
  const [showModal, setShowModal] = useState<boolean>(false)
  const [openedCards, setOpenedCards] = useState<CardData[]>([])

  const drawCards = (cardPack: CardPack): CardData[] => {
    const drawnCards: CardData[] = []
    const packCards = cardsData.filter((card) => card && card.image)

    const maxTier = cardPack.type === "B" ? 6 : cardPack.type === "A" ? 7 : 8

    const probabilities = getProbabilities(cardPack.type)

    for (let i = 0; i < 5; i++) {
      const randomTier = getRandomTier(probabilities, maxTier)
      const randomCard = getRandomCardFromTier(randomTier, packCards)
      if (randomCard) {
        drawnCards.push(randomCard)
      }
    }
    return drawnCards
  }

  const getProbabilities = (packType: "B" | "A" | "S"): Probabilities => {
    switch (packType) {
      case "B":
        return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 }
      case "A":
        return { 1: 0.23, 2: 0.2, 3: 0.18, 4: 0.15, 5: 0.12, 6: 0.08, 7: 0.04 }
      case "S":
        return { 1: 0.18, 2: 0.16, 3: 0.15, 4: 0.14, 5: 0.12, 6: 0.1, 7: 0.08, 8: 0.07 }
      default:
        return { 1: 0.28, 2: 0.24, 3: 0.2, 4: 0.15, 5: 0.08, 6: 0.05 } // 기본값으로 B 타입 확률 반환
    }
  }

  const getRandomTier = (probabilities: Probabilities, maxTier: number): number => {
    const rand = Math.random()
    let cumulativeProb = 0

    for (let tier = 1; tier <= maxTier; tier++) {
      cumulativeProb += probabilities[tier] || 0
      if (rand <= cumulativeProb) {
        return tier
      }
    }
    return maxTier
  }

  const getRandomCardFromTier = (tier: number, packCards: CardData[]): CardData | null => {
    const tierCards = packCards.filter((card) => card.tier === tier)
    if (tierCards.length === 0) return null
    const randomIndex = Math.floor(Math.random() * tierCards.length)
    return tierCards[randomIndex] || null
  }

  const openCardPack = (index: number): void => {
    const cardPack = inventory[index]
    if (!cardPack) {
      console.error("Card pack not found")
      return
    }
    const newCards = drawCards(cardPack)
    setOpenedCards(newCards)
    setShowModal(true)

    setInventory((prevInventory) => {
      const newInventory = [...prevInventory]
      newInventory.splice(index, 1)
      return newInventory
    })
  }

  const closeModal = (): void => {
    setShowModal(false)
    setOpenedCards([])
  }

  return (
    <div className="inventory-page">
      <h2>내 인벤토리</h2>
      {inventory && inventory.length === 0 ? (
        <div className="inventory-empty">구매한 카드팩이 없습니다.</div>
      ) : (
        <div className="pack-zone">
          <div className="inventory-list">
            {inventory &&
              inventory.map((cardPack, index) => (
                <div key={index} className="inventory-item">
                  <div className="card-pack">
                    {cardPack && cardPack.packImage ? (
                      <img
                        src={cardPack.packImage || "/placeholder.svg"}
                        alt={cardPack.name}
                        className="card-pack-image"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.onerror = null
                          target.src = "/placeholder.svg"
                        }}
                      />
                    ) : (
                      <div className="placeholder-image">No Image</div>
                    )}
                    <p>{cardPack ? `${cardPack.name}` : "Unknown Card Pack"}</p>
                    <button className="open-button" onClick={() => openCardPack(index)}>
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
            <div className="modal-card-message">새로운 카드가 나왔습니다!</div>
            <div className="modal-cards">
              {openedCards.map((card, index) => (
                <div key={index} className="modal-card">
                  {card && card.image ? (
                    <img
                      src={card.image || "/placeholder.svg"}
                      alt={card.name || "Unknown Card"}
                      className="modal-card-image"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src = "/placeholder.svg"
                      }}
                    />
                  ) : (
                    <div className="placeholder-image">이미지 없음</div>
                  )}
                  <p>{card ? `${card.name} (Tier ${card.tier})` : "Unknown Card"}</p>
                </div>
              ))}
            </div>
            <button className="close-modal" onClick={closeModal}>
              X
            </button>
          </div>
        </div>
      )}

      <Link to="/store" className="back-button">
        상점페이지
      </Link>
    </div>
  )
}
export default Inventory
export { cardsData }

