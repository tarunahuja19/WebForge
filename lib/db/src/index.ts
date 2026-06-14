import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import dns from "dns/promises";
import dnsSync from "dns";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const poolConfig: any = { 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
};

// Workaround for Render IPv6 limitations connecting to Supabase direct host db.xoegbzcwnxeakneczaew.supabase.co
if (process.env.DATABASE_URL.includes("db.xoegbzcwnxeakneczaew.supabase.co")) {
  poolConfig.lookup = (hostname: string, options: any, callback: any) => {
    if (hostname === "db.xoegbzcwnxeakneczaew.supabase.co") {
      dns.resolve4("aws-0-ap-northeast-1.pooler.supabase.com")
        .then(ips => {
          callback(null, ips[0], 4);
        })
        .catch(err => {
          callback(err);
        });
    } else {
      dnsSync.lookup(hostname, options, callback);
    }
  };
}

export const pool = new Pool(poolConfig);
export const db = drizzle(pool, { schema });

export * from "./schema";
