import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User";

dotenv.config();

const router = Router();
const jwtSecret = process.env.JWT_SECRET as string;

// CORS 처리 미들웨어
router.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ✅ 회원가입
router.post("/signup", async (req: Request, res: Response) => {
  console.log("📩 회원가입 요청 도착");
  console.log("받은 데이터:", req.body);

  const { username, password, email, nickname } = req.body;

  try {
    if (!username || !password || !email || !nickname) {
      console.log("❌ 필수 필드 누락");
      return res.status(400).json({ message: "모든 필드를 입력해주세요" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      console.log("❌ 이미 존재하는 사용자:", existingUser);
      return res
        .status(400)
        .json({ message: "이미 사용 중인 아이디 또는 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log("🔐 비밀번호 해싱 완료");

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      nickname,
      money: 1200,
    });

    await newUser.save();
    console.log("✅ 회원가입 성공, ID:", newUser._id);

    res.status(201).json({ message: "회원가입 성공!" });
  } catch (err: any) {
    console.error("❌ 회원가입 오류:", err.message);
    res.status(500).json({ message: "회원가입 실패", error: err.message });
  }
});

// ✅ 로그인
router.post("/login", async (req: Request, res: Response) => {
  console.log("🔐 로그인 요청 도착");
  const { username, password } = req.body;
  console.log("입력받은 ID:", username);

  try {
    if (!username || !password) {
      console.log("❌ 로그인: 아이디 또는 비밀번호 누락");
      return res
        .status(400)
        .json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log("❌ 로그인 실패: 존재하지 않는 사용자");
      return res
        .status(400)
        .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ 로그인 실패: 비밀번호 불일치");
      return res
        .status(400)
        .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    console.log("✅ 로그인 성공, 사용자 ID:", user._id);

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      jwtSecret,
      { expiresIn: "1h" }
    );

    res.json({
      message: "로그인 성공!",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        money: user.money,
      },
    });
  } catch (error: any) {
    console.error("❌ 로그인 중 오류:", error.message);
    res.status(500).json({ message: "로그인 실패", error: error.message });
  }
});

export default router;
