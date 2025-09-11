import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  password: string;
  email: string;
  nickname: string;
  money: number;
  inventory: IUserInventory[];
}

// ✅ 유저 인벤토리 타입 정의
export interface IUserInventory {
  pack: Types.ObjectId;   // CardPack _id
  type: "B" | "A" | "S";  // CardPack type
  quantity: number;
  opened: boolean;
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
      opened: { type: Boolean, default: false },
    },
  ],
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
