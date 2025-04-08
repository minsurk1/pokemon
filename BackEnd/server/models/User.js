// 회원가입 가입 및 로그인 등등 DB에서 사용할 회원 모델을 모듈화 해놓은 파일
// userSchema에서 마지막 cards는 참조하는 타입인데 아직 건드리지(미완성한) 못한 파일

const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  nickname: { type: String, required: true },
  money: { type: Number, default: 1200 },
  cards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Card" }],
});

module.exports = mongoose.model("User", userSchema);
