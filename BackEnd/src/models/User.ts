import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  password: string;
  email: string;
  nickname: string;
  money: number;
  inventory: {
    id: string;
    name: string;
    packImage?: string;
    type: "B" | "A" | "S";
    quantity: number;
    isOpened: boolean;
  }[];
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  money: { type: Number, default: 1200 },
  inventory: [
    {
      id: { type: String, required: true },
      name: { type: String, required: true },
      packImage: { type: String },
      type: { type: String, enum: ["A", "B", "S"], required: true },
      quantity: { type: Number, default: 1 },
      isOpened: { type: Boolean, default: false },
    },
  ],
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
