import mongoose, { Schema, Document } from "mongoose";

export interface IUserPack extends Document {
  user: mongoose.Types.ObjectId;
  packType: "B" | "A" | "S";
  quantity: number;
  opened: boolean;
}

const UserPackSchema = new Schema<IUserPack>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  packType: { type: String, enum: ["B", "A", "S"], required: true },
  quantity: { type: Number, default: 1 },
});

export default mongoose.model<IUserPack>("UserPack", UserPackSchema);
