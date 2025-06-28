"use strict";
// DB연결을 모듈화 해놓은 파일
// mongoose, dotenv 패키지 사용
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // 환경 변수 설정
const connectDB = async () => {
    try {
        const dbURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/userDB";
        await mongoose_1.default.connect(dbURI);
        console.log("MongoDB 연결 성공");
    }
    catch (err) {
        console.error("MongoDB 연결 실패:", err);
        process.exit(1); // 연결 실패 시 서버 종료
    }
};
exports.default = connectDB;
