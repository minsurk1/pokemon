import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
  };
}

export const isAuthenticated = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "인증 토큰이 없습니다." });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "토큰이 없습니다." });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_secret_key"
    ) as { id: string; username: string };

    req.user = {
      id: decoded.id, // ✅ userId → id
      username: decoded.username,
    };

    next();
  } catch (err) {
    return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
  }
};
