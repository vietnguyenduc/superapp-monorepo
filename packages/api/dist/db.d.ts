import { Pool, PoolClient } from "pg";
export declare const pool: Pool;
export declare function withClient<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
//# sourceMappingURL=db.d.ts.map