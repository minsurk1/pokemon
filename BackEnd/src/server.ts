import dotenv from "dotenv";
import express, { Request, Response } from "express";
import http from "http";
import { Server as SocketIOServer } from "socket.io";
import mongoose from "mongoose";
import cors from "cors";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import { setupRoomHandlers } from "./routes/room"; // 소켓 방 핸들러

dotenv.config(); // 루트의 .env 파일을 자동으로 로드

const app = express();

// ✅ CORS 설정
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://pokemon-server-529a.onrender.com",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ✅ Preflight 요청 응답 헤더 추가
app.options(
  "*",
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

// ✅ JSON 바디 파싱
app.use(express.json());

// ✅ HTTP + Socket 서버 생성
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ MongoDB 연결
const dbURI = process.env.MONGO_URI;

if (!dbURI) {
  console.error("❌ MONGO_URI 환경변수가 없습니다!");
  process.exit(1);
}

mongoose
  .connect(dbURI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패", err);
    process.exit(1);
  });

// ✅ 라우터 등록
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);

// ✅ Socket.io 이벤트 핸들러
setupRoomHandlers(io);

// ✅ 서버 시작
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중...`);
});

// ✅ 헬스 체크 엔드포인트
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ✅ 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`[📥 요청 수신] ${req.method} ${req.url}`);
  next();
});
