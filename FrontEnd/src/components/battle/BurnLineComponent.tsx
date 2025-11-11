// src/components/battle/BurnLineComponent.tsx
import React from "react";

interface BurnLineProps {
  timeLeft: number; // 남은 시간 (초)
  isMyTurn: boolean; // 현재 내 턴 여부
}

const INITIAL_TIME = 30;

const BurnLineComponent: React.FC<BurnLineProps> = ({ timeLeft, isMyTurn }) => {
  // 내 턴이 아닐 때는 흰색 고정 라인
  if (!isMyTurn) {
    return <div className="horizontal-line" style={{ background: "#ffffff" }} />;
  }

  // 진행 비율 계산
  const progress = ((INITIAL_TIME - timeLeft) / INITIAL_TIME) * 100;

  // 진행 정도에 따른 색상 변화
  const color =
    progress < 25
      ? "#00FF00" // 녹색
      : progress < 50
      ? "#FFFF00" // 노랑
      : progress < 75
      ? "#FF8800" // 주황
      : "#FF0000"; // 빨강

  return (
    <div
      className="horizontal-line"
      style={{
        background: `linear-gradient(to right, ${color} ${progress}%, #ffffff ${progress}%)`,
        height: "6px",
        width: "100%",
        borderRadius: "3px",
        transition: "background 0.3s linear",
      }}
    />
  );
};

export default BurnLineComponent;
