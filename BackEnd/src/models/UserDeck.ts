import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserDeck extends Document {
  user: Types.ObjectId; // 유저 ID (1명당 덱 1개만 허용)
  cards: Types.ObjectId[]; // 카드 배열 (최대 30장)
  createdAt?: Date;
  updatedAt?: Date;
}

const UserDeckSchema = new Schema<IUserDeck>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    cards: [
      {
        type: Schema.Types.ObjectId,
        ref: "Card",
        required: true,
      },
    ],
  },
  { timestamps: true }
);

// ✅ 덱 카드 수 제한 (최대 30장)
UserDeckSchema.path("cards").validate(function (cards: Types.ObjectId[]) {
  return cards.length <= 30;
}, "덱에는 최대 30장까지만 넣을 수 있습니다.");

export default mongoose.model<IUserDeck>("UserDeck", UserDeckSchema);
