// DB연결을 모듈화 해놓은 파일
// mongoose, dotenv 패키지 사용

const mongoose = require("mongoose");
require("dotenv").config(); // 환경 변수 사용

const connectDB = async () => {
  try {
    const dbURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/userDB"; // process.env.MONGO_URI -> env안 MONGO_URI 환경 변수 사용
    await mongoose.connect(dbURI);
    console.log("MongoDB 연결 성공");
  } catch (err) {
    console.error("MongoDB 연결 실패:", err);
    process.exit(1); // 연결 실패 시 서버 종료
  }
};

module.exports = connectDB;
