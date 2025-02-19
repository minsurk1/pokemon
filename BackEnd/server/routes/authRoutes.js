// 회원가입 및 로그인 API를 모듈화 해놓은 파일
// bcrypt, jwt 패키지 사용
// 회원가입 완료
// 로그인 기능은 구현은 됐지만 미흡함.

const express = require("express");
const bcrypt = require("bcryptjs"); // 비밀번호 암호화 비교 라이브러리
const jwt = require("jsonwebtoken"); // JWT 토큰 발급 라이브러리
const User = require("../models/User"); // User 모델

const router = express.Router();

// 📌 회원가입 API
router.post("/signup", async (req, res) => {
  console.log(req.body); // 요청된 데이터 확인
  const { username, password, email, nickname } = req.body;

  try {
    // 필수 입력값 검증
    if (!username || !password || !email || !nickname) {
      return res.status(400).json({ message: "모든 필드를 입력해주세요" });
    }

    // 중복 아이디 체크
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "이미 사용 중인 아이디 또는 이메일입니다." });
    }

    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 유저 생성
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      nickname,
    });

    // DB에 저장
    await newUser.save();

    res.status(201).json({ message: "회원가입 성공!" });
  } catch (err) {
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "회원가입 실패", error: err.message });
  }
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////

// 로그인 API
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    // 필수 값 확인
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    // 사용자 찾기
    const user = await User.findOne({ username });
    if (!user) {
      return res
        .status(400)
        .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    // 비밀번호 확인 (bcrypt.compare로 암호화된 비밀번호 비교)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id, username: user.username }, // 토큰에 담을 정보
      process.env.JWT_SECRET, // JWT 비밀 키 (환경 변수로 관리)
      { expiresIn: "1h" } // 토큰 만료 시간 (1시간)
    );

    // 로그인 성공 시 토큰과 사용자 정보 응답
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
