// FrontEnd/src/components/common/DraggableChat.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import { io, Socket } from "socket.io-client"; // optional: if you already have a socket, pass it via props

/**
 * FC온라인 인게임처럼: 화면에 둥둥 떠다니는 동그라미 버튼 + 클릭 시 채팅 패널 토글
 * - 마우스/터치로 자유롭게 이동 (뷰포트 경계 내 클램프)
 * - 드래그와 클릭 구분 (threshold)
 * - 닫혀 있을 때는 미확인(unread) 개수 뱃지 표시
 * - 버튼 위치/열림상태 localStorage에 저장 (새로고침 후에도 유지)
 * - 버튼 위치 기준으로 좌/우에 패널을 똑똑하게 띄움 (우측에 있으면 왼쪽으로 열림)
 * - 소켓(roomChat) 예시 포함: props.socket, props.roomCode 사용 (없으면 로컬 에코 모드)
 */

// ==== 타입 ====
export type ChatMessage = {
  id: string;
  userId: string;
  name: string;
  text: string;
  ts: number; // epoch ms
};

export type DraggableChatProps = {
  socket?: Socket; // 이미 연결된 socket.io 인스턴스 전달 (선호)
  roomCode?: string; // 방 코드 (서버 브로드캐스트용)
  myUserId?: string; // 내 식별자
  myName?: string; // 닉네임
  initialX?: number; // 초기 버튼 x (px)
  initialY?: number; // 초기 버튼 y (px)
  storageKey?: string; // 위치/상태 저장 키
};

const BTN_SIZE = 60; // 원 버튼 지름(px)
const DRAG_THRESHOLD = 2; // 드래그/클릭 구분 임계값(px)

