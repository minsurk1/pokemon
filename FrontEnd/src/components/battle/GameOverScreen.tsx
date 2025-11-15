"use client";
import React, { useEffect } from "react";
import SoundManager from "../../utils/SoundManager"; // 🔥 반드시 추가

interface GameOverScreenProps {
  message: string;
  isVictory: boolean; // ✅ 'isVictory' prop 추가
  onGoToMainMenu: () => void;
}

export default function GameOverScreen({ message, isVictory, onGoToMainMenu }: GameOverScreenProps) {
  // ✅ 승패에 따라 다른 CSS 클래스 적용
  const panelClassName = `game-over-panel ${isVictory ? "victory" : "defeat"}`;

  // ⭐ 여기서 BGM 제어 (핵심)
  useEffect(() => {
    // 배틀 BGM 종료
    SoundManager.stopBGM();

    // 승리/패배 배너 BGM 재생
    SoundManager.playBannerBGM(isVictory ? "victory" : "defeat");

    return () => {
      // 페이지 이동 or 배너 닫힐 때 배너 BGM 종료
      SoundManager.stopBannerBGM();
    };
  }, [isVictory]);

  return (
    <div className="game-over-overlay">
      <div className={panelClassName}>
        <h2 className="game-over-message">{message}</h2>

        <div className="game-over-buttons">
          <button onClick={onGoToMainMenu} className="game-over-button">
            메인 화면으로
          </button>
        </div>
      </div>
    </div>
  );
}
