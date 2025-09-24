import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();
const jwtSecret = process.env.JWT_SECRET as string;

if (!jwtSecret) {
  throw new Error("❌ JWT_SECRET 환경 변수가 설정되지 않았습니다.");
}

// 확장된 Request 타입 정의: user 정보를 추가
export interface AuthenticatedRequest extends Request {
  user?: { _id: string; username: string };
}

// ✅ JWT 인증 미들웨어
export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // JWT 검증 (_id 기준)
    const decoded = jwt.verify(token, jwtSecret) as { _id: string; username: string };

    req.user = {
      _id: decoded._id,
      username: decoded.username,
    };

    next(); // 인증 성공 시 다음 미들웨어로 이동
  } catch (err) {
    console.error("JWT 인증 오류:", err);
    return res.status(401).json({ message: "유효하지 않은 토큰입니다." });
  }
};
