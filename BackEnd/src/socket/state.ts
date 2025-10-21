export const rooms: {
  [roomCode: string]: {
    players: string[];
    ready: Record<string, boolean>;
    hostId: string;
    gameState?: any;
  };
} = {};
