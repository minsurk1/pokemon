// src/routes/userRoutes.ts
import { Router, Response } from "express";
import mongoose from "mongoose";
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated";
import User, { IUser } from "../models/User";

const router = Router();

console.log("✅ userRoutes 라우터 로드됨");

/**
 * ✅ 1) 유저 돈 추가 (치트용) — 개발 종료 후 비활성화 예정
 */
router.post("/add-money", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) {
      return res.status(401).json({ message: "로그인이 필요합니다." });
    }

    const { amount } = req.body as { amount: number };

    if (typeof amount !== "number" || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "amount는 양수 형태의 숫자여야 합니다." });
    }

    if (!mongoose.isValidObjectId(user._id)) {
      return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
    }

    const targetUser = await User.findById(user._id);
    if (!targetUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    targetUser.money += amount;
    await targetUser.save();

    res.status(200).json({
      message: `💰 ${amount}G 추가 완료`,
      newMoney: targetUser.money,
    });
  } catch (err: any) {
    console.error("❌ 돈 추가 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

/**
 * ✅ 2) 로그인한 유저 정보 조회
 * GET /api/user/me
 */
router.get("/me", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = (req as AuthenticatedRequest).user;
    if (!user?._id) {
      return res.status(401).json({ message: "인증이 필요합니다." });
    }

    if (!mongoose.isValidObjectId(user._id)) {
      return res.status(400).json({ message: "유효하지 않은 사용자 ID 형식입니다." });
    }

    const foundUser = await User.findById(user._id).populate("inventory.pack").lean<IUser>();

    if (!foundUser) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // ✅ 인벤토리 데이터 구조 정리
    const populatedInventory = (foundUser.inventory || []).map((item: any) => ({
      packId: item.pack?._id?.toString() ?? "",
      type: item.type ?? "",
      quantity: item.quantity ?? 0,
      name: item.pack?.name ?? "",
      packImage: item.pack?.image ?? "",
    }));

    res.status(200).json({
      nickname: foundUser.nickname,
      money: foundUser.money,
      inventory: populatedInventory,
    });
  } catch (err: any) {
    console.error("❌ 유저 정보 조회 오류:", err);
    res.status(500).json({ message: "서버 오류", error: err.message });
  }
});

export default router;
