import mongoose, { Schema, Document, Types } from "mongoose";

export interface ICardPack extends Document {
  _id: Types.ObjectId;
  name: string;
  type: "B" | "A" | "S";
  price: number;
  image: string;
}

const cardPackSchema = new Schema<ICardPack>({
  name: { type: String, required: true },
  type: { type: String, enum: ["B", "A", "S"], required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
});

const CardPack = mongoose.model<ICardPack>("CardPack", cardPackSchema);
export default CardPack;
