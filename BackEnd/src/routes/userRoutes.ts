import { Router, Response } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";
import User from "../models/User";

const router = Router();

console.log("userRoutes 라우터 로드됨");

router.get(
  "/me",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    console.log("/api/user/me 요청 처리");
    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    try {
      const user = await User.findById(req.user.id).select(
        "username nickname money"
      );
      if (!user) {
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
      }
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: "서버 오류", error: err });
    }
  }
);

export default router;
