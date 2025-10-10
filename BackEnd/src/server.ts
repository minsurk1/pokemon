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
import { setupSocketHandlers } from "./socket"; // ✅ 통합된 핸들러 import

dotenv.config();

const app = express();

// ✅ CORS 설정
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://pokemon-server-529a.onrender.com",
  "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app",
];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.options("*", cors({ origin: allowedOrigins, credentials: true }));

// ✅ 미들웨어
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[📥 요청] ${req.method} ${req.url}`);
  next();
});

// ✅ 라우터 (API 경로)
app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/usercard", userCardRoutes);
app.use("/api/userdeck", userDeckRoutes);

// ✅ 정적 파일 (이미지)
app.use("/images", express.static(path.join(__dirname, "../public/images")));

// ✅ 프론트엔드 정적 빌드 파일 서빙 (React Router fallback)
const frontPath = path.join(__dirname, "../FrontEnd/dist"); // ⚠️ 프론트엔드 빌드 경로 맞게 조정
app.use(express.static(frontPath));

// ✅ React Router fallback
app.get("*", (req, res) => {
  res.sendFile(path.join(frontPath, "index.html"));
});

// ✅ 헬스 체크
app.get("/health", (req, res) => res.status(200).send("OK"));

// ❌ (주의) 이건 맨 마지막으로 이동시켜야 함 — 위 fallback 뒤에 두면 항상 404 됨
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
