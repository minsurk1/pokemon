// src/components/battle/CircularTimer.tsx
import React from "react";

const INITIAL_TIME = 30;

interface CircularTimerProps {
  turnTime: number; // ✅ 부모로부터 전달받을 prop
}

const CircularTimer: React.FC<CircularTimerProps> = ({ turnTime }) => {
  const getTimerColor = (timeLeft: number) => {
    const ratio = timeLeft / INITIAL_TIME;
    if (ratio > 0.75) return "#00FF00";
    if (ratio > 0.5) return "#FFFF00";
    if (ratio > 0.25) return "#FF8800";
    return "#FF0000";
  };

  const color = getTimerColor(turnTime);
  const progress = ((INITIAL_TIME - turnTime) / INITIAL_TIME) * 100;

  return (
    <div style={{ display: "flex", justifyContent: "center", margin: "10px 0" }}>
      <div
        style={{
          width: "70px",
          height: "70px",
          borderRadius: "50%",
          background: `conic-gradient(${color} ${progress * 3.6}deg, #eee 0deg)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 5px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "black",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ color, fontSize: "16px", fontWeight: "bold" }}>{turnTime}초</div>
        </div>
      </div>
    </div>
  );
};

export default CircularTimer;
