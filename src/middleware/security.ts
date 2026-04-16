import type { Request, Response, NextFunction } from "express";
import { aj } from "../config/arcjet";
import { slidingWindow } from "@arcjet/next";

const securityMiddleWare = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (process.env.NODE_ENV === "test") return next();

  try {
    const role: RateLimitRole = req.user?.role ?? "student";

    let limit: number;
    let message: string;

    switch (role) {
      case "admin":
        limit = 20;
        message = "Admins are limited to 20 requests per minute.";
        break;
      case "teacher":
      case "student":
        limit = 10;
        message = "User are limited to 10 requests per minute.";
        break;

      default:
        limit = 5;
        message = "Guests are limited to 5 requests per minute.";
        break;
    }
    const client = aj.withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "1m",
        max: limit,
      }),
    );

    const arcjentRequest: ArcjetNodeRequest = {
      headers: req.headers,
      method: req.method,
      url: req.originalUrl ?? req.url,
      socket: {
        remoteAddress: req.socket.remoteAddress ?? req.ip ?? "0.0.0.0",
      },
    };

    const decision = await client.protect(arcjentRequest);

    if (decision.isDenied() && decision.reason.isBot()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Bot traffic is not allowed.",
      });
    }

    if (decision.isDenied() && decision.reason.isShield()) {
      return res.status(403).json({
        error: "Forbidden",
        message: "Request blocked by security policy.",
      });
    }

    if (decision.isDenied() && decision.reason.isRateLimit()) {
      return res.status(429).json({
        error: "Too Many Requests",
        message,
      });
    }

    next();
  } catch (error) {
    console.error("Security middleware error:", error);
    res.status(500).json({
      error: "Internal Server Error",
      message: "An error occurred while processing your request.",
    });
  }
};

export default securityMiddleWare;
