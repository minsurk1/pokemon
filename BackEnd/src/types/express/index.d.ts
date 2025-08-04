// src/types/express/index.d.ts
import { Request } from "express";

declare namespace Express {
  export interface Request {
    user?: {
      id: string;
      username?: string;
    };
  }
}
