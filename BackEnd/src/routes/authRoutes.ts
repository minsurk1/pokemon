import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../models/User";
// 🔽 [추가] userRoutes.ts에 있던 미들웨어를 가져옵니다.
import { isAuthenticated, AuthenticatedRequest } from "../middleware/isAuthenticated"; 

dotenv.config();

const router = Router();
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error("❌ JWT_SECRET 환경 변수가 설정되지 않았습니다.");
}

// ✅ 회원가입 (기존 코드)
router.post("/signup", async (req: Request, res: Response) => {
  console.log("📩 회원가입 요청 도착");
  const { username, password, email, nickname } = req.body;

  try {
    // 필드 검증
    if (!username || !password || !email || !nickname) {
      return res.status(400).json({ success: false, message: "모든 필드를 입력해주세요." });
    }
    // 중복 검사
    if (await User.findOne({ username })) {
      return res.status(400).json({ success: false, message: "이미 사용 중인 아이디입니다." });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: "이미 사용 중인 이메일입니다." });
    }
    if (await User.findOne({ nickname })) {
      return res.status(400).json({ success: false, message: "이미 사용 중인 닉네임입니다." });
    }

    // 비밀번호 해싱
    const hashedPassword = await bcrypt.hash(password, 10);

    // 유저 생성
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      nickname,
      money: 1200,
    });

    const savedUser = await newUser.save();

    // JWT 발급 (_id 기준)
    const token = jwt.sign({ _id: savedUser._id.toString(), username: savedUser.username }, jwtSecret, { expiresIn: "1h" });

    return res.status(201).json({
      success: true,
      message: "회원가입 성공!",
      token,
      user: {
        _id: savedUser._id,
        username: savedUser.username,
        email: savedUser.email,
        nickname: savedUser.nickname,
        money: savedUser.money,
      },
    });
  } catch (err: any) {
    console.error("❌ 회원가입 오류:", err.message);
    return res.status(500).json({ success: false, message: "회원가입 실패", error: err.message });
  }
});

// ✅ 로그인 (기존 코드)
router.post("/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  try {
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "아이디와 비밀번호를 입력해주세요." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ success: false, message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    // JWT 발급 (_id 기준)
    const token = jwt.sign({ _id: user._id.toString(), username: user.username }, jwtSecret, { expiresIn: "1h" });

    return res.json({
      success: true,
      message: "로그인 성공!",
      token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        money: user.money,
      },
    });
  } catch (error: any) {
    console.error("❌ 로그인 오류:", error.message);
    return res.status(500).json({ success: false, message: "로그인 실패", error: error.message });
  }
});

// ++++++++++++++++ [ 프로필 기능 1: 내 정보 불러오기 ] ++++++++++++++++
router.get("/profile", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // isAuthenticated 미들웨어가 토큰을 검증하고 req.user를 주입해줍니다.
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "인증 정보가 없습니다." });
    }

    // DB에서 사용자 정보를 찾되, 비밀번호는 제외하고 가져옵니다.
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // ProfilePage.tsx가 필요한 정보(username, email, nickname)를 반환합니다.
    res.status(200).json({
      username: user.username,
      email: user.email,
      nickname: user.nickname,
    });
  } catch (error: any) {
    console.error("❌ 프로필 조회 오류:", error);
    res.status(500).json({ message: "서버 오류로 프로필을 불러오지 못했습니다." });
  }
});

// ++++++++++++++++ [ 프로필 기능 2: 내 정보 수정하기 ] ++++++++++++++++
router.put("/profile/update", isAuthenticated, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "인증 정보가 없습니다." });
    }

    // ProfilePage.tsx에서 보낸 닉네임과 (선택적) 비밀번호를 받습니다.
    const { nickname, password } = req.body;

    if (!nickname) {
      return res.status(400).json({ message: "닉네임은 필수입니다." });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 1. 닉네임 변경 (닉네임 중복 검사)
    if (nickname !== user.nickname) {
      const existingNickname = await User.findOne({ nickname });
      if (existingNickname) {
        return res.status(400).json({ message: "이미 사용 중인 닉네임입니다." });
      }
      user.nickname = nickname;
    }

    // 2. 비밀번호 변경 (새 비밀번호가 전송된 경우에만)
    if (password) {
      // (선택사항) 비밀번호 정책 검사 (예: 8자 이상)
      // if (password.length < 8) { ... }
      
      // 새 비밀번호 해싱
      user.password = await bcrypt.hash(password, 10);
    }

    // 변경사항 저장
    await user.save();

    res.status(200).json({ message: "회원정보가 성공적으로 수정되었습니다." });

  } catch (error: any) {
    console.error("❌ 프로필 수정 오류:", error);
    res.status(500).json({ message: "서버 오류로 프로필을 수정하지 못했습니다." });
  }
});
// +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

export default router;