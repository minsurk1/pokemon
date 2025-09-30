import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserDeck extends Document {
  user: Types.ObjectId;
  name: string;
  cards: Types.ObjectId[];
  createdAt?: Date;
  updatedAt?: Date;
}

const UserDeckSchema = new Schema<IUserDeck>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    name: { type: String, required: true },
    cards: [{ type: Schema.Types.ObjectId, ref: "Card", required: true }],
  },
  { timestamps: true }
);

export default mongoose.model<IUserDeck>("UserDeck", UserDeckSchema);
