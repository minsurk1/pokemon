import { Router, Response } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";
import User from "../models/User";

const router = Router();

router.get(
  "/me",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    try {
      const user = await User.findById(req.user.userId).select(
        "username email nickname money"
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