export default function DraggableChat({
  socket,
  roomCode = "ROOM",
  myUserId = "me",
  myName = "Me",
  initialX = 24,
  initialY = 24,
  storageKey = "fc-chat",
}: DraggableChatProps) {
  // ==== 저장된 위치/상태 복구 ====
  const saved = useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, [storageKey]);

  const [open, setOpen] = useState<boolean>(saved?.open ?? false);
  const [pos, setPos] = useState<{ x: number; y: number }>({
    x: saved?.x ?? initialX,
    y: saved?.y ?? initialY,
  });

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState<number>(0);

  const btnRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef<boolean>(false);
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null);
  const posStartRef = useRef<{ x: number; y: number } | null>(null);

  const posRef = useRef(pos);
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  // ==== 저장 ====
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify({ open, x: pos.x, y: pos.y }));
  }, [open, pos, storageKey]);

  // ==== 소켓 바인딩 (선호: 외부에서 socket 전달) ====
  useEffect(() => {
    if (!socket) return; // 소켓 없으면 로컬 에코 모드로 동작
    const onRoomChat = (msg: ChatMessage) => {
      setMessages((prev) => {
        const next = [...prev, msg];
        if (!open) setUnread((u) => u + 1);
        return next;
      });
    };
    socket.on("roomChat", onRoomChat);
    return () => {
      socket.off("roomChat", onRoomChat);
    };
  }, [socket, open]);

  // ==== 패널 열릴 때 미확인 초기화 ====
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  // ==== 스크롤 유지 (새 메시지 도착 시 하단 고정) ====
  useEffect(() => {
    if (!open) return;
    const el = panelRef.current?.querySelector(".chat-scroll") as HTMLDivElement | null;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  // ==== 드래그 로직 ====
  useEffect(() => {
    const btn = btnRef.current;
    if (!btn) return;

    let moving = false;

    const onPointerDown = (e: PointerEvent) => {
      btn.setPointerCapture(e.pointerId);
      pointerStartRef.current = { x: e.clientX, y: e.clientY };
      posStartRef.current = { ...posRef.current };
      draggingRef.current = false;
      moving = true;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!moving || !pointerStartRef.current || !posStartRef.current) return;
      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      const dist = Math.hypot(dx, dy);

      if (dist > DRAG_THRESHOLD) draggingRef.current = true;

      // 새 위치 계산 + 경계 클램프
      const maxX = document.documentElement.clientWidth - BTN_SIZE - 8;
      const maxY = document.documentElement.clientHeight - BTN_SIZE - 8;

      const nx = clamp(posStartRef.current.x + dx, 8, maxX);
      const ny = clamp(posStartRef.current.y + dy, 8, maxY);

      setPos({ x: nx, y: ny });
    };

    const onPointerUp = (e: PointerEvent) => {
      moving = false;
      try {
        btn.releasePointerCapture(e.pointerId);
      } catch {}

      if (!pointerStartRef.current) return;

      const dx = e.clientX - pointerStartRef.current.x;
      const dy = e.clientY - pointerStartRef.current.y;
      const dist = Math.hypot(dx, dy);

      // ✅ 드래그 거리 3px 미만 → 클릭으로 판정
      if (dist < 3) {
        setOpen((o) => !o);
      }
      // ✅ 3px 이상 → 드래그로 판정 → 토글 금지
    };

    btn.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      btn.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  // ==== 메시지 전송 ====
  const send = () => {
    const text = input.trim();
    if (!text) return;
    const msg: ChatMessage = {
      id: cryptoRandomId(),
      userId: myUserId,
      name: myName,
      text,
      ts: Date.now(),
    };

    if (socket) {
      socket.emit("roomChat", { roomCode, ...msg });
    } else {
      // 로컬 에코 (소켓 없을 때도 컴포넌트 데모 가능)
      setTimeout(() => setMessages((prev) => [...prev, msg]), 0);
    }

    setInput("");
  };

  const onKeyDownInput: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter") send();
    if (e.key === "Escape") setOpen(false);
  };

  // ==== 패널 방향 (버튼이 오른쪽에 있으면 왼쪽으로 띄우기) ====
  const openLeft = pos.x > window.innerWidth / 2;
  const panelStyle: React.CSSProperties = {
    position: "fixed",
    top: pos.y + BTN_SIZE / 2 - 200,
    left: openLeft ? pos.x - 320 : pos.x + BTN_SIZE,
    width: 300,
    height: 400,
    borderRadius: 16,
    background: "rgba(20,20,24,0.96)",
    color: "#fff",
    boxShadow: "0 8px 28px rgba(0,0,0,0.45)",
    border: "1px solid rgba(255,255,255,0.08)",
    display: open ? "flex" : "none",
    flexDirection: "column",
    zIndex: 10000,
    backdropFilter: "saturate(140%) blur(6px)",
    pointerEvents: open ? "auto" : "none", // ✅ 추가
  };

  const btnStyle: React.CSSProperties = {
    position: "fixed",
    left: pos.x,
    top: pos.y,
    width: BTN_SIZE,
    height: BTN_SIZE,
    borderRadius: BTN_SIZE,
    background: "#1f6feb",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 6px 18px rgba(31,111,235,0.45)",
    border: "none",
    cursor: "grab",
    zIndex: 10001,
  };

  return (
    <>
      {/* 패널 */}
      <div ref={panelRef} style={panelStyle} aria-label="방 채팅">
        {/* 헤더 */}
        <div
          style={{
            padding: "10px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>방 채팅</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setOpen(false)} style={iconBtnStyle} aria-label="닫기">
              ✕
            </button>
          </div>
        </div>

        {/* 메시지 영역 */}
        <div
          className="chat-scroll"
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "10px 12px",
          }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                margin: "8px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: m.userId === myUserId ? "flex-end" : "flex-start",
              }}
            >
              {/* 닉네임 라벨 */}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 1,
                  color: m.userId === myUserId ? "#8ab4ff" : "#a6e3ff",
                  letterSpacing: "-0.3px",
                  textShadow: "0 0 6px rgba(130,170,255,0.4)",
                }}
              >
                [{m.name}]
              </div>

              {/* 말풍선 */}
              <div
                style={{
                  maxWidth: 230,
                  background: m.userId === myUserId ? "rgba(60,110,255,0.95)" : "rgba(42,46,57,0.95)",
                  padding: "10px 12px",
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "#ffffff",
                  fontSize: 14,
                  lineHeight: "1.45",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
                  backdropFilter: "blur(4px)",
                }}
              >
                {m.text}
              </div>
            </div>
          ))}
        </div>

        {/* 입력 영역 */}
        <div
          style={{
            padding: 10,
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            gap: 8,
          }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDownInput}
            placeholder="메시지 입력..."
            style={{
              flex: 1,
              background: "#16181d",
              color: "#fff",
              border: "1px solid #2a2e39",
              borderRadius: 10,
              padding: "10px 12px",
              outline: "none",
            }}
          />
          <button onClick={send} style={sendBtnStyle} aria-label="전송">
            전송
          </button>
        </div>
      </div>

      {/* 동그라미 버튼 */}
      <button ref={btnRef} style={btnStyle} title={open ? "채팅 닫기" : "채팅 열기"} aria-label={open ? "채팅 닫기" : "채팅 열기"}>
        {/* 아이콘 + 뱃지 */}
        <span style={{ fontSize: 22, transform: "translateY(-1px)" }}>💬</span>
        {unread > 0 && <span style={badgeStyle}>{unread > 99 ? "99+" : unread}</span>}
      </button>
    </>
  );
}

// ===== 유틸 =====
const iconBtnStyle: React.CSSProperties = {
  background: "#232734",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "6px 8px",
  borderRadius: 8,
  cursor: "pointer",
};

const sendBtnStyle: React.CSSProperties = {
  background: "#2b6fff",
  color: "#fff",
  border: "none",
  padding: "10px 14px",
  borderRadius: 10,
  cursor: "pointer",
  boxShadow: "0 2px 8px rgba(31,111,235,0.4)",
};

const badgeStyle: React.CSSProperties = {
  position: "absolute",
  right: -6,
  top: -6,
  minWidth: 20,
  height: 20,
  padding: "0 6px",
  borderRadius: 10,
  background: "#ff3b30",
  color: "#fff",
  fontSize: 12,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function cryptoRandomId() {
  // 브라우저 지원 시 crypto 사용
  const c = (globalThis as any).crypto?.getRandomValues?.(new Uint32Array(2));
  if (c) return [...c].map((n) => n.toString(16)).join("");
  // 폴백
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/**
 * =====================
 * 🔌 서버/클라이언트 연동 가이드
 * =====================
 *
 * // 서버 (Socket.IO)
 * io.on("connection", (socket) => {
 *   socket.on("roomChat", ({ roomCode, ...msg }) => {
 *     // msg: { id, userId, name, text, ts }
 *     io.to(roomCode).emit("roomChat", msg);
 *   });
 * });
 *
 * // 클라이언트 사용 예 (BattlePage 등)
 * <DraggableChat socket={socket} roomCode={roomCode} myUserId={user._id} myName={user.nickname} />
 */
