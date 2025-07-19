import mongoose, { Schema, Document } from "mongoose";

export interface IUserCard extends Document {
  user: mongoose.Types.ObjectId;
  card: mongoose.Types.ObjectId;
  count: number;
  owned: boolean;
}

const UserCardSchema = new Schema<IUserCard>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  card: { type: Schema.Types.ObjectId, ref: "Card", required: true },
  count: { type: Number, default: 0 },
  owned: { type: Boolean, default: false },
});

export default mongoose.model<IUserCard>("UserCard", UserCardSchema);
