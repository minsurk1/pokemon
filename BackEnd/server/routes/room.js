// room.js

const rooms = {};

const generateRoomCode = () => {
  let code;
  do {
    code = Math.random().toString(36).substr(2, 6).toUpperCase();
  } while (rooms[code]);
  return code;
};

function setupRoomHandlers(io) {
  io.on("connection", (socket) => {
    console.log("새로운 클라이언트 연결됨", socket.id);

    socket.on("createRoom", () => {
      const roomCode = generateRoomCode();
      rooms[roomCode] = { players: [], ready: {} };
      console.log(`방 생성됨: ${roomCode}`);

      socket.emit("roomCreated", roomCode);
    });

    socket.on("joinRoom", (roomCode) => {
      if (!rooms[roomCode]) {
        socket.emit("error", "방이 존재하지 않습니다.");
        return;
      }
      if (rooms[roomCode].players.length >= 2) {
        socket.emit("error", "방이 이미 가득 찼습니다.");
        return;
      }

      socket.join(roomCode);
      rooms[roomCode].players.push(socket.id);
      rooms[roomCode].ready[socket.id] = false;

      console.log(`클라이언트 ${socket.id} 방 ${roomCode} 입장`);
      socket.emit("roomJoined", roomCode);

      if (rooms[roomCode].players.length === 2) {
        socket.to(roomCode).emit("opponentJoined");
      }
    });

    socket.on("playerReady", ({ roomCode, isReady }) => {
      if (rooms[roomCode]) {
        rooms[roomCode].ready[socket.id] = isReady;
        console.log(
          `방 ${roomCode}: 플레이어 ${socket.id} 준비 상태 - ${isReady}`
        );

        socket.to(roomCode).emit("opponentReady", isReady);

        const allReady = Object.values(rooms[roomCode].ready).every(
          (status) => status
        );
        if (allReady && rooms[roomCode].players.length === 2) {
          io.to(roomCode).emit("gameStart");
          console.log(`방 ${roomCode}: 게임 시작!`);
        }
      }
    });

    socket.on("disconnect", () => {
      console.log(`클라이언트 ${socket.id} 연결 종료`);

      for (const roomCode in rooms) {
        const index = rooms[roomCode].players.indexOf(socket.id);
        if (index !== -1) {
          rooms[roomCode].players.splice(index, 1);
          delete rooms[roomCode].ready[socket.id];
          console.log(`방 ${roomCode}: 플레이어 ${socket.id} 퇴장`);

          socket.to(roomCode).emit("opponentLeft");

          if (rooms[roomCode].players.length === 0) {
            delete rooms[roomCode];
            console.log(`방 ${roomCode} 삭제됨`);
          }
          break;
        }
      }
    });
  });
}

module.exports = {
  setupRoomHandlers,
};
