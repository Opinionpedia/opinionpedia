import { promises as fs } from 'fs';
import mysql from 'mysql';
import { performance } from 'perf_hooks';
import SQL, { SQLStatement } from 'sql-template-strings';

import { production } from './config.js';
import { MySQLError, MySQLDriverError, hasCode } from './errors.js';

if (
    process.env.DB_HOST === undefined ||
    process.env.DB_USER === undefined ||
    process.env.DB_DATABASE === undefined ||
    process.env.DB_PASSWORD === undefined
) {
    console.error(
        'Error: Please set DB_HOST, DB_USER, DB_DATABASE, and DB_PASSWORD ' +
            'environment variables.'
    );
    process.exit(1);
}

const config: mysql.ConnectionConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,

    charset: 'utf8mb4',
    multipleStatements: true,
};

// Thrown errors from MySQL queries will have a `code` string property.
// Common errors we want to handle are:

/**
 * Error: ER_DUP_ENTRY
 * Example: Inserting a row into a table with a primary key already in use.
 * Documentation:
 *     https://dev.mysql.com/doc/refman/8.0/en/server-error-reference.html#error_er_dup_entry
 */
export const ERR_MYSQL_DUP_ENTRY = 'ER_DUP_ENTRY';

/**
 * Error: ER_NO_REFERENCED_ROW_2
 * Situation: When you try to add a row but there is no parent row, and a
 *            foreign key constraint fails.
 * Documentation:
 *     https://dev.mysql.com/doc/refman/8.0/en/server-error-reference.html#error_er_no_referenced_row_2
 */
export const ERR_MYSQL_NO_REFERENCED_ROW = 'ER_NO_REFERENCED_ROW_2';

/**
 * Error: ER_ROW_IS_REFERENCED_2
 * Situation: When you try to delete a parent row that has children, and a
 *            foreign key constraint fails.
 * Documentation:
 *     https://dev.mysql.com/doc/refman/8.0/en/server-error-reference.html#error_er_row_is_referenced_2
 */
export const ERR_MYSQL_ROW_IS_REFERENCED = 'ER_ROW_IS_REFERENCED_2';

export type QueryOptions = mysql.QueryOptions;

export class QueryResults {
    private results: Ok | Row[];
    fields: mysql.FieldInfo[];

    constructor(results: Ok | Row[], fields: mysql.FieldInfo[]) {
        this.results = results;
        this.fields = fields;
    }

    asOk(): Ok {
        return this.results as Ok;
    }

    asRows(): Row[] {
        return this.results as Row[];
    }
}

// E.g., INSERT and DELETE statements.
interface Ok {
    affectedRows: number;
    insertId: number;
}

// E.g., SELECT statements.
type Row = unknown;

class Measure {
    private start: number;

    constructor() {
        this.start = performance.now();
    }

    end(): number {
        return performance.now() - this.start;
    }
}

function wait(timeout: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, timeout));
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

    const strings = ((query as unknown) as { strings: string[] }).strings;

    function collapse(s: string): string {
        return s.replace(/\s\s+/g, ' ');
    }

    return strings.reduce((prev, curr, i) => {
        return collapse(prev) + mysql.escape(values[i - 1]) + collapse(curr);
    });
}

