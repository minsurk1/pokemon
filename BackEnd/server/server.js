require("dotenv").config();

const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const authRoutes = require("./routes/authRoutes");
const { setupRoomHandlers } = require("./routes/room"); // 분리한 room 모듈 불러오기

const app = express();
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// MongoDB 연결
const dbURI = process.env.DB_URI || "mongodb://127.0.0.1:27017/userDB";
mongoose
  .connect(dbURI)
  .then(() => console.log("MongoDB 연결 성공"))
  .catch((err) => console.error("MongoDB 연결 실패", err));

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);

// 소켓 방 관련 이벤트 핸들러 등록
setupRoomHandlers(io);

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중...`);
});
