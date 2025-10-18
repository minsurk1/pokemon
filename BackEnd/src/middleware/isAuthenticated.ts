// src/middleware/isAuthenticated.ts
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const jwtSecret = process.env.JWT_SECRET as string;
if (!jwtSecret) throw new Error("❌ JWT_SECRET 환경변수가 없습니다.");

export interface AuthenticatedRequest extends Express.Request {
  user: {
    _id: string;
    username: string;
    nickname?: string;
    money?: number;
  };
}

// ✅ JWT 인증 미들웨어
export const isAuthenticated: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ message: "토큰이 없습니다." });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // ✅ JWT 토큰 검증
    const decoded = jwt.verify(token, jwtSecret) as { _id: string; username: string };

    // ✅ 타입 캐스팅 후 user 정보 저장
    (req as AuthenticatedRequest).user = {
      _id: decoded._id,
      username: decoded.username,
    };

    next();
  } catch (err) {
    console.error("JWT 인증 오류:", err);
    res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};
