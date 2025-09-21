import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUserInventory {
  pack: Types.ObjectId;     // CardPack _id
  type: "B" | "A" | "S";    // 팩 타입
  quantity: number;         // 보유 개수
  opened: boolean;          // 개봉 여부
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  password: string;
  email: string;
  nickname: string;
  money: number;
  inventory: IUserInventory[];
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  money: { type: Number, default: 1200 },
  inventory: [
    {
      pack: { type: Schema.Types.ObjectId, ref: "CardPack" },
      type: { type: String, enum: ["B", "A", "S"], required: true }, // ✅ 팩 타입 저장
      quantity: { type: Number, default: 0 },                        // ✅ 개수 저장
      opened: { type: Boolean, default: false },
    },
  ],
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
