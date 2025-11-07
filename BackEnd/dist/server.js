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
const path_1 = __importDefault(require("path"));
const socket_io_1 = require("socket.io");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const storeRoutes_1 = __importDefault(require("./routes/storeRoutes"));
const inventoryRoutes_1 = __importDefault(require("./routes/inventoryRoutes"));
const userCardRoutes_1 = __importDefault(require("./routes/userCardRoutes"));
const userDeckRoutes_1 = __importDefault(require("./routes/userDeckRoutes"));
const socket_1 = require("./socket");
dotenv_1.default.config();
const app = (0, express_1.default)();
// ✅ CORS 설정
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://pokemon-server-529a.onrender.com",
    "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app",
];
app.use((0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
app.options("*", (0, cors_1.default)({ origin: allowedOrigins, credentials: true }));
// ✅ 미들웨어
app.use(express_1.default.json());
app.use((req, res, next) => {
    console.log(`[📥 요청] ${req.method} ${req.url}`);
    next();
});
// ✅ API 라우터
app.use("/api/auth", authRoutes_1.default);
app.use("/api/user", userRoutes_1.default);
app.use("/api/store", storeRoutes_1.default);
app.use("/api/inventory", inventoryRoutes_1.default);
app.use("/api/usercard", userCardRoutes_1.default);
app.use("/api/userdeck", userDeckRoutes_1.default);
// ✅ 이미지 정적 파일 (CloudType 절대경로 호환)
const imagePath = path_1.default.resolve(__dirname, "../public/images");
app.use("/images", express_1.default.static(imagePath));
// ✅ React 정적 빌드 연결
const frontPath = path_1.default.resolve(__dirname, "../FrontEnd/dist");
app.use(express_1.default.static(frontPath));
// ✅ React Router fallback
app.get("*", (req, res) => {
    res.sendFile(path_1.default.join(frontPath, "index.html"));
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
mongoose_1.default
    .connect(dbURI)
    .then(() => console.log("✅ MongoDB 연결 성공"))
    .catch((err) => {
    console.error("❌ MongoDB 연결 실패", err);
    process.exit(1);
});
// ✅ 서버 및 소켓 초기화
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: allowedOrigins,
        credentials: true,
        methods: ["GET", "POST"],
    },
});
// ✅ 소켓 핸들러 통합
(0, socket_1.setupSocketHandlers)(io);
// ✅ 서버 시작
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => console.log(`🚀 서버가 포트 ${PORT}에서 실행 중...`));
