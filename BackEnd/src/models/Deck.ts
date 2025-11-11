import mongoose, { Schema, Document } from "mongoose";

export interface IDeck extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  cards: mongoose.Types.ObjectId[]; // 카드 배열 (중복 허용)
}

const DeckSchema: Schema<IDeck> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true },
    cards: {
      type: [Schema.Types.ObjectId],
      ref: "Card",
      validate: {
        validator: (cards: mongoose.Types.ObjectId[]) => cards.length <= 30,
        message: "덱에는 최대 30장까지만 넣을 수 있습니다.",
      },
    },
  },
  { timestamps: true }
);

export default mongoose.model<IDeck>("Deck", DeckSchema)
