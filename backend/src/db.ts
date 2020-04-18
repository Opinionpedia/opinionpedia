import { Response } from 'express';
import { promises as fs } from 'fs';
import mysql from 'mysql';
import { performance } from 'perf_hooks';
import { SQLStatement } from 'sql-template-strings';

if (process.env.DB_USER === undefined ||
    process.env.DB_DATABASE === undefined ||
    process.env.DB_PASSWORD === undefined) {
    console.error('Error: Please set DB_USER, DB_DATABASE, and DB_PASSWORD ' +
                  'environment variables.');
    process.exit(1);
}

const config: mysql.ConnectionConfig = {
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,

    charset: 'utf8mb4',
    multipleStatements: true,
};

/**
 * Error: ER_DUP_ENTRY
 * Example: Inserting a row into a table with a primary key already in use.
 * Documentation:
 *     https://dev.mysql.com/doc/refman/8.0/en/server-error-reference.html#error_er_dup_entry
 */
export const ERR_MYSQL_DUP_ENTRY = 'ER_DUP_ENTRY';

export type QueryOptions = mysql.QueryOptions;

export class QueryResults {
    results?: any;
    fields?: mysql.FieldInfo[];
}

class Measure {
    private start: number;

    constructor() {
        this.start = performance.now();
    }

    end(): number {
        return performance.now() - this.start;
    }
}

/**
 * Create a string representation of a SQLStatement object.
 */
function stringify(query: string | SQLStatement): string {
    if (typeof query === 'string') {
        return query;
    }

    const { values } = query;

    // Complete hack.
    // SQLStatement.strings is private, so we cast to unknown to get around it.
    const strings = (query as unknown as any).strings as string[];

    function collapse(s: string) {
        return s.replace(/\s\s+/g, ' ');
    }

    return strings.reduce((prev, curr, i) => {
        return collapse(prev) + mysql.escape(values[i-1]) + collapse(curr);
    });
}

// Same type as the mysql.Connection.on() method.
type MysqlConnectionOnMethod = {
    (ev: 'end', callback: (err?: mysql.MysqlError) => void): mysql.Connection;
    (ev: 'fields', callback: (fields: any[]) => void): mysql.Connection;
    (ev: 'error', callback: (err: mysql.MysqlError) => void): mysql.Connection;
    (
        ev: 'enqueue',
        callback: (err?: mysql.MysqlError) => void
    ): mysql.Connection;
    (ev: string, callback: (...args: any[]) => void): mysql.Connection;
};

/**
 * Dumb (as in no extra features) promisifying wrapper around mysql.Connection.
 */
class PromisifiedMySQLConnection {
    private connection: mysql.Connection;

    on: MysqlConnectionOnMethod;

    constructor(options: mysql.ConnectionConfig) {
        const connection = mysql.createConnection(options);

        // mysql.Connection.on() is synchronous, so we can just bind it and
        // don't need a Promisifying wrapper method.
        this.on = connection.on.bind(connection);

        this.connection = connection;
    }

    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.connect((err) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }

    query(options: string | QueryOptions): Promise<QueryResults> {
        return new Promise((resolve, reject) => {
            this.connection.query(options, (err, results, fields) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({ results, fields });
            });
        });
    }

    end(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.end((err) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve();
            });
        });
    }
}

/**
 * Connection to a MySQL database.
 */
export class Conn {
    private connection: PromisifiedMySQLConnection | null;

    constructor() {
        const connection = new PromisifiedMySQLConnection(config);

        // We have to register an error handler or else bad things will happen.
        connection.on('error', console.error);

        this.connection = connection;
    }

    async connect(): Promise<void> {
        const connection = this.getConnection();

        await connection.connect();
    }

    async query(options: string | SQLStatement): Promise<QueryResults> {
        const connection = this.getConnection();

        const measure = new Measure();

        const { results, fields } = await connection.query(options);

        const timeTaken = measure.end().toFixed(1);
        const query = stringify(options);

        console.log(`[${timeTaken}ms] ${query}`);

        return { results, fields };
    }

    async end(): Promise<void> {
        const connection = this.getConnection();

        this.connection = null;

        await connection.end();
    }

    private getConnection(): PromisifiedMySQLConnection {
        if (this.connection === null) {
            throw new Error('Used a closed MySQL connection');
        } else {
            return this.connection;
        }
    }
}

/**
 * Safely create a database connection and invoke a function, passing the
 * connection as an argument.
 */
export async function withConn(
    res: Response,
    fn: (conn: Conn) => Promise<void>
): Promise<void> {
    // Create connection.
    const conn = new Conn();

    try {
        await conn.connect();
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
        // Do not continue.
        return;
    }

    // Execute function.
    try {
        await fn(conn);
    } catch (err) {
        console.error(err);
        res.sendStatus(500);
        // Continue.
    }

    // End connection.
    try {
        await conn.end();
    } catch (err) {
        console.error(err);
    }
}

/**
 * Create a database connection and run the scripts in the top-level 'sql'
 * folder.
 */
async function migrate(): Promise<void> {
    const conn = new Conn();
    await conn.connect();

    let files = await fs.readdir('./sql/');
    files.sort();
    files = files.map((file) => `./sql/${file}`);

    for (const file of files) {
        if (file.endsWith('.sql')) {
            console.log(`Applying ${file}:`);

            const buffer = await fs.readFile(file);
            const content = buffer.toString('utf-8');

            // `content` is logged.
            await conn.query(content);
        }
    }
    await conn.end();
}

async function migrateAtBoot(): Promise<void> {
    try {
        await migrate();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    console.log('Finished setting up database');
}

// TODO: Create a static Conn factory method that awaits on migrateAtBoot() to
//       finish before constructing a Conn. This will allow clients to make
//       requests to the server before it is ready, and they will be kept on
//       pause until everything is up.
migrateAtBoot();
