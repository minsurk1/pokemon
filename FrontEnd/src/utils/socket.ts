import { io, Socket } from "socket.io-client";
import { DefaultEventsMap } from "@socket.io/component-emitter";

export const socket: Socket<DefaultEventsMap, DefaultEventsMap> = io(
  "https://port-0-pokemon-mbelzcwu1ac9b0b0.sel4.cloudtype.app",
  {
    transports: ["websocket"],
    withCredentials: true,
  }
);