// Same type as the mysql.Connection.on() method.
type MysqlConnectionOnMethod = {
    (ev: 'end', callback: (err?: mysql.MysqlError) => void): mysql.Connection;
    (ev: 'fields', callback: (fields: unknown[]) => void): mysql.Connection;
    (ev: 'error', callback: (err: mysql.MysqlError) => void): mysql.Connection;
    (
        ev: 'enqueue',
        callback: (err?: mysql.MysqlError) => void
    ): mysql.Connection;
    (ev: string, callback: (...args: unknown[]) => void): mysql.Connection;
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
                    reject(new MySQLDriverError(err));
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
                    reject(new MySQLDriverError(err));
                    return;
                }

                resolve(new QueryResults(results, fields!));
            });
        });
    }

    end(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.connection.end((err) => {
                if (err) {
                    reject(new MySQLDriverError(err));
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
    private connection: PromisifiedMySQLConnection | null = null;

    private init(): void {
        const connection = new PromisifiedMySQLConnection(config);

        // We have to register an error handler or else the mysql driver will
        // get angry at us.
        connection.on('error', console.error);

        this.connection = connection;
    }

    async connect(): Promise<void> {
        // Try to connect for up to 20 seconds.
        let attempts = 40;

        while (true) {
            try {
                this.init();
                const connection = this.getConnection();
                await connection.connect();
                break;
            } catch (err) {
                this.connection = null;

                if (hasCode(err, 'ECONNREFUSED') && attempts > 1) {
                    console.log(
                        `MySQL connection refused, retrying for ` +
                            `${0.5 * (attempts - 1)} more seconds...`
                    );

                    attempts -= 1;
                    await wait(500);
                    continue;
                } else {
                    throw err;
                }
            }
        }
    }

    async query(options: string | SQLStatement): Promise<QueryResults> {
        const connection = this.getConnection();

        const measure = new Measure();

        try {
            const results = await connection.query(options);

            return results;
        } finally {
            const timeTaken = measure.end().toFixed(1);
            const query = stringify(options);

            console.log(`[${timeTaken}ms] ${query}`);
        }
    }

    async end(): Promise<void> {
        const connection = this.getConnection();

        this.connection = null;

        await connection.end();
    }

    private getConnection(): PromisifiedMySQLConnection {
        if (this.connection === null) {
            throw new MySQLError('Used a closed MySQL connection');
        } else {
            return this.connection;
        }
    }
}

async function runSQLFile(conn: Conn, path: string): Promise<void> {
    // How to run .sql files quickly if they're large:
    //   Execute `mysql -h host -u user databasename < file.sql`.

    const content = await fs.readFile(path, 'utf-8');

    // `content` is logged.
    await conn.query(content);
}

let initialized = false;
async function createMigrationsTable(conn: Conn): Promise<void> {
    // Only run once.
    if (initialized) {
        return;
    }
    initialized = true;

    const stmt = SQL`CREATE TABLE IF NOT EXISTS migrations (path VARCHAR(256))`;

    await conn.query(stmt);
}

async function hasMigrationRun(conn: Conn, path: string): Promise<boolean> {
    const stmt = SQL`
        SELECT 1 FROM migrations
        WHERE path = ${path} LIMIT 1`;
    const results = await conn.query(stmt);

    // Check if the result is found or not.
    return results.asRows().length > 0;
}

async function markMigrationDone(conn: Conn, path: string): Promise<void> {
    const stmt = SQL`
        INSERT INTO migrations (path)
        VALUES (${path})`;
    await conn.query(stmt);
}

async function migrateOne(conn: Conn, path: string): Promise<void> {
    // Development runs should have a reliable, clean environment. Run all
    // migrations every time.
    //
    // Production runs should leave existing data in-tact. Only run migrations
    // if they're new.

    if (process.env.NODE_ENV === 'production') {
        await createMigrationsTable(conn);

        if (await hasMigrationRun(conn, path)) {
            return;
        }

        await markMigrationDone(conn, path);
    }

    await runSQLFile(conn, path);
}

/**
 * Create a database connection and run the scripts in the top-level 'sql'
 * folder.
 */
export async function runMigrations(): Promise<void> {
    const conn = new Conn();
    await conn.connect();

    const list = `./sql/${production ? 'production' : 'development'}.json`;
    const files = JSON.parse(await fs.readFile(list, 'utf-8')) as string[];
    const paths = files.map((file) => `./sql/${file}`);

    for (const path of paths) {
        console.log(`Applying ${path}:`);

        await migrateOne(conn, path);
    }

    await conn.end();
}
