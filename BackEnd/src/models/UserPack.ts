// UserPack.ts
// 유저가 가진 카드팩 정보를 저장하는 Mongoose 모델

import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserPack extends Document {
  user: Types.ObjectId;
  packType: string; // 예: "basic", "rare", "legendary"
  purchasedAt: Date;
  opened: boolean;
}

const UserPackSchema: Schema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    packType: { type: String, required: true },
    purchasedAt: { type: Date, default: Date.now },
    opened: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<IUserPack>("UserPack", UserPackSchema);
