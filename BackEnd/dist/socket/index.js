"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = setupSocketHandlers;
const room_1 = __importDefault(require("./room"));
const battle_1 = __importDefault(require("./battle"));
function setupSocketHandlers(io) {
    io.on("connection", (socket) => {
        console.log("🔌 새 소켓 연결:", socket.id);
        (0, room_1.default)(io, socket); // ✅ 방 생성 및 대기실 로직
        (0, battle_1.default)(io, socket); // ✅ 배틀 로직
    });
}
