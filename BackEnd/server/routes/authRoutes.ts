import { Router, Request, Response, NextFunction } from "express"; // express 타입들 임포트
import bcrypt from "bcryptjs"; // 비밀번호 암호화 라이브러리
import jwt from "jsonwebtoken"; // JWT 생성 및 검증 라이브러리
import dotenv from "dotenv"; // 환경변수 로드용
import User from "../models/User"; // User 모델 임포트

dotenv.config(); // .env 파일 환경변수 로드

const router = Router(); // express 라우터 생성

const jwtSecret = process.env.JWT_SECRET as string; // JWT 서명용 비밀키 (환경변수에서 가져옴)

// 모든 라우터에 대해 CORS 헤더 설정 및 OPTIONS 요청 처리 미들웨어
router.use((req, res, next) => {
  // 특정 프론트엔드 주소만 허용
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  // 요청 헤더 허용 목록 설정
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  // 허용 HTTP 메서드 설정
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  // 쿠키 및 인증 정보 허용 설정
  res.header("Access-Control-Allow-Credentials", "true");

  // 프리플라이트 요청인 OPTIONS는 바로 응답
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next(); // 다음 미들웨어 또는 라우터로 넘어감
});

// 회원가입 API - POST /signup
router.post("/signup", async (req: Request, res: Response) => {
  // 요청 바디에서 필요한 필드 추출
  const { username, password, email, nickname } = req.body;

  try {
    // 필수 입력 체크
    if (!username || !password || !email || !nickname) {
      return res.status(400).json({ message: "모든 필드를 입력해주세요" });
    }

    // 이미 존재하는 사용자 검사 (아이디 또는 이메일 중복 체크)
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "이미 사용 중인 아이디 또는 이메일입니다." });
    }

    // 비밀번호 해싱 (saltRounds = 10)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 새 사용자 데이터 생성
    const newUser = new User({
      username,
      password: hashedPassword,
      email,
      nickname,
      money: 1200, // 초기 자산 설정 예시
    });

    // DB에 저장
    await newUser.save();

    // 성공 응답
    res.status(201).json({ message: "회원가입 성공!" });
  } catch (err: any) {
    // 오류 처리 및 로그 출력
    console.error("회원가입 오류:", err);
    res.status(500).json({ message: "회원가입 실패", error: err.message });
  }
});

// 로그인 API - POST /login
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // 필수 입력 체크
    if (!username || !password) {
      return res
        .status(400)
        .json({ message: "아이디와 비밀번호를 입력해주세요." });
    }

    // 사용자 조회 (username 기준)
    const user = await User.findOne({ username });
    if (!user) {
      // 사용자 미존재 시 에러
      return res
        .status(400)
        .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    // 입력된 비밀번호와 저장된 해시된 비밀번호 비교
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // 비밀번호 불일치 시 에러
      return res
        .status(400)
        .json({ message: "아이디 또는 비밀번호가 잘못되었습니다." });
    }

    // JWT 비밀 키 출력 (개발용, 배포시 삭제 권장)
    console.log("JWT 비밀 키:", jwtSecret);

    // JWT 토큰 생성 (userId, username 포함, 1시간 만료)
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      jwtSecret,
      { expiresIn: "1h" }
    );

    // 로그인 성공 응답: 토큰 및 사용자 정보 반환
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
    // 로그인 중 오류 발생 시 처리
    console.error("로그인 중 오류 발생:", error);
    res.status(500).json({ message: "로그인 실패", error: error.message });
  }
});

export default router; // 이 라우터를 외부에서 사용할 수 있도록 내보냄
