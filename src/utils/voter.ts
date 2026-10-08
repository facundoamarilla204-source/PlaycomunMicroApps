import { NextRequest } from "next/server";
import crypto from "crypto";

export function getVoterHash(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || req.ip || "127.0.0.1";
  const cookie = req.cookies.get("voter_id")?.value;
  
  const hash = crypto.createHash("sha256");
  hash.update(ip);
  if (cookie) {
    hash.update(cookie);
  }
  return hash.digest("hex");
}
