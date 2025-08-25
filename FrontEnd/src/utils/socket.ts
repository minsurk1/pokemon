// src/utils/socket.ts
import { io, type Socket } from "socket.io-client";

const socket: Socket = io(
  "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app/",
  {
    withCredentials: true,
  }
);

export { socket };
