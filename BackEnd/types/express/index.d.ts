// 루트/types/express/index.d.ts
import express from "express";

declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        username: string;
        nickname?: string;
        money?: number;
      };
    }
  }
}
