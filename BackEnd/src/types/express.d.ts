// src/types/express.d.ts
import "express";

declare global {
  namespace Express {
    interface User {
      _id: string;
      username: string;
      nickname?: string;
      money?: number;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
