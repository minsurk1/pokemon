import { useState } from "react"
import { Link } from "react-router-dom"
import "./Inventory.css"

const cardsData = [
  { name: "파이리", tier: 1, image: require("./assets/images/firetier1.png"), attack: 10, hp: 25 },
  { name: "포니타", tier: 2, image: require("./assets/images/firetier2.png"), attack: 40, hp: 100 },
  { name: "부스터", tier: 3, image: require("./assets/images/firetier3.png"), attack: 70, hp: 175 },
  { name: "윈디", tier: 4, image: require("./assets/images/firetier4.png"), attack: 110, hp: 275 },
  { name: "초염몽", tier: 5, image: require("./assets/images/firetier5.png"), attack: 150, hp: 375 },
  { name: "리자몽", tier: 6, image: require("./assets/images/firetier6.png"), attack: 200, hp: 500 },
  { name: "레시라무", tier: 7, image: require("./assets/images/firetier7.png"), attack: 300, hp: 750 },

  { name: "꼬부기", tier: 1, image: require("./assets/images/watertier1.png"), attack: 10, hp: 25 },
  { name: "고라파덕", tier: 2, image: require("./assets/images/watertier2.png"), attack: 40, hp: 100 },
  { name: "샤미드", tier: 3, image: require("./assets/images/watertier3.png"), attack: 70, hp: 175 },
  { name: "라프라스", tier: 4, image: require("./assets/images/watertier4.png"), attack: 110, hp: 275 },
  { name: "갸라도스", tier: 5, image: require("./assets/images/watertier5.png"), attack: 150, hp: 375 },
  { name: "거북왕", tier: 6, image: require("./assets/images/watertier6.png"), attack: 200, hp: 500 },
  { name: "가이오가", tier: 7, image: require("./assets/images/watertier7.png"), attack: 300, hp: 750 },

  { name: "이상해씨", tier: 1, image: require("./assets/images/foresttier1.png"), attack: 10, hp: 25 },
  { name: "모다피", tier: 2, image: require("./assets/images/foresttier2.png"), attack: 40, hp: 100 },
  { name: "리피아", tier: 3, image: require("./assets/images/foresttier3.png"), attack: 70, hp: 175 },
  { name: "나시", tier: 4, image: require("./assets/images/foresttier4.png"), attack: 110, hp: 275 },
  { name: "토대부기", tier: 5, image: require("./assets/images/foresttier5.png"), attack: 150, hp: 375 },
  { name: "이상해꽃", tier: 6, image: require("./assets/images/foresttier6.png"), attack: 200, hp: 500 },
  { name: "세레비", tier: 7, image: require("./assets/images/foresttier7.png"), attack: 300, hp: 750 },

  { name: "플러쉬", tier: 1, image: require("./assets/images/electrictier1.png"), attack: 10, hp: 25 },
  { name: "라이츄", tier: 2, image: require("./assets/images/electrictier2.png"), attack: 40, hp: 100 },
  { name: "전룡", tier: 3, image: require("./assets/images/electrictier3.png"), attack: 70, hp: 175 },
  { name: "자포코일", tier: 4, image: require("./assets/images/electrictier4.png"), attack: 110, hp: 275 },
  { name: "볼트로스", tier: 5, image: require("./assets/images/electrictier5.png"), attack: 150, hp: 375 },
  { name: "피카츄", tier: 6, image: require("./assets/images/electrictier6.png"), attack: 200, hp: 500 },
  { name: "썬더", tier: 7, image: require("./assets/images/electrictier7.png"), attack: 300, hp: 750 },

  { name: "찌르꼬", tier: 1, image: require("./assets/images/flytier1.png"), attack: 10, hp: 25 },
  { name: "깨비참", tier: 2, image: require("./assets/images/flytier2.png"), attack: 40, hp: 100 },
  { name: "구구", tier: 3, image: require("./assets/images/flytier3.png"), attack: 70, hp: 175 },
  { name: "깨비드릴조", tier: 4, image: require("./assets/images/flytier4.png"), attack: 110, hp: 275 },
  { name: "무장조", tier: 5, image: require("./assets/images/flytier5.png"), attack: 150, hp: 375 },
  { name: "토네로스", tier: 6, image: require("./assets/images/flytier6.png"), attack: 200, hp: 500 },
  { name: "루기아", tier: 7, image: require("./assets/images/flytier7.png"), attack: 300, hp: 750 },

  { name: "꾸꾸리", tier: 1, image: require("./assets/images/icetier1.png"), attack: 10, hp: 25 },
  { name: "메꾸리", tier: 2, image: require("./assets/images/icetier2.png"), attack: 40, hp: 100 },
  { name: "빙큐보", tier: 3, image: require("./assets/images/icetier3.png"), attack: 70, hp: 175 },
  { name: "얼음귀신", tier: 4, image: require("./assets/images/icetier4.png"), attack: 110, hp: 275 },
  { name: "크레베이이스", tier: 5, image: require("./assets/images/icetier5.png"), attack: 150, hp: 375 },
  { name: "레지아이스", tier: 6, image: require("./assets/images/icetier6.png"), attack: 200, hp: 500 },
  { name: "프리져", tier: 7, image: require("./assets/images/icetier7.png"), attack: 300, hp: 750 },

  { name: "톱치", tier: 1, image: require("./assets/images/landtier1.png"), attack: 10, hp: 25 },
  { name: "코코리", tier: 2, image: require("./assets/images/landtier2.png"), attack: 40, hp: 100 },
  { name: "히포포타스", tier: 3, image: require("./assets/images/landtier3.png"), attack: 70, hp: 175 },
  { name: "대코파스", tier: 4, image: require("./assets/images/landtier4.png"), attack: 110, hp: 275 },
  { name: "맘모꾸리", tier: 5, image: require("./assets/images/landtier5.png"), attack: 150, hp: 375 },
  { name: "한카리아스", tier: 6, image: require("./assets/images/landtier6.png"), attack: 200, hp: 500 },
  { name: "그란돈", tier: 7, image: require("./assets/images/landtier7.png"), attack: 300, hp: 750 },

  { name: "부우부", tier: 1, image: require("./assets/images/normaltier1.png"), attack: 10, hp: 25 },
  { name: "하데리어", tier: 2, image: require("./assets/images/normaltier2.png"), attack: 40, hp: 100 },
  { name: "다부니", tier: 3, image: require("./assets/images/normaltier3.png"), attack: 70, hp: 175 },
  { name: "해피너스", tier: 4, image: require("./assets/images/normaltier4.png"), attack: 110, hp: 275 },
  { name: "링곰", tier: 5, image: require("./assets/images/normaltier5.png"), attack: 150, hp: 375 },
  { name: "켄타로스", tier: 6, image: require("./assets/images/normaltier6.png"), attack: 200, hp: 500 },
  { name: "레지기가스", tier: 7, image: require("./assets/images/normaltier7.png"), attack: 300, hp: 750 },

  { name: "아보", tier: 1, image: require("./assets/images/poisontier1.png"), attack: 10, hp: 25 },
  { name: "니드리나", tier: 2, image: require("./assets/images/poisontier2.png"), attack: 40, hp: 100 },
  { name: "독개굴", tier: 3, image: require("./assets/images/poisontier3.png"), attack: 70, hp: 175 },
  { name: "펜드라", tier: 4, image: require("./assets/images/poisontier4.png"), attack: 110, hp: 275 },
  { name: "니드킹", tier: 5, image: require("./assets/images/poisontier5.png"), attack: 150, hp: 375 },
  { name: "독침붕", tier: 6, image: require("./assets/images/poisontier6.png"), attack: 200, hp: 500 },
  { name: "무한다이노", tier: 7, image: require("./assets/images/poisontier7.png"), attack: 300, hp: 750 },

  { name: "과사삭벌레", tier: 1, image: require("./assets/images/wormtier1.png"), attack: 10, hp: 25 },
  { name: "두루지벌레", tier: 2, image: require("./assets/images/wormtier2.png"), attack: 40, hp: 100 },
  { name: "케터피", tier: 3, image: require("./assets/images/wormtier3.png"), attack: 70, hp: 175 },
  { name: "실쿤", tier: 4, image: require("./assets/images/wormtier4.png"), attack: 110, hp: 275 },
  { name: "파라섹트", tier: 5, image: require("./assets/images/wormtier5.png"), attack: 150, hp: 375 },
  { name: "핫삼", tier: 6, image: require("./assets/images/wormtier6.png"), attack: 200, hp: 500 },
  { name: "게노세크트", tier: 7, image: require("./assets/images/wormtier7.png"), attack: 300, hp: 750 },

  { name: "요가랑", tier: 1, image: require("./assets/images/espertier1.png"), attack: 10, hp: 25 },
  { name: "랄토스", tier: 2, image: require("./assets/images/espertier2.png"), attack: 40, hp: 100 },
  { name: "에브이", tier: 3, image: require("./assets/images/espertier3.png"), attack: 70, hp: 175 },
  { name: "고디모아젤", tier: 4, image: require("./assets/images/espertier4.png"), attack: 110, hp: 275 },
  { name: "가디안", tier: 5, image: require("./assets/images/espertier5.png"), attack: 150, hp: 375 },
  { name: "뮤", tier: 6, image: require("./assets/images/espertier6.png"), attack: 200, hp: 500 },
  { name: "뮤츠", tier: 7, image: require("./assets/images/espertier7.png"), attack: 300, hp: 750 },

  { name: "디아루가", tier: 8, image: require("./assets/images/legendtier1.png"), attack: 400, hp: 1000 },
  { name: "펄기아", tier: 8, image: require("./assets/images/legendtier2.png"), attack: 400, hp: 1000 },
  { name: "기라티나", tier: 8, image: require("./assets/images/legendtier3.png"), attack: 400, hp: 1000 },
  { name: "제크로무", tier: 8, image: require("./assets/images/legendtier4.png"), attack: 400, hp: 1000 },
  { name: "큐레무", tier: 8, image: require("./assets/images/legendtier5.png"), attack: 400, hp: 1000 },
  { name: "레쿠자", tier: 8, image: require("./assets/images/legendtier6.png"), attack: 400, hp: 1000 },
  { name: "아르세우스", tier: 8, image: require("./assets/images/legendtier7.png"), attack: 400, hp: 1000 },
]

