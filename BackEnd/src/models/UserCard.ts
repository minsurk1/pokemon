import mongoose, { Schema, Document, Types } from "mongoose";

export interface IUserCard extends Document {
  user: Types.ObjectId;
  card: Types.ObjectId;
  count: number;
  owned?: boolean; // virtual로 계산 (count > 0)
  createdAt: Date;
  updatedAt: Date;
}

const UserCardSchema: Schema<IUserCard> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    card: { type: Schema.Types.ObjectId, ref: "Card", required: true },
    count: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true, // ✅ createdAt, updatedAt 자동 생성
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ✅ user + card 조합이 중복 저장되지 않도록 유니크 인덱스 추가
UserCardSchema.index({ user: 1, card: 1 }, { unique: true });

// ✅ owned는 count > 0 여부로 자동 계산
UserCardSchema.virtual("owned").get(function (this: IUserCard) {
  return (this.count ?? 0) > 0;
});

export default mongoose.model<IUserCard>("UserCard", UserCardSchema);
