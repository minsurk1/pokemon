// src/utils/socket.ts
import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";

// ✅ 전역 Socket 싱글톤
let socketInstance: Socket<DefaultEventsMap, DefaultEventsMap> | null = null;

/**
 * getSocket()
 * - socket.io 클라이언트를 싱글톤으로 유지하여
 *   페이지 이동 시 새로운 연결이 생기지 않도록 함.
 * - autoConnect: false 로 설정 → 앱 최상단(Context 등)에서 수동 connect()
 */
export const getSocket = (): Socket<DefaultEventsMap, DefaultEventsMap> => {
  if (!socketInstance) {
    socketInstance = io("https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app", {
      transports: ["websocket"],
      withCredentials: true,
      autoConnect: false, // ❌ 페이지별 자동 연결 금지
      reconnection: true, // ✅ 자동 재연결 허용 (네트워크 끊김 대응)
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    // ====== 디버그용 로그 ======
    socketInstance.on("connect", () => {
      console.log("🟢 [socket] 연결됨:", socketInstance?.id);
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("🔴 [socket] 연결 끊김:", reason);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ [socket] 연결 오류:", err.message);
    });
  }

  return socketInstance;
};

/**
 * disconnectSocket()
 * - 수동으로 연결을 해제하고 싶을 때 사용 (로그아웃 등)
 */
export const disconnectSocket = () => {
  if (socketInstance && socketInstance.connected) {
    console.log("🔌 [socket] 연결 해제 호출");
    socketInstance.disconnect();
  }
};