function Inventory({ inventory, setInventory }) {
  const [showModal, setShowModal] = useState(false)
  const [openedCards, setOpenedCards] = useState([])


  const drawCards = (cardPack) => {
    const drawnCards = []
    const packCards = cardsData.filter((card) => card && card.image)

    const maxTier = cardPack.type === "B" ? 6 : cardPack.type === "A" ? 7 : 8

    const probabilities = getProbabilities(cardPack.type)

    for (let i = 0; i < 5; i++) {
      const randomTier = getRandomTier(probabilities, maxTier)
      const randomCard = getRandomCardFromTier(randomTier, packCards)
      drawnCards.push(randomCard)
    }
    return drawnCards
  }

  const getProbabilities = (packType) => {
    switch (packType) {
      case "B":
        return { 1: 0.3, 2: 0.25, 3: 0.2, 4: 0.15, 5: 0.07, 6: 0.03 }
      case "A":
        return { 1: 0.25, 2: 0.22, 3: 0.18, 4: 0.15, 5: 0.1, 6: 0.07, 7: 0.03 }
      case "S":
        return { 1: 0.2, 2: 0.18, 3: 0.16, 4: 0.14, 5: 0.12, 6: 0.1, 7: 0.08, 8: 0.02 }
    }
  }

  const getRandomTier = (probabilities, maxTier) => {
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

  const getRandomCardFromTier = (tier, packCards) => {
    const tierCards = packCards.filter((card) => card.tier === tier)
    const randomIndex = Math.floor(Math.random() * tierCards.length)
    return tierCards[randomIndex] || null
  }

  const openCardPack = (index) => {
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

  const closeModal = () => {
    setShowModal(false)
    setOpenedCards([])
  }

  return (
    <div className="inventory-page">
      <h2>내 인벤토리</h2>
      {inventory && inventory.length === 0 ? (
        <div className="inventory-empty">구매한 카드팩이 없습니다.</div>
      ) : (
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
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg"
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
                        e.target.onerror = null
                        e.target.src = "/placeholder.svg"
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
export {cardsData};
export default Inventory

