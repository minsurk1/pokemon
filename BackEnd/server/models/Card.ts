// 카드 형태를 모듈화 해놓은 파일
// 아직 미완성

import mongoose, { Schema, type Document } from "mongoose";

export interface ICard extends Document {
  name: string;
  cardType: string;
  damage: number;
  hp: number;
  image2D: string;
  image3D: string;
  image3DGray: string;
}

const CardSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  cardType: { type: String, required: true },
  damage: { type: Number, required: true },
  hp: { type: Number, required: true },
  image2D: { type: String, required: true },
  image3D: { type: String, required: true },
  image3DGray: { type: String, required: true },
});

export default mongoose.model<ICard>("Card", CardSchema);
