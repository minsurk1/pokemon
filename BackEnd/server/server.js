require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { setupRoomHandlers } = require("./routes/room"); // 분리한 room 모듈 불러오기

const app = express();

// ✅ CORS 설정 (기존 주석은 그대로 유지)
app.use(cors({
  origin: ["http://localhost:3000", "https://pokemon-server-529a.onrender.com"],
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
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// MongoDB 연결용 URI 가져오기
const dbURI = process.env.MONGO_URI;

if (!dbURI) {
  console.error("❌ MONGO_URI 환경변수가 없습니다!");
  process.exit(1); // 환경변수가 없으면 서버 종료 (명확한 문제 인지용)
}

mongoose
  .connect(dbURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패", err);
    process.exit(1); // 연결 실패시 서버 종료
  });

app.use("/api/auth", authRoutes);

// 소켓 방 관련 이벤트 핸들러 등록
setupRoomHandlers(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중...`);
});
