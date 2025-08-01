import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  password: string;
  email: string;
  nickname: string;
  money: number;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  money: { type: Number, default: 1200 },
});

const User = mongoose.model<IUser>("User", userSchema);
export default User;
