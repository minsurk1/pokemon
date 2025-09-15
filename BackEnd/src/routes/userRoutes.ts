import { Router, Response } from "express";
import {
  isAuthenticated,
  AuthenticatedRequest,
} from "../middleware/isAuthenticated";

import User, { IUser } from "../models/User";

const router = Router();

console.log("userRoutes 라우터 로드됨");

// ✅ 유저 돈 추가 (치트용) - 개발 끝나면 삭제
router.post(
  "/add-money",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user?.id;
    const { amount } = req.body;

    if (!userId)
      return res.status(401).json({ message: "로그인이 필요합니다." });
    if (!amount || typeof amount !== "number")
      return res.status(400).json({ message: "amount 필요" });

    try {
      const user = await User.findById(userId);
      if (!user)
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

      user.money += amount;
      await user.save();

      res
        .status(200)
        .json({ message: `돈 ${amount}G 추가 완료`, money: user.money });
    } catch (err) {
      console.error("돈 추가 오류:", err);
      res.status(500).json({ message: "서버 오류", error: err });
    }
  }
);

// ✅ 로그인한 유저 정보 가져오기
router.get(
  "/me",
  isAuthenticated,
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    try {
      const userId = req.user.id;
      const user = await User.findById(userId).lean<IUser>();
      if (!user)
        return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });

      res.json({
        nickname: user.nickname,
        money: user.money,
        inventory: user.inventory || [],
      });
    } catch (err) {
      res.status(500).json({ message: "서버 오류", error: err });
    }
  }
);

export default router;
