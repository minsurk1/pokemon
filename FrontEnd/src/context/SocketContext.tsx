import React, { createContext, useContext, useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    console.log("🔌 소켓 서버 연결 시도...");
    const newSocket = io(
      "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app",
      {
        withCredentials: true,
        transports: ["websocket"], // 안정적 연결
        autoConnect: true,
      }
    );

    newSocket.on("connect", () => {
      console.log("✅ 소켓 서버 연결 성공:", newSocket.id);
    });

    newSocket.on("connect_error", (err) => {
      console.error("❌ 소켓 연결 실패:", err.message);
    });

    setSocket(newSocket);

    return () => {
      console.log("🛑 소켓 연결 종료");
      newSocket.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = (): SocketContextType => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
