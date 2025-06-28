import express, { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User";

// .env 로딩
dotenv.config();

const router = express.Router();

// JWT 시크릿 키
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("JWT_SECRET 환경변수가 설정되지 않았습니다.");
}

// 사용자 인터페이스 (MongoDB 스키마 타입이 있다면 그것을 import)
interface IUser {
  _id: string;
  username: string;
  password: string;
  email: string;
  nickname: string;
  money: number;
}

// ✅ CORS 프리플라이트 및 헤더 설정
router.use((req: Request, res: Response, next: NextFunction) => {
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

// 📌 회원가입 API
router.post("/signup", async (req: Request, res: Response) => {
  const { username, password, email, nickname } = req.body;

  try {
    if (!username || !password || !email || !nickname) {
      return res.status(400).json({ message: "모든 필드를 입력해주세요" });
    }

    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "이미 사용 중인 아이디 또는 이메일입니다." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      nickname,
      money: 1200,
    });

    await newUser.save();

    res.status(201).json({ message: "회원가입 성공!" });
  } catch (err: any) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "회원가입 실패", error: err.message });
  }
});

// 📌 로그인 API
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    const user = (await User.findOne({ username })) as IUser | null;
    if (!user) {
      return res
        .status(400)
        .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

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
    console.error("로그인 중 오류 발생:", error);
    res.status(500).json({ message: "로그인 실패", error: error.message });
  }
});

export default router;
