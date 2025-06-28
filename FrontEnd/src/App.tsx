"use client"
import React from "react"
import { useState } from "react"
import { BrowserRouter as Router, Route, Routes } from "react-router-dom"
import { DndProvider } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"

// 페이지 컴포넌트 임포트
import LoginPage from "./pages/Login/Login" // 로그인 페이지
import MainPage from "./pages/Main/MainPage"
import SignUpPage from "./pages/Signup/SignUpPage"
import StorePage from "./pages/Store/StorePage"
import Inventory, { type Card, type CardPack } from "./pages/Inventory/Inventory"
import DeckPage from "./pages/Deck/DeckPage"
import BattlePage from "./pages/Battle/BattlePage"
import WaitPage from "./pages/Wait/WaitPage"
import RulePage from "./pages/Rule/RulePage"
import ProfilePage from "./pages/Profile/ProfilePage"
import Dex from "./pages/Dex/Dex"

function App() {
  // 상태 관리 로직
  const [inventory, setInventory] = useState<CardPack[]>([])
  const [currency, setCurrency] = useState<number>(10000)
  const [selectedDeck, setSelectedDeck] = useState<string[]>(() => {
    const savedDeck = localStorage.getItem("selectedDeck")
    return savedDeck ? JSON.parse(savedDeck) : []
  })

  const buyCardPack = (card: Card): boolean => {
    if (currency >= card.price) {
      setCurrency((prev) => prev - card.price)
      return true
    }
    return false
  }

  const addCardsToInventory = (newCardPack: CardPack) => {
    setInventory((prev) => [...prev, newCardPack])
  }

  const handleDeckChange = (newDeck: string[]) => {
    setSelectedDeck(newDeck)
    localStorage.setItem("selectedDeck", JSON.stringify(newDeck))
  }

  return (
    <Router>
      <Routes>
        {/* 시작 페이지는 로그인 페이지 */}
        <Route path="/" element={<LoginPage />} />
        <Route path="/main" element={<MainPage currency={currency} selectedDeck={selectedDeck} />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route
          path="/store"
          element={
            <StorePage
              buyCardPack={buyCardPack}
              currency={currency}
              addCardsToInventory={addCardsToInventory}
              setCurrency={setCurrency}
            />
          }
        />
        <Route path="/inventory" element={<Inventory inventory={inventory} setInventory={setInventory} />} />
        <Route path="/deck" element={<DeckPage onDeckChange={handleDeckChange} selectedDeck={selectedDeck} />} />
        <Route
          path="/battle"
          element={
            <DndProvider backend={HTML5Backend}>
              <BattlePage selectedDeck={selectedDeck} />
            </DndProvider>
          }
        />
        <Route path="/wait" element={<WaitPage />} />
        <Route path="/rule" element={<RulePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/dex" element={<Dex />} />
      </Routes>
    </Router>
  )
}

export default App
