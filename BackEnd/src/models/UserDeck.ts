import mongoose, { Schema, Document, Types } from "mongoose";

interface IDeckCard {
  card: Types.ObjectId;
  name: string;
  cardType?: string; // ✅ 타입 추가
  attack: number;
  hp: number;
  maxhp: number;
  cost: number;
  tier: number;
  image2D: string; // ✅ image → image2D로 변경
}

export interface IUserDeck extends Document {
  user: Types.ObjectId;
  cards: IDeckCard[];
}

const DeckCardSchema = new Schema<IDeckCard>(
  {
    card: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    name: String,
    cardType: String, // ✅ 추가
    attack: Number,
    hp: Number,
    maxhp: Number,
    cost: Number,
    tier: Number,
    image2D: String, // ✅ 통일
  },
  { _id: false }
);

const UserDeckSchema = new Schema<IUserDeck>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    cards: [DeckCardSchema],
  },
  { timestamps: true }
);

export default mongoose.model<IUserDeck>("UserDeck", UserDeckSchema);
