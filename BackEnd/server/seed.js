// MONGODB 실행 시 DB 서버를 확인하기 위해 초기 테스트 값을 저장 해놓은 파일
// player1, 2, 3 기본값을 정하여 로그인 기능 테스트 가능
// 최종적으로는 필요없지만, 테스트를 원활하게 하기 위해서 남겨놓는 파일

const mongoose = require("mongoose");
const connectDB = require("./config/db"); // DB 연결
const User = require("./models/User"); // User 모델
require("dotenv").config(); // 환경 변수 로딩

const seedData = async () => {
  try {
    // DB 연결
    await connectDB();

    // 기존 데이터 삭제 (테스트용)
    await User.deleteMany({});

    // 유저 데이터 삽입
    const users = await User.insertMany([
      {
        username: "player1",
        password: "password1",
        email: "player1@example.com",
        nickname: "Player One",
        money: 1500,
      },
      {
        username: "player2",
        password: "password2",
        email: "player2@example.com",
        nickname: "Player Two",
        money: 1000,
      },
      {
        username: "player3",
        password: "password3",
        email: "player3@example.com",
        nickname: "Player Three",
        money: 1200,
      },
    ]);

    console.log("초기 데이터 삽입 완료");

    // 연결 종료
    process.exit();
  } catch (error) {
    console.error("초기 데이터 삽입 중 오류 발생:", error);
    process.exit(1);
  }
};

seedData();
