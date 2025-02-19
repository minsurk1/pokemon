// 카드 형태를 모듈화 해놓은 파일
// 아직 미완성

const mongoose = require("mongoose");

const cardSchema = new mongoose.Schema({
  name: { type: String, required: true },
  attack: { type: Number, required: true },
  defense: { type: Number, required: true },
  effect: { type: String, required: true },
});

module.exports = mongoose.model("Card", cardSchema);
