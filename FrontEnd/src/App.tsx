"use client";
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// 페이지 컴포넌트 임포트
import LoginPage from "./pages/Login/Login";
import MainPage from "./pages/Main/MainPage";
import SignUpPage from "./pages/Signup/SignUpPage";
import StorePage from "./pages/Store/StorePage";
import Inventory, { type Card, type CardPack } from "./pages/Inventory/Inventory";
import DeckPage from "./pages/Deck/DeckPage";
import BattlePage from "./pages/Battle/BattlePage";
import WaitPage from "./pages/Wait/WaitPage";
import RulePage from "./pages/Rule/RulePage";
import ProfilePage from "./pages/Profile/ProfilePage";
import Dex from "./pages/Dex/Dex";

// SocketContext 임포트
import { SocketProvider } from "./context/SocketContext";

function App() {
  // 상태 관리
  const [inventory, setInventory] = useState<CardPack[]>([]);
  const [currency, setCurrency] = useState<number>(10000);
  const [selectedDeck, setSelectedDeck] = useState<string[]>(() => {
    const savedDeck = localStorage.getItem("selectedDeck");
    return savedDeck ? JSON.parse(savedDeck) : [];
  });

  const buyCardPack = (card: Card): boolean => {
    if (currency >= card.price) {
      setCurrency(prev => prev - card.price);
      return true;
    }
    return false;
  };

  const addCardsToInventory = (newCardPack: CardPack) => {
    setInventory(prev => [...prev, newCardPack]);
  };

  const handleDeckChange = (newDeck: string[]) => {
    setSelectedDeck(newDeck);
    localStorage.setItem("selectedDeck", JSON.stringify(newDeck));
  };

  return (
    <SocketProvider>
      <Router>
        <Routes>
          {/* 로그인 */}
          <Route path="/" element={<LoginPage />} />

          {/* 메인 */}
          <Route path="/main" element={<MainPage currency={currency} selectedDeck={selectedDeck} />} />

          {/* 회원가입 */}
          <Route path="/signup" element={<SignUpPage />} />

          {/* 상점 */}
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

          {/* 인벤토리 */}
          <Route
            path="/inventory"
            element={<Inventory inventory={inventory} setInventory={setInventory} />}
          />

          {/* 덱 */}
          <Route
            path="/deck"
            element={<DeckPage onDeckChange={handleDeckChange} selectedDeck={selectedDeck} />}
          />

          {/* 배틀 - roomCode 포함 */}
          <Route
            path="/battle/:roomCode"
            element={
              <DndProvider backend={HTML5Backend}>
                <BattlePage selectedDeck={selectedDeck} />
              </DndProvider>
            }
          />

          {/* 대기실 */}
          <Route path="/wait/:roomCode" element={<WaitPage />} />

          {/* 룰 */}
          <Route path="/rule" element={<RulePage />} />

          {/* 프로필 */}
          <Route path="/profile" element={<ProfilePage />} />

          {/* 도감 */}
          <Route path="/dex" element={<Dex />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
