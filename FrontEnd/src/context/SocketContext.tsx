// src/context/SocketContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import type { Socket } from "socket.io-client";
import { getSocket } from "../utils/socket"; // ✅ 싱글톤 가져오기

// ✅ Context 타입: Socket 또는 null
const SocketContext = createContext<Socket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = getSocket(); // 항상 동일한 인스턴스
  const [connected, setConnected] = useState<boolean>(socket.connected);

  useEffect(() => {
    if (!socket.connected) {
      console.log("🔌 Socket 연결 시도...");
      socket.connect();
    }

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

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleError);
      console.log("🧹 SocketContext cleanup");
    };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

// ✅ 커스텀 훅: Socket 객체 직접 반환
export const useSocket = (): Socket => {
  const socket = useContext(SocketContext);
  if (!socket) {
    throw new Error("useSocket은 반드시 <SocketProvider> 내부에서 사용해야 합니다.");
  }
  return socket;
};
