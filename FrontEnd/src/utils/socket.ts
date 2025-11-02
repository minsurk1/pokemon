// src/utils/socket.ts
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";

// ✅ 전역 Socket 싱글톤 저장
let socketInstance: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;

export const getSocket = (): Socket<DefaultEventsMap, DefaultEventsMap> => {
  if (!socketInstance) {
    socketInstance = io("https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app", {
      transports: ["websocket"],
      autoConnect: false, // ✅ Provider에서 직접 connect()
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      withCredentials: true,
    });

    console.log("🌐 socket instance created");
  }

  return socketInstance;
};

// ✅ 로그아웃 등에서 사용
export const disconnectSocket = () => {
  if (socketInstance) socketInstance.disconnect();
};
