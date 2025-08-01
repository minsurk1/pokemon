import express from "express";
import mongoose from "mongoose";
import UserCard from "../models/UserCard";

const router = express.Router();

// 유저 카드 정보 조회 API
router.get("/user-cards/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "유효하지 않은 userId입니다." });
    }

    const userCards = await UserCard.find({ user: new mongoose.Types.ObjectId(userId) })
      .populate("card", "cardName image3D image3DGray attack hp"); // 필요한 필드만 선택

    if (!userCards || userCards.length === 0) {
      return res.status(404).json({ message: "유저 카드 정보를 찾을 수 없습니다." });
    }

    res.json({ userCards });
  } catch (error) {
    console.error("유저 카드 조회 실패:", error);
    res.status(500).json({ message: "유저 카드 정보 불러오기 실패" });
  }
});

export default router;