import mongoose, { Schema, Document } from "mongoose";

export interface IUserDeck extends Document {
  user: mongoose.Types.ObjectId;
  cards: mongoose.Types.ObjectId[];
}

const UserDeckSchema = new Schema<IUserDeck>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  cards: [{ type: Schema.Types.ObjectId, ref: "Card", required: true }],
});

export default mongoose.model<IUserDeck>("UserDeck", UserDeckSchema);
