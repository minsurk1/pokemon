// dotenv 패키지 불러오기
require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes"); // authRoutes.js 파일 불러오기
const rooms = {};
const app = express();

// ✅ CORS 설정 (기존 주석은 그대로 유지)
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

// ✅ Preflight 요청에 응답 헤더 추가 (중요!)
app.options("*", cors({
  origin: ["http://localhost:3000", "http://localhost:3001"],
  credentials: true
}));

// ✅ JSON 바디 파싱
app.use(express.json());

const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"], // React 앱의 주소 추가
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const dbURI = process.env.DB_URI;

mongoose
  .connect(dbURI)
  .then(() => console.log("✅ MongoDB Atlas 연결 성공"))
  .catch((err) => console.error("❌ MongoDB 연결 실패", err));

// 인증 관련 라우터를 '/api/auth' 경로에 등록
app.use("/api/auth", authRoutes);

// 소켓 이벤트 처리
io.on("connection", (socket) => {
  console.log("새로운 클라이언트 연결됨", socket.id);

  // 방 만들기
  socket.on("createRoom", () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = { players: [], ready: {} }; // 새로운 방 생성
    console.log(`방 생성됨: ${roomCode}`);

    socket.emit("roomCreated", roomCode); // 생성된 방 코드 클라이언트에 전달
  });

  // 방 입장
  socket.on("joinRoom", (roomCode) => {
    if (!rooms[roomCode]) {
      socket.emit("error", "방이 존재하지 않습니다.");
      return;
    }

    // 방 인원 확인
    if (rooms[roomCode].players.length >= 2) {
      socket.emit("error", "방이 이미 가득 찼습니다.");
      return;
    }

    // 방에 소켓 추가
    socket.join(roomCode);
    rooms[roomCode].players.push(socket.id);
    rooms[roomCode].ready[socket.id] = false; // 기본적으로 '준비 안 됨'

    console.log(`클라이언트 ${socket.id} 방 ${roomCode} 입장`);
    socket.emit("roomJoined", roomCode); // 클라이언트에 방 입장 응답

    // 상대방에게도 알림
    if (rooms[roomCode].players.length === 2) {
      socket.to(roomCode).emit("opponentJoined");
    }
  });

  // 플레이어 준비 상태 변경
  socket.on("playerReady", ({ roomCode, isReady }) => {
    if (rooms[roomCode]) {
      rooms[roomCode].ready[socket.id] = isReady;
      console.log(
        `방 ${roomCode}: 플레이어 ${socket.id} 준비 상태 - ${isReady}`
      );

      // 상대방에게 준비 상태 알림
      socket.to(roomCode).emit("opponentReady", isReady);

      // 양쪽 모두 준비 완료 시 게임 시작
      const allReady = Object.values(rooms[roomCode].ready).every(
        (status) => status
      );
      if (allReady && rooms[roomCode].players.length === 2) {
        io.to(roomCode).emit("gameStart");
        console.log(`방 ${roomCode}: 게임 시작!`);
      }
    }
  });

  // 플레이어가 연결을 종료할 경우
  socket.on("disconnect", () => {
    console.log(`클라이언트 ${socket.id} 연결 종료`);

    // 방에서 제거
    for (const roomCode in rooms) {
      const index = rooms[roomCode].players.indexOf(socket.id);
      if (index !== -1) {
        rooms[roomCode].players.splice(index, 1);
        delete rooms[roomCode].ready[socket.id];
        console.log(`방 ${roomCode}: 플레이어 ${socket.id} 퇴장`);

        // 방에 남아 있는 플레이어에게 알림
        socket.to(roomCode).emit("opponentLeft");

        // 방이 비었으면 삭제
        if (rooms[roomCode].players.length === 0) {
          delete rooms[roomCode];
          console.log(`방 ${roomCode} 삭제됨`);
        }
        break;
      }
    }
  });
});

// 랜덤 6자리 방 코드 생성 함수
const generateRoomCode = () => {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

// 서버 시작
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중...`);
});
