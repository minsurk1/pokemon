// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "../utils/socket"; // ✅ 싱글톤 가져오기

interface SocketContextType {
  socket: Socket;
  connected: boolean;
}

// ✅ Context 생성
const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = getSocket(); // ✅ 항상 동일한 인스턴스
  const [connected, setConnected] = useState<boolean>(socket.connected);

  useEffect(() => {
    // ✅ 연결 시도 (한 번만)
    if (!socket.connected) {
      console.log("🔌 Socket 연결 시도...");
      socket.connect();
    }

    // ✅ 연결 이벤트 핸들링
    const handleConnect = () => {
      console.log("✅ Socket 연결 성공:", socket.id);
      setConnected(true);
    };

    const handleDisconnect = (reason: string) => {
      console.warn("⚠️ Socket 연결 끊김:", reason);
      setConnected(false);
    };

    const handleError = (err: any) => {
      console.error("❌ Socket 오류:", err.message || err);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleError);

    // ✅ cleanup
    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      // ❗ socket.disconnect()는 호출하지 않음 (SPA에서 유지)
      console.log("🧹 SocketContext cleanup (disconnect 안 함)");
    };
  }, [socket]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

// ✅ 커스텀 훅
export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket은 반드시 <SocketProvider> 내부에서 사용해야 합니다.");
  }
  return context;
};
