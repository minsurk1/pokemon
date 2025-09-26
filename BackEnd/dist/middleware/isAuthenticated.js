"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error("❌ JWT_SECRET 환경 변수가 설정되지 않았습니다.");
}
// ✅ JWT 인증 미들웨어
const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "토큰이 없습니다." });
    }
    const token = authHeader.split(" ")[1];
    try {
        // JWT 검증 (_id 기준)
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        req.user = {
            _id: decoded._id,
            username: decoded.username,
        };
        next(); // 인증 성공 시 다음 미들웨어로 이동
    }
    catch (err) {
        console.error("JWT 인증 오류:", err);
        return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
    }
};
exports.isAuthenticated = isAuthenticated;
