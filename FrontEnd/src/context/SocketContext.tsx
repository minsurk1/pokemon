import React, { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log("🔌 소켓 서버 연결 시도...");

    const newSocket = io("https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app", {
      path: "/socket.io", // ✅ socket.io 기본 path (명시적으로 추가)
      withCredentials: true,
      transports: ["websocket", "polling"], // ✅ fallback 허용
      autoConnect: true,
      reconnection: true, // ✅ 자동 재연결 활성화
      reconnectionAttempts: 5, // 최대 재시도 횟수
      reconnectionDelay: 1000, // 재시도 간격 (1초)
      timeout: 20000, // 연결 타임아웃 (20초)
    });

    newSocket.on("connect", () => {
      console.log("✅ 소켓 서버 연결 성공:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ 소켓 연결 실패:", err.message);
    });

    newSocket.on("disconnect", (reason) => {
      console.warn("⚠️ 소켓 연결 끊김:", reason);
    });

    setSocket(newSocket);

    return () => {
      console.log("🛑 소켓 연결 종료");
      newSocket.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={{ socket }}>{children}</SocketContext.Provider>;
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
