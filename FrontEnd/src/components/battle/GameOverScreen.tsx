"use client";
import React from "react";

interface GameOverScreenProps {
  message: string;
  isVictory: boolean; // ✅ 'isVictory' prop 추가
  onGoToMainMenu: () => void;
}

export default function GameOverScreen({ message, isVictory, onGoToMainMenu }: GameOverScreenProps) {
  // ✅ 승패에 따라 다른 CSS 클래스 적용
  const panelClassName = `game-over-panel ${isVictory ? "victory" : "defeat"}`;

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
