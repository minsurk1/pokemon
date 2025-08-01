import mongoose, { Document, Schema } from "mongoose";

export interface ICard extends Document {
  cardName: string;
  cardType: string;
  attack: number;
  hp: number;
  image2D: string;
  image3DColor: string;
  image3DGray: string;
  tier: number;
}

const CardSchema: Schema = new Schema({
  cardName: { type: String, required: true, unique: true },
  cardType: { type: String, required: true },
  attack: { type: Number, required: true },
  hp: { type: Number, required: true },
  image2D: { type: String, required: true },
  image3DColor: { type: String, required: true },
  image3DGray: { type: String, required: true },
});

export default mongoose.model<ICard>("Card", CardSchema);
