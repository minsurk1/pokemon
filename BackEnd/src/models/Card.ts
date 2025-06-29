import mongoose, { Document, Schema } from "mongoose";

// Card 인터페이스 정의 - mongoose Document 확장
export interface ICard extends Document {
  name: string;
  cardType: string;
  damage: number;
  hp: number;
  image2D: string;
  image3D: string;
  image3DGray: string;
}

const CardSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  cardType: { type: String, required: true },
  damage: { type: Number, required: true },
  hp: { type: Number, required: true },
  image2D: { type: String, required: true },
  image3D: { type: String, required: true },
  image3DGray: { type: String, required: true },
});

export default mongoose.model<ICard>("Card", CardSchema);
