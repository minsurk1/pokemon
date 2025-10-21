import { Server, Socket } from "socket.io";
import { initializeBattle } from "./battle"; // ✅ 전투 초기화 연결

export interface GameState {
  currentTurn: string;
  hp: Record<string, number>;
  cardsPlayed: Record<string, any>;
}

interface RoomInfo {
  players: string[];
  ready: Record<string, boolean>;
  hp: Record<string, number>;
  turnIndex: number;
  gameState?: GameState;
}

export const rooms: Record<string, RoomInfo> = {};

/**
 * 🏠 roomHandler - 대기실 관리 전용
 */
export default function roomHandler(io: Server, socket: Socket) {
  console.log(`🔵 새로운 클라이언트 연결: ${socket.id}`);

  /**
   * 🏗️ 방 생성 (방장 전용)
   */
  socket.on("createRoom", () => {
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    rooms[roomCode] = {
      players: [socket.id],
      ready: {},
      hp: {},
      turnIndex: 0,
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

    // 인원 초과
    if (room.players.length >= 2) {
      socket.emit("roomFull");
      console.log(`🚫 ${roomCode} 방이 가득 참`);
      return;
    }

    // ✅ 정상 입장 처리
    room.players.push(socket.id);
    socket.join(roomCode);

    const isHost = room.players[0] === socket.id;
    socket.emit("roomJoined", { roomCode, isHost });
    socket.to(roomCode).emit("opponentJoined");

    console.log(`👥 ${socket.id} → 방 ${roomCode} 입장`);
    console.log(`📊 방 상태: ${room.players.length}명 (${room.players.join(", ")})`);
  });

  /**
   * ⚙️ 준비 상태 토글
   */
  socket.on("playerReady", ({ roomCode, isReady }) => {
    const room = rooms[roomCode];
    if (!room) return;

    room.ready[socket.id] = isReady;
    socket.to(roomCode).emit("opponentReady", isReady);

    console.log(`💡 ${socket.id} 준비 상태: ${isReady} (방: ${roomCode})`);
  });

  /**
   * ▶ 게임 시작 (battle.ts의 initializeBattle 호출)
   */
  socket.on("startGame", ({ roomCode }) => {
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

    if (room.gameState) {
      socket.emit("error", "이미 게임이 시작되었습니다.");
      return;
    }

    // ✅ 현재 실제 연결된 socket.id로 갱신 (핵심)
    const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomCode) || []);
    room.players = socketsInRoom;

    console.log(`🔄 현재 방 ${roomCode}의 소켓 갱신:`, room.players);

    // ✅ battle.ts로 전투 초기화 위임
    initializeBattle(io, roomCode, room);

    console.log(`🎮 게임 시작 명령 수신 (방: ${roomCode})`);
  });
}
