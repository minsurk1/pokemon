import mongoose, { Schema, Document, Types } from "mongoose";

// 서브도큐먼트 타입 (한 유저의 덱)
export interface IDeck {
  _id?: Types.ObjectId; // Mongoose 자동 생성
  name: string;
  cards: Types.ObjectId[];
  createdAt?: Date;
}

export interface IUserDeck extends Document {
  user: Types.ObjectId;
  decks: IDeck[];
}

const DeckSubSchema = new Schema<IDeck>(
  {
    name: { type: String, required: true },
    cards: [{ type: Schema.Types.ObjectId, ref: "Card", required: true }],
  },
  { timestamps: { createdAt: true, updatedAt: false } } // createdAt만 자동 생성
);

const UserDeckSchema = new Schema<IUserDeck>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  decks: [DeckSubSchema],
});

export default mongoose.model<IUserDeck>("UserDeck", UserDeckSchema);
