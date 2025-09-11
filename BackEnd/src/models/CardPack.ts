import mongoose, { Schema, Document } from "mongoose";

export interface ICardPack extends Document {
  name: string;
  price: number;
  rarity: string;
}

const cardPackSchema = new Schema<ICardPack>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  rarity: { type: String, required: true },
});

export default mongoose.model<ICardPack>("CardPack", cardPackSchema);
