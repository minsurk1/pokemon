import mongoose, { Document, Schema } from "mongoose";

export interface ICard extends Document {
  cardName: string;
  cardType: string;
  tier: number;
  attack: number;
  hp: number;
  cost: number;
  image2D: string;
}

const CardSchema: Schema = new Schema({
  cardName: { type: String, required: true, unique: true },
  cardType: { type: String, required: true },
  attack: { type: Number, required: true },
  hp: { type: Number, required: true },
  cost: { type: Number, required: true },
  image2D: { type: String, required: true },
});

export default mongoose.model<ICard>("Card", CardSchema);
