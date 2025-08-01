"use client"
import React from "react"

interface GameOverScreenProps {
  message: string
  onRestart: () => void 
  onGoToMainMenu: () => void 
}

export default function GameOverScreen({ message, onRestart, onGoToMainMenu }: GameOverScreenProps) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-panel">
        <h2 className="game-over-message">{message}</h2>
        <div className="game-over-buttons">
          <button onClick={onRestart} className="game-over-button">
            다시 시작
          </button>
          <button onClick={onGoToMainMenu} className="game-over-button">
            메인 메뉴
          </button>
        </div>
      </div>
    </div>
  )
}
