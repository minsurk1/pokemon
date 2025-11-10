import { io } from "socket.io-client";

// ✅ Socket 타입은 io()의 반환 타입을 그대로 사용한다
export type ClientSocket = ReturnType<typeof io>;

let socketInstance: ClientSocket | null = null;

export const getSocket = (): ClientSocket => {
  if (!socketInstance) {
    socketInstance = io("https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app", {
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 500,
      withCredentials: true,
    });

    console.log("🌐 socket instance created");
  }

  return socketInstance;
};

export const disconnectSocket = () => {
  if (socketInstance) socketInstance.disconnect();
};
