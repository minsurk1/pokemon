import { Server, Socket } from "socket.io"; // Socket.IO 서버와 소켓 타입 임포트

// 방 정보 타입 정의
interface Room {
  players: string[]; // 방에 들어온 플레이어 소켓 ID 목록
  ready: { [playerId: string]: boolean }; // 플레이어별 준비 상태
}

// 현재 활성화된 방들을 저장하는 객체 (방 코드 → Room 정보)
const rooms: { [roomCode: string]: Room } = {};

// 6자리 대문자 방 코드 생성 함수 (중복 방 코드 방지)
const generateRoomCode = (): string => {
  let code: string;
  do {
    // 36진수 문자열 중 일부를 대문자로 변환하여 6자리 생성
    code = Math.random().toString(36).substr(2, 6).toUpperCase();
  } while (rooms[code]); // 중복된 코드가 있으면 다시 생성
  return code;
};

// 방 관련 소켓 이벤트 핸들러 등록 함수 (io: Socket.IO 서버 인스턴스)
export function setupRoomHandlers(io: Server) {
  io.on("connection", (socket: Socket) => {
    console.log("새로운 클라이언트 연결됨", socket.id);

    // 클라이언트가 'createRoom' 이벤트를 보내면 방 생성
    socket.on("createRoom", () => {
      const roomCode = generateRoomCode(); // 새 방 코드 생성
      rooms[roomCode] = { players: [], ready: {} }; // 방 초기화
      console.log(`방 생성됨: ${roomCode}`);

      socket.emit("roomCreated", roomCode); // 생성된 방 코드 클라이언트에 전송
    });

    // 클라이언트가 'joinRoom' 이벤트를 보내면 해당 방에 입장 시도
    socket.on("joinRoom", (roomCode: string) => {
      // 방 존재 여부 확인
      if (!rooms[roomCode]) {
        socket.emit("error", "방이 존재하지 않습니다."); // 없으면 에러 전송
        return;
      }
      // 방 인원 제한 (최대 2명)
      if (rooms[roomCode].players.length >= 2) {
        socket.emit("error", "방이 이미 가득 찼습니다.");
        return;
      }

      socket.join(roomCode); // 소켓을 방에 참가시킴 (Socket.IO 내부 룸)
      rooms[roomCode].players.push(socket.id); // 플레이어 목록에 추가
      rooms[roomCode].ready[socket.id] = false; // 준비 상태 초기화

      console.log(`클라이언트 ${socket.id} 방 ${roomCode} 입장`);
      socket.emit("roomJoined", roomCode); // 입장 성공 알림

      // 만약 방에 플레이어가 2명이 되면 상대방에게 알림 전송
      if (rooms[roomCode].players.length === 2) {
        socket.to(roomCode).emit("opponentJoined");
      }
    });

    // 클라이언트가 'playerReady' 이벤트를 보내면 준비 상태 갱신
    socket.on(
      "playerReady",
      ({ roomCode, isReady }: { roomCode: string; isReady: boolean }) => {
        if (rooms[roomCode]) {
          rooms[roomCode].ready[socket.id] = isReady; // 준비 상태 업데이트
          console.log(
            `방 ${roomCode}: 플레이어 ${socket.id} 준비 상태 - ${isReady}`
          );

          socket.to(roomCode).emit("opponentReady", isReady); // 상대방에게 준비 상태 알림

          // 모든 플레이어가 준비되었는지 확인
          const allReady = Object.values(rooms[roomCode].ready).every(
            (status) => status
          );

          // 두 명 모두 준비되었으면 게임 시작 이벤트 브로드캐스트
          if (allReady && rooms[roomCode].players.length === 2) {
            io.to(roomCode).emit("gameStart");
            console.log(`방 ${roomCode}: 게임 시작!`);
          }
        }
      }
    );

    // 클라이언트가 연결 해제시 처리
    socket.on("disconnect", () => {
      console.log(`클라이언트 ${socket.id} 연결 종료`);

      // 모든 방을 순회하며 이 소켓이 있는 방 찾기
      for (const roomCode in rooms) {
        const index = rooms[roomCode].players.indexOf(socket.id);
        if (index !== -1) {
          rooms[roomCode].players.splice(index, 1); // 플레이어 목록에서 제거
          delete rooms[roomCode].ready[socket.id]; // 준비 상태 삭제
          console.log(`방 ${roomCode}: 플레이어 ${socket.id} 퇴장`);

          socket.to(roomCode).emit("opponentLeft"); // 상대방에게 퇴장 알림

          // 방에 플레이어가 하나도 없으면 방 삭제
          if (rooms[roomCode].players.length === 0) {
            delete rooms[roomCode];
            console.log(`방 ${roomCode} 삭제됨`);
          }
          break; // 소켓을 찾았으면 루프 종료
        }
      }
    });
  });
}
