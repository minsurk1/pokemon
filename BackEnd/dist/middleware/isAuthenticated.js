"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "인증 토큰이 없습니다." });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "토큰이 없습니다." });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || "your_secret_key");
        req.user = {
            id: decoded.userId,
            username: decoded.username,
        };
        next();
    }
    catch (err) {
        return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
};
exports.isAuthenticated = isAuthenticated;
