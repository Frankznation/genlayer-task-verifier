import { Pool } from "pg";
import { config } from "../config/env";

const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 10
});

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params),
  end: () => pool.end()
};
