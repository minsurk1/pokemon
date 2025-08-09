import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User";
import UserCard from "../models/UserCard";
import Card from "../models/Card";

const router = express.Router();

router.post("/register", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "이미 존재하는 사용자입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
    });

    await newUser.save();

    // === 회원가입 시 파이리 지급 ===
    const defaultCard = await Card.findOne({ name: "파이리" });
    if (defaultCard) {
      const userCard = new UserCard({
        user: newUser._id,
        card: defaultCard._id,
        count: 1,
      });
      await userCard.save();
    } else {
      console.warn("파이리 카드가 데이터베이스에 없습니다.");
    }

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET || "default_secret", {
      expiresIn: "7d",
    });

    res.status(201).json({ message: "회원가입 성공", token });
  } catch (error) {
    console.error("회원가입 실패:", error);
    res.status(500).json({ message: "회원가입 실패" });
  }
});

export default router;
