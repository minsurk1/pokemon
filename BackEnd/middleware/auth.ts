import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

interface JwtPayload {
  id?: string;
  userId?: string;
  username?: string;
  _id?: string;
}

// Express Request에 user 프로퍼티 확장 (TypeScript용)
export interface AuthRequest extends Request {
  user?: { id: string; username: string };
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "토큰 없음" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    console.log("디코딩된 토큰:", decoded);  // 이 로그 찍히나요? 내용은?

    const userId = decoded.userId || decoded.id || decoded._id || "";
    console.log("추출한 userId:", userId);  // 이 로그도 찍고 값 확인하세요

    if (!userId) {
      return res.status(401).json({ message: "유효한 사용자 ID가 토큰에 없음" });
    }

    req.user = { id: userId, username: decoded.username || "" };

    next();

  } catch (err) {
    return res.status(401).json({ message: "토큰 유효하지 않음" });
  }
};

export default authMiddleware;
