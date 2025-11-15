"use client";
import React, { useEffect } from "react";
import SoundManager from "../../utils/SoundManager";

interface GameOverScreenProps {
  message: string;
  isVictory: boolean;
  onGoToMainMenu: () => void;
}

export default function GameOverScreen({ message, isVictory, onGoToMainMenu }: GameOverScreenProps) {
  const panelClassName = `game-over-panel ${isVictory ? "victory" : "defeat"}`;

  useEffect(() => {
    // 배너 BGM 재생
    SoundManager.playBannerBGM(isVictory ? "victory" : "defeat");

    return () => {
      // GameOverScreen이 사라질 때 BGM 정지
      SoundManager.stopBannerBGM();
    };
  }, [isVictory]);

  return (
    <div className="game-over-overlay">
      <div className={panelClassName}>
        <h2 className="game-over-message">{message}</h2>

        <div className="game-over-buttons">
          <button
            onClick={() => {
              SoundManager.stopBannerBGM(); // 🔥 버튼 클릭 시 즉시 정지
              onGoToMainMenu();
            }}
            className="game-over-button"
          >
            메인 화면으로
          </button>
        </div>
      </div>
    </div>
  );
}
