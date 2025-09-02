"use client";
import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";
import { UserProvider } from "./context/UserContext";

// 페이지 컴포넌트
import LoginPage from "./pages/Login/Login";
import MainPage from "./pages/Main/MainPage";
import SignUpPage from "./pages/Signup/SignUpPage";
import StorePage from "./pages/Store/StorePage";
import Inventory, { type CardPack } from "./pages/Inventory/Inventory";
import DeckPage from "./pages/Deck/DeckPage";
import BattlePage from "./pages/Battle/BattlePage";
import WaitPage from "./pages/Wait/WaitPage";
import RulePage from "./pages/Rule/RulePage";
import ProfilePage from "./pages/Profile/ProfilePage";
import Dex from "./pages/Dex/Dex";

// SocketContext
import { SocketProvider } from "./context/SocketContext";

interface UserInfo {
  nickname: string;
  money: number;
}

function App() {
  const [inventory, setInventory] = useState<CardPack[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string[]>(() => {
    const savedDeck = localStorage.getItem("selectedDeck");
    return savedDeck ? JSON.parse(savedDeck) : [];
  });
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  // 서버에서 유저 정보 가져오기
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const res = await axios.get("/api/user/me", { withCredentials: true });
        setUserInfo(res.data);
        setLoadingUser(false);
      } catch (err: any) {
        console.error("유저 정보를 불러오지 못했습니다.", err);
        setLoadingUser(false);
      }
    };
    fetchUserInfo();
  }, []);

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

            <Route
              path="/inventory"
              element={
                <Inventory inventory={inventory} setInventory={setInventory} />
              }
            />

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
