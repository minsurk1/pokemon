import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  username: string;
  password: string;
  email: string;
  nickname: string;
  money: number;
  inventory: {
    pack: Types.ObjectId;   // CardPack 참조
    opened: boolean;
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
      pack: { type: Schema.Types.ObjectId, ref: "CardPack" },
      opened: { type: Boolean, default: false },
    },
  ],
});

export default mongoose.model<IUser>("User", userSchema);
