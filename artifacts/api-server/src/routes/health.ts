import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import dns from "dns/promises";
import tls from "tls";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json(data);
});

router.get("/diag", async (_req, res) => {
  const diagInfo: any = {
    timestamp: new Date().toISOString(),
    version: "v1.3",
    env: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      HAS_DB_URL: !!process.env.DATABASE_URL,
    },
    dns: {},
    tlsConnection: null
  };
  
  // 1. Resolve DNS for direct host and pooler
  let poolerIp: string | null = null;
  try {
    diagInfo.dns.supabaseHostIPv6 = await dns.resolve6("db.xoegbzcwnxeakneczaew.supabase.co").catch(e => e.message);
    const poolerIps = await dns.resolve4("aws-0-ap-northeast-1.pooler.supabase.com");
    diagInfo.dns.poolerIPv4List = poolerIps;
    if (poolerIps && poolerIps.length > 0) {
      poolerIp = poolerIps[0];
    }
  } catch (e: any) {
    diagInfo.dns.error = e.message;
  }
  
  // 2. Test TLS socket connection to pooler IP with custom SNI
  if (poolerIp) {
    diagInfo.tlsConnection = await new Promise((resolve) => {
      const socket = tls.connect({
        host: poolerIp!,
        port: 6543,
        servername: "db.xoegbzcwnxeakneczaew.supabase.co",
        rejectUnauthorized: false
      }, () => {
        socket.end();
        resolve({
          status: "SUCCESS",
          message: "TLS handshake completed successfully with custom SNI routing!",
          authorized: socket.authorized,
          authorizationError: socket.authorizationError
        });
      });
      
      socket.setTimeout(3000);
      socket.on("timeout", () => {
        socket.destroy();
        resolve({ status: "TIMEOUT", message: "TLS socket connection timed out after 3s" });
      });
      
      socket.on("error", (err: any) => {
        resolve({ status: "FAILED", message: err.message, code: err.code });
      });
    });
  } else {
    diagInfo.tlsConnection = { status: "FAILED", message: "Could not resolve pooler IPv4 address" };
  }
  
  res.json(diagInfo);
});

export default router;
