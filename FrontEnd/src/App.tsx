// src/App.tsx
"use client";
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
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
  // ✅ 덱 상태를 localStorage에 저장하여 BattlePage에서도 사용
  const [selectedDeck, setSelectedDeck] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("selectedDeck");
      return saved ? JSON.parse(saved) : Array(30).fill("");
    } catch {
      return Array(30).fill("");
    }
  });

  const handleDeckChange = (newDeck: string[]) => {
    setSelectedDeck(newDeck);
    localStorage.setItem("selectedDeck", JSON.stringify(newDeck));
  };

  // ✅ localStorage 동기화 (다른 탭에서도 덱 데이터 유지)
  useEffect(() => {
    const onStorageChange = (e: StorageEvent) => {
      if (e.key === "selectedDeck" && e.newValue) {
        setSelectedDeck(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", onStorageChange);
    return () => window.removeEventListener("storage", onStorageChange);
  }, []);

  // ✅ 브라우저 닫을 때 socket 끊기 (세션 깔끔하게 정리)
  useEffect(() => {
    const handleUnload = () => {
      console.log("🧹 페이지 종료 → socket disconnect 시도");
      // 전역 socket.ts의 disconnectSocket을 import 후 호출 가능
      // 또는 context에서 자동 cleanup됨
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  return (
    // ✅ SocketProvider가 앱 전체를 감싸도록 유지 (UserProvider보다 바깥쪽에 위치)
    <SocketProvider>
      <UserProvider>
        <Router>
          <Routes>
            {/* 기본 로그인 페이지 */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/main" element={<MainPage />} />
            <Route path="/store" element={<StorePage />} />
            <Route path="/inventory" element={<Inventory />} />

            {/* ✅ 덱 페이지 */}
            <Route
              path="/deck"
              element={<DeckPage selectedDeck={selectedDeck} onDeckChange={handleDeckChange} />}
            />

            {/* ✅ 대기방 페이지 (룸 코드 기반) */}
            <Route path="/wait/:roomCode" element={<WaitPage />} />

            {/* ✅ 배틀 페이지 (DnDProvider 감싸기 필수) */}
            <Route
              path="/battle/:roomCode"
              element={
                <DndProvider backend={HTML5Backend}>
                  <BattlePage selectedDeck={selectedDeck} />
                </DndProvider>
              }
            />

            {/* 기타 페이지 */}
            <Route path="/rule" element={<RulePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/dex" element={<Dex />} />

            {/* 잘못된 경로 접근 시 메인으로 리다이렉트 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </UserProvider>
    </SocketProvider>
  );
}

export default App;
