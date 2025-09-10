// App.tsx
"use client";
import React, { useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// Context
import { UserProvider } from "./context/UserContext";
import { SocketProvider } from "./context/SocketContext";

// 페이지 컴포넌트
import LoginPage from "./pages/Login/Login";
import MainPage from "./pages/Main/MainPage";
import SignUpPage from "./pages/Signup/SignUpPage";
import StorePage from "./pages/Store/StorePage";
import Inventory from "./pages/Inventory/Inventory";
import DeckPage from "./pages/Deck/DeckPage";
import BattlePage from "./pages/Battle/BattlePage";
import WaitPage from "./pages/Wait/WaitPage";
import RulePage from "./pages/Rule/RulePage";
import ProfilePage from "./pages/Profile/ProfilePage";
import Dex from "./pages/Dex/Dex";

function App() {
  const [selectedDeck, setSelectedDeck] = useState<string[]>(() => {
    const savedDeck = localStorage.getItem("selectedDeck");
    return savedDeck ? JSON.parse(savedDeck) : [];
  });

  const handleDeckChange = (newDeck: string[]) => {
    setSelectedDeck(newDeck);
    localStorage.setItem("selectedDeck", JSON.stringify(newDeck));
  };

  return (
    <SocketProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />

            <Route path="/main" element={<MainPage />} />

            <Route path="/signup" element={<SignUpPage />} />

            <Route path="/store" element={<StorePage />} />

            <Route path="/inventory" element={<Inventory />} />

            <Route
              path="/deck"
              element={
                <DeckPage
                  onDeckChange={handleDeckChange}
                  selectedDeck={selectedDeck}
                />
              }
            />

            <Route
              path="/battle/:roomCode"
              element={
                <DndProvider backend={HTML5Backend}>
                  <BattlePage selectedDeck={selectedDeck} />
                </DndProvider>
              }
            />

            <Route path="/wait/:roomCode" element={<WaitPage />} />
            <Route path="/rule" element={<RulePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dex" element={<Dex />} />
          </Routes>
        </Router>
      </UserProvider>
    </SocketProvider>
  );
}

export default App;
