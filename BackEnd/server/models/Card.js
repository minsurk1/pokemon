"use strict";
// 카드 형태를 모듈화 해놓은 파일
// 아직 미완성
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const CardSchema = new mongoose_1.default.Schema({
    name: { type: String, required: true, unique: true },
    cardType: { type: String, required: true },
    damage: { type: Number, required: true },
    hp: { type: Number, required: true },
    image2D: { type: String, required: true },
    image3D: { type: String, required: true },
    image3DGray: { type: String, required: true },
});
exports.default = mongoose_1.default.model("Card", CardSchema);
