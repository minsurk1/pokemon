"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const socket_io_1 = require("socket.io");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const room_1 = require("./routes/room"); // 소켓 핸들러
const cards_1 = __importDefault(require("./routes/cards"));
dotenv_1.default.config(); // .env 환경변수 로드
const app = (0, express_1.default)();
// ✅ CORS 설정
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://pokemon-server-529a.onrender.com",
    "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app", // 프론트 또는 백엔드가 여기 있다면 포함
];
const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
};
app.use((0, cors_1.default)(corsOptions));
app.options("*", (0, cors_1.default)(corsOptions)); // Preflight 대응
// ✅ JSON 바디 파서
app.use(express_1.default.json());
// ✅ 요청 로깅
app.use((req, res, next) => {
    console.log(`[📥 요청] ${req.method} ${req.url}`);
    next();
});
// ✅ API 라우트 등록
app.use("/api/auth", authRoutes_1.default);
app.use("/api/user", userRoutes_1.default);
// ✅ 헬스 체크 (라우트 등록 아래에 둬도 됨)
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
mongoose_1.default
    .connect(dbURI)
    .then(() => console.log("✅ MongoDB 연결 성공"))
    .catch((err) => {
    console.error("❌ MongoDB 연결 실패", err);
    process.exit(1);
});
// ✅ HTTP + Socket.io 서버 생성
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
    },
});
// ✅ 소켓 이벤트 등록
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
