import { Server, Socket } from "socket.io";
import { initializeBattle } from "./battle"; // ✅ 전투 초기화 연결
import { RoomInfo } from "../types/gameTypes"; // ✅ 공통 타입 사용

// ✅ 모든 방 상태 저장소
export const rooms: Record<string, RoomInfo> = {};

/**
 * 🏠 roomHandler - 대기실 관리 전용
 */
export default function roomHandler(io: Server, socket: Socket) {
  console.log(`🔵 새로운 클라이언트 연결: ${socket.id}`);

  const INITIAL_HP = 2000;
  const TURN_TIME = 30;

  /**
   * 🏗️ 방 생성 (방장 전용)
   */
  socket.on("createRoom", () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    rooms[roomCode] = {
      hostId: socket.id, // 방장
      players: [socket.id], // 현재 방 인원
      ready: { [socket.id]: false }, // 각 플레이어 준비 상태
      hp: { [socket.id]: INITIAL_HP }, // 대기 중 체력 초기값 (전투용과는 별개)
      turnIndex: 0, // 턴 순서 인덱스
      timeLeft: TURN_TIME, // 기본 타이머 설정
      gameState: null, // 전투 시작 전까지 null
    };

    socket.join(roomCode);
    socket.emit("roomCreated", { roomCode, isHost: true });

    console.log(`✅ 방 생성됨: ${roomCode}, 호스트: ${socket.id}`);
  });

  /**
   * 🏠 방 참여
   */
  socket.on("joinRoom", (roomCode: string) => {
    console.log(`▶ joinRoom 수신 ${socket.id} -> ${roomCode}`);

    const room = rooms[roomCode];
    if (!room) {
      socket.emit("roomNotFound");
      console.log(`❌ 존재하지 않는 방: ${roomCode}`);
      return;
    }

    // ✅ 이미 들어와 있는 경우
    if (room.players.includes(socket.id)) {
      socket.emit("roomJoined", {
        roomCode,
        isHost: room.players[0] === socket.id,
      });
      console.log(`⚠️ ${socket.id}는 이미 ${roomCode} 방에 있음`);
      return;
    }

    // 🚫 인원 초과
    if (room.players.length >= 2) {
      socket.emit("roomFull");
      console.log(`🚫 ${roomCode} 방이 가득 참`);
      return;
    }

    // ✅ 정상 입장 처리
    room.players.push(socket.id);
    socket.join(roomCode);

    // === 추가: 새 플레이어 상태 초기화 ===
    const INITIAL_COST = 1;

    room.ready[socket.id] = false;
    room.hp[socket.id] = INITIAL_HP;

    // 만약 gameState가 이미 존재한다면(방장이 생성 시 초기화했다면) → player2 필드 추가
    if (room.gameState) {
      room.gameState.hp[socket.id] = INITIAL_HP;
      room.gameState.cost[socket.id] = INITIAL_COST;
      room.gameState.cardsInZone[socket.id] = [];
      room.gameState.decks[socket.id] = [];
      room.gameState.hands[socket.id] = [];
      room.gameState.graveyards[socket.id] = [];
    }

    const isHost = room.hostId === socket.id;

    // ✅ 본인에게 방 참여 성공 알림
    socket.emit("roomJoined", { roomCode, isHost });

    // ✅ 상대방에게 알림
    socket.to(roomCode).emit("opponentJoined", { opponentId: socket.id });

    console.log(`👥 ${socket.id} → 방 ${roomCode} 입장 완료`);
    console.log(`📊 현재 방 상태: ${room.players.length}명 (${room.players.join(", ")})`);
  });

  /**
   * ⚙️ 준비 상태 토글
   */
  socket.on("playerReady", ({ roomCode, isReady }: { roomCode: string; isReady: boolean }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.ready[socket.id] = isReady;
    socket.to(roomCode).emit("opponentReady", isReady);

    console.log(`💡 ${socket.id} 준비 상태: ${isReady} (방: ${roomCode})`);
  });

  /**
   * ▶ 게임 시작 (battle.ts의 initializeBattle 호출)
   */
  socket.on("startGame", ({ roomCode }: { roomCode: string }) => {
    const room = rooms[roomCode];
    if (!room) {
      socket.emit("error", "방이 존재하지 않습니다.");
      return;
    }

    const players = room.players;
    if (players.length < 2) {
      socket.emit("error", "플레이어가 2명이어야 합니다.");
      return;
    }

    const allReady = players.every((id: string) => room.ready[id]);
    if (!allReady) {
      socket.emit("error", "모든 플레이어가 준비되어야 합니다.");
      return;
    }

    // ✅ gameState가 null일 때만 초기화 가능
    if (room.gameState !== null) {
      socket.emit("error", "이미 게임이 시작되었습니다.");
      return;
    }

    // ✅ 실제 방에 남아있는 socket.id 갱신
    const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
    room.players = socketsInRoom;

    console.log(`🔄 현재 방 ${roomCode}의 소켓 갱신:`, room.players);
    console.log(`🎯 ${roomCode} - 전투 시작! 플레이어 목록: ${room.players.join(", ")}`);

    // ✅ 전투 초기화 호출
    initializeBattle(io, roomCode, room);

    console.log(`🎮 게임 시작 명령 수신 (방: ${roomCode})`);
  });
}
