// 회원가입 및 로그인 API를 모듈화 해놓은 파일
// bcrypt, jwt 패키지 사용
// 회원가입 완료
// 로그인 기능은 구현은 됐지만 미흡함.

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// 📌 회원가입 API
router.post("/signup", async (req, res) => {
  console.log(req.body);
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
    });

    await newUser.save();

    res.status(201).json({ message: "회원가입 성공!" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "회원가입 실패", error: err.message });
  }
});

// 📌 로그인 API
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    const user = await User.findOne({ username });
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

    // 👉 JWT 비밀 키 로그로 출력 (확인용, 실제 서비스에선 지워야 함)
    console.log("JWT 비밀 키:", process.env.JWT_SECRET);

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({
      message: "로그인 성공!",
      token,
      user: {
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        money: user.money,
      },
    });
  } catch (error) {
    console.error("로그인 중 오류 발생:", error);
    res.status(500).json({ message: "로그인 실패", error: error.message });
  }
});

module.exports = router;
