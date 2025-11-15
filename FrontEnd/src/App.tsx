// src/App.tsx
"use client";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

// ✅ 공통 타입 import
import { Card } from "./types/Card";
import SoundManager from "./utils/SoundManager";

// Context
import { UserProvider } from "./context/UserContext";
import { SocketProvider } from "./context/SocketContext";

// Pages
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
  // ✅ 실제 카드 객체 배열 상태 (공통 타입 Card 사용)
  const [selectedDeck, setSelectedDeck] = useState<Card[]>([]);

  // ✅ 로그인된 유저의 덱 불러오기
  useEffect(() => {
    const fetchUserDeck = async () => {
      try {
        const token = localStorage.getItem("token"); // 로그인 시 저장된 JWT
        if (!token) {
          console.warn("❌ 토큰이 없습니다. 로그인 후 이용해주세요.");
          return;
        }

        const response = await fetch("https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/api/userdeck/single", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) throw new Error("덱 불러오기 실패");
        const data = await response.json();

        const cards = data?.deck?.cards || [];
        if (Array.isArray(cards)) {
          // ✅ 백엔드 구조에 맞춰서 Card 타입으로 변환
          const formatted: Card[] = cards.map((c: any, i: number) => ({
            id: c._id || `card-${i}`,
            cardId: c.cardId || c._id || `card-${i}`,
            name: c.name,
            image: c.image,
            attack: c.attack,
            hp: c.hp,
            maxhp: c.maxhp,
            cost: c.cost,
            tier: c.tier,
          }));

          setSelectedDeck(formatted);
          console.log("✅ 유저 덱 불러오기 성공:", formatted);
        } else {
          console.warn("⚠️ 덱 카드 데이터가 비어있습니다.");
        }
      } catch (err) {
        console.error("❌ 유저 덱 불러오기 중 오류:", err);
      }
    };

    fetchUserDeck();
  }, []);

  useEffect(() => {
    SoundManager.init();

    const startAudioOnInteraction = () => {
      SoundManager.playGlobalBGM();
      window.removeEventListener("click", startAudioOnInteraction);
    };

    window.addEventListener("click", startAudioOnInteraction);
  }, []);

  useEffect(() => {
    const handleMute = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "m") {
        const muted = SoundManager.toggleGlobalMute();
        console.log("🔇 Global BGM mute =", muted);
      }
    };

    window.addEventListener("keydown", handleMute);
    return () => window.removeEventListener("keydown", handleMute);
  }, []);

  // ✅ 브라우저 종료 시 socket 정리
  useEffect(() => {
    const handleUnload = () => console.log("🧹 페이지 종료: socket disconnect 예정");
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return (
    <SocketProvider>
      <UserProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/inventory" element={<Inventory />} />

            {/* ✅ 덱 페이지 */}
            <Route
              path="/deck"
              element={
                <DeckPage
                  selectedDeck={selectedDeck.map((c) => c.image ?? "").filter(Boolean)}
                  onDeckChange={(imgs) =>
                    setSelectedDeck((prev) =>
                      imgs.map((img, i) => ({
                        ...prev[i],
                        image: img,
                      }))
                    )
                  }
                />
              }
            />

            {/* ✅ 대기방 */}
            <Route path="/wait/:roomCode" element={<WaitPage />} />

            {/* ✅ 배틀 페이지 (DnDProvider로 감싸기) */}
            <Route
              path="/battle/:roomCode"
              element={
                <DndProvider backend={HTML5Backend}>
                  <BattlePage selectedDeck={selectedDeck} />
                </DndProvider>
              }
            />

            <Route path="/rule" element={<RulePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dex" element={<Dex />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </SocketProvider>
  );
}

export default App;
