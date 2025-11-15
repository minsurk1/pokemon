import dotenv from "dotenv";
import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { Server as SocketIOServer } from "socket.io";

import authRoutes from "./routes/authRoutes";
import userRoutes from "./routes/userRoutes";
import storeRoutes from "./routes/storeRoutes";
import inventoryRoutes from "./routes/inventoryRoutes";
import userCardRoutes from "./routes/userCardRoutes";
import userDeckRoutes from "./routes/userDeckRoutes";
import roomListRoutes from "./routes/roomListRoutes";
import userDexRoutes from "./routes/userDexRoutes";
import { startRoomCleaner } from "./utils/roomCleaner";
import { setupSocketHandlers } from "./socket";

dotenv.config();

const app = express();

// ✅ CORS 설정
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://pokemon-server-529a.onrender.com",
  "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app",
  "http://172.18.7.30:3000", // ✅ 추가
  "http://172.18.7.30:3001", // ✅ 추가
  "http://192.168.45.96:3000",
  "http://192.168.45.96:3001",
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.options("*", cors({ origin: allowedOrigins, credentials: true }));

// ✅ 미들웨어
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[📥 요청] ${req.method} ${req.url}`);
  next();
});

// ✅ API 라우터
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/usercard", userCardRoutes);
app.use("/api/userdeck", userDeckRoutes);
app.use("/api/rooms", roomListRoutes);
app.use("/api/dex", userDexRoutes);

startRoomCleaner();

// ✅ 이미지 정적 파일 (CloudType 절대경로 호환)
const imagePath = path.resolve(__dirname, "../public/images");
app.use("/images", express.static(imagePath));

// ✅ React 정적 빌드 연결
const frontPath = path.resolve(__dirname, "../FrontEnd/dist");
app.use(express.static(frontPath));

// ✅ React Router fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(frontPath, "index.html"));
});

// ✅ 헬스 체크
app.get("/health", (req, res) => res.status(200).send("OK"));

// ❌ 404 미들웨어는 fallback 뒤에 두면 절대 안 됨 (삭제 또는 맨 마지막으로 이동)
// app.use((req, res) => res.status(404).json({ message: "페이지를 찾을 수 없습니다." }));

// ✅ MongoDB 연결
const dbURI = process.env.MONGO_URI;
if (!dbURI) {
  console.error("❌ MONGO_URI 환경변수가 없습니다.");
  process.exit(1);
}

mongoose
  .connect(dbURI)
  .then(() => console.log("✅ MongoDB 연결 성공"))
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패", err);
    process.exit(1);
  });

// ✅ 서버 및 소켓 초기화
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// ✅ 소켓 핸들러 통합
setupSocketHandlers(io);

// ✅ 서버 시작
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 서버가 포트 ${PORT}에서 실행 중...`));
