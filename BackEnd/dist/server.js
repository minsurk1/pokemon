"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const room_1 = require("./routes/room"); // 소켓 방 핸들러
const cards_1 = __importDefault(require("./routes/cards"));
dotenv_1.default.config(); // 루트의 .env 파일을 자동으로 로드
const app = (0, express_1.default)();
// ✅ CORS 설정
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://pokemon-server-529a.onrender.com",
];
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
// ✅ Preflight 요청 응답 헤더 추가
app.options("*", (0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
// ✅ JSON 바디 파싱
app.use(express_1.default.json());
// ✅ HTTP + Socket 서버 생성
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
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
mongoose_1.default
    .connect(dbURI)
    .then(() => console.log("✅ MongoDB 연결 성공"))
    .catch((err) => {
    console.error("❌ MongoDB 연결 실패", err);
    process.exit(1);
});
// ✅ 라우터 등록
app.use("/api/auth", authRoutes_1.default);
app.use("/api/user", userRoutes_1.default);
// ✅ Socket.io 이벤트 핸들러
(0, room_1.setupRoomHandlers)(io);
// ✅ 서버 시작
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중...`);
});
// ✅ 헬스 체크 엔드포인트
app.get("/health", (req, res) => {
    res.status(200).send("OK");
});
app.use((req, res, next) => {
    console.log(`[📥 요청 수신] ${req.method} ${req.url}`);
    next();
});
// 카드 뽑기 API 라우터
app.use("/api/cards", cards_1.default);
