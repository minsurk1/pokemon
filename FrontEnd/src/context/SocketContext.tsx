import React, { createContext, useContext, useEffect, useState } from "react";
import type { ClientSocket } from "../utils/socket";
import { getSocket } from "../utils/socket";

// ✅ Context 타입을 ClientSocket으로 변경
const SocketContext = createContext<ClientSocket | null>(null);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const socket = getSocket();
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    if (!socket.connected) socket.connect();

    const handleConnect = () => setConnected(true);
    const handleDisconnect = () => setConnected(false);

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};

export const useSocket = (): ClientSocket => {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error("SocketProvider 안에서 사용해야 합니다.");
  return socket;
};
