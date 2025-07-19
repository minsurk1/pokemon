import mongoose, { Schema, Document } from "mongoose";

// 사용자 인터페이스 정의
export interface IUser extends Document {
  username: string;
  password: string;
  email: string;
  nickname: string;
  money: number;
  createdAt: Date;
}

// 사용자 스키마 정의
const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    nickname: { type: String, required: true },
    money: { type: Number, default: 1200 }, // 초기 금액 1200원
    createdAt: { type: Date, default: Date.now },
  },
  {
    versionKey: false, // __v 필드 제거
  }
);

// 모델 생성 및 내보내기
export default mongoose.model<IUser>("User", UserSchema);
