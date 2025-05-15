import mongoose, { Schema, type Document, Types } from "mongoose";

export interface IUserCard extends Document {
  user: Types.ObjectId;
  card: Types.ObjectId;
  count: number;
  owned: boolean;
}

const UserCardSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  card: { type: Schema.Types.ObjectId, ref: "Card", required: true },
  count: { type: Number, default: 1 },
  owned: { type: Boolean, default: true },
});

export default mongoose.model<IUserCard>("UserCard", UserCardSchema);
