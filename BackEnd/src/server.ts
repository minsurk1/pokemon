import dotenv from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import { Server as SocketIOServer } from "socket.io";
import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import storeRoutes from "./routes/storeRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import userCardRoutes from "./routes/userCardRoutes";
import userDeckRoutes from "./routes/userDeckRoutes";
import path from "path";
import { setupRoomHandlers } from "./socket/room";
import { setupBattleHandlers } from "./socket/battle";

dotenv.config();

const app = express();

// ✅ CORS 허용 도메인
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://pokemon-server-529a.onrender.com",
  "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app",
];

// ✅ Express CORS
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.options("*", cors({ origin: allowedOrigins, credentials: true }));

// ✅ JSON 바디 파서
app.use(express.json());

// ✅ 요청 로깅
app.use((req, res, next) => {
  console.log(`[📥 요청] ${req.method} ${req.url}`);
  next();
});

// ✅ API 라우트 등록
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/usercard", userCardRoutes);
app.use("/api/userdeck", userDeckRoutes);

// ✅ 정적 이미지
app.use("/images", express.static(path.join(__dirname, "../public/images")));

// ✅ 헬스 체크
app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

// ✅ 404 처리
app.use((req, res) => {
  res.status(404).json({ message: "페이지를 찾을 수 없습니다." });
});

// ✅ MongoDB 연결
const dbURI = process.env.MONGO_URI;
if (!dbURI) {
  console.error("❌ MONGO_URI 환경변수가 설정되어 있지 않습니다.");
  process.exit(1);
}

mongoose
  .connect(dbURI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패", err);
    process.exit(1);
  });

// ✅ HTTP + Socket.io 서버 생성
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// ✅ 소켓 연결 이벤트
setupRoomHandlers(io);
setupBattleHandlers(io);

// ✅ 서버 시작
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 서버가 포트 ${PORT}에서 실행 중...`);
});
