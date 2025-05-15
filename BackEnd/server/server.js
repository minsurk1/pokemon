// dot(.)env 패키지 불러오기 : 환경변수 설정을 위한 패키지
// dotenv 패키지를 사용하여 환경변수를 로드
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
// authRoutes.js 파일에서 정의한 라우터를 '/api/auth' 경로에 등록
// 이 경로로 들어오는 요청은 authRoutes.js에서 정의한 라우터로 처리됨
app.use("/api/auth", authRoutes);

// 소켓 이벤트 처리
// 클라이언트와의 연결이 이루어지면 실행되는 이벤트 핸들러
// socket.io를 사용하여 클라이언트와의 실시간 통신을 처리
io.on("connection", (socket) => {
  console.log("새로운 클라이언트 연결됨", socket.id);

  // 방 만들기
  // 클라이언트가 방을 만들기 위해 'createRoom' 이벤트를 발생시키면 실행됨
  socket.on("createRoom", () => {
    const roomCode = generateRoomCode();
    rooms[roomCode] = { players: [], ready: {} }; // 새로운 방 생성
    console.log(`방 생성됨: ${roomCode}`);

    socket.emit("roomCreated", roomCode); // 생성된 방 코드 클라이언트에 전달
  });

  // 방 입장
  // 클라이언트가 방에 입장하기 위해 'joinRoom' 이벤트를 발생시키면 실행됨
  // 방 코드가 유효한지 확인하고, 방에 입장할 수 있는지 확인
  socket.on("joinRoom", (roomCode) => {
    if (!rooms[roomCode]) {
      socket.emit("error", "방이 존재하지 않습니다.");
      return;
    }

    // 방 인원 확인
    // 방에 이미 2명이 있는 경우에는 입장할 수 없음
    if (rooms[roomCode].players.length >= 2) {
      socket.emit("error", "방이 이미 가득 찼습니다.");
      return;
    }

    // 방에 소켓 추가
    // 방 코드에 해당하는 방에 소켓 ID를 추가
    // 방에 입장한 플레이어의 소켓 ID를 players 배열에 추가
    // 방에 입장한 플레이어의 준비 상태를 false로 초기화
    // 방에 입장한 플레이어의 소켓 ID를 키로 하는 ready 객체에 false로 초기화
    socket.join(roomCode);
    rooms[roomCode].players.push(socket.id);
    rooms[roomCode].ready[socket.id] = false; // 기본적으로 '준비 안 됨'

    console.log(`클라이언트 ${socket.id} 방 ${roomCode} 입장`);
    socket.emit("roomJoined", roomCode); // 클라이언트에 방 입장 응답

    // 상대방에게도 알림
    // 방에 입장한 플레이어가 2명이 되었을 때 상대방에게 'opponentJoined' 이벤트를 발생시킴
    if (rooms[roomCode].players.length === 2) {
      socket.to(roomCode).emit("opponentJoined");
    }
  });

  // 플레이어 준비 상태 변경
  // 클라이언트가 준비 상태를 변경하기 위해 'playerReady' 이벤트를 발생시키면 실행됨
  // 방 코드와 준비 상태를 받아서 방에 있는 플레이어의 준비 상태를 업데이트
  // 방 코드에 해당하는 방이 존재하는지 확인
  // 방에 있는 플레이어의 준비 상태를 업데이트
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
  // 클라이언트가 연결을 종료하면 실행되는 이벤트 핸들러
  // 클라이언트가 연결을 종료하면 'disconnect' 이벤트가 발생
  // 연결이 종료된 클라이언트의 소켓 ID를 사용하여 방에서 해당 플레이어를 제거
  // 방 코드에 해당하는 방이 존재하는지 확인
  // 방에 있는 플레이어의 소켓 ID를 players 배열에서 제거
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
// 방 코드를 생성하는 함수
// Math.random()을 사용하여 0과 1 사이의 랜덤한 숫자를 생성하고,
// toString(36)을 사용하여 36진수 문자열로 변환
// substr(2, 6)을 사용하여 문자열의 2번째 인덱스부터 6자리의 문자열을 잘라냄
// toUpperCase()를 사용하여 대문자로 변환
// 생성된 방 코드는 6자리의 대문자 문자열
// 방 코드는 중복되지 않도록 하기 위해 rooms 객체에 저장된 방 코드와 비교하여 중복되지 않도록 처리
const generateRoomCode = () => {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
};

// 서버 시작
// 서버를 시작하는 부분
// PORT 환경변수에서 포트를 가져오고, 없으면 5001로 설정
// 서버를 시작하고, 포트 번호를 콘솔에 출력
// process.env.PORT는 환경변수에서 포트 번호를 가져옴
// process.env는 Node.js에서 환경변수를 가져오는 객체
// PORT는 환경변수에서 가져온 포트 번호를 저장하는 변수
// server.listen() 메서드를 사용하여 서버를 시작
// PORT 변수를 사용하여 서버를 시작
// 서버가 시작되면 콘솔에 "서버가 포트 {PORT}에서 실행 중..." 메시지를 출력
// PORT는 환경변수에서 가져온 포트 번호를 사용
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중...`);
});
