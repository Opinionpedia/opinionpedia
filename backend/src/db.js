import { promises as fs } from 'fs';
import mysql from 'mysql';
import { performance } from 'perf_hooks';

if (process.env.DB_USER === undefined ||
    process.env.DB_DATABASE === undefined ||
    process.env.DB_PASSWORD === undefined) {
    console.error('Error: Please set DB_USER, DB_DATABASE, and DB_PASSWORD ' +
                  'environment variables.');
    process.exit(1);
}

const mysqlConfiguration = {
    user: process.env.DB_USER,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,

    charset: 'utf8mb4',
    multipleStatements: true,
};

// Error: ER_DUP_ENTRY
// Example: Inserting a row into a table with a primary key already in use.
// Documentation:
//     https://dev.mysql.com/doc/refman/8.0/en/server-error-reference.html#error_er_dup_entry
export const ERR_MYSQL_DUP_ENTRY = 'ER_DUP_ENTRY';

class Measure {
    constructor() {
        this.start = performance.now();
    }

    end() {
        return performance.now() - this.start;
    }
}

function stringify(query) {
    if (typeof query === 'string') {
        return query;
    }

    if (query.strings !== undefined) {
        // SQLStatement object from the sql-template-strings package.
        const { strings, values } = query;

        function collapse(s) {
            return s.replace(/\s\s+/g, ' ');
        }

        return strings.reduce((prev, curr, i) => {
            return collapse(prev) + mysql.escape(values[i-1]) + collapse(curr);
        });
    }

    // ???
    return query;
}

// Promise-ify the methods of a mysql connection object.
class MySQLConnection {
    constructor(options) {
        const connection = mysql.createConnection(options);

        // This method is synchronous. No promise needed:
        this.on = connection.on.bind(connection);

        this.connection = connection;
    }

    connect() {
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

    query(options) {
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

    end() {
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

class Conn {
    constructor() {
        const connection = new MySQLConnection(mysqlConfiguration);

        // We have to register an error handler or else bad things will happen.
        connection.on('error', console.error);

        this.connection = connection;
    }

    async connect() {
        await this.connection.connect();
    }

    async query(options) {
        const measure = new Measure();

        const { results, fields } = await this.connection.query(options);

        const timeTaken = measure.end().toFixed(0);
        const query = stringify(options);

        console.log(`[${timeTaken}ms] ${query}`);

        return { results, fields };
    }

    async end() {
        const { connection } = this;

        this.connection = null;

        await connection.end();
    }
}

export async function withConn(res, fn) {
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

async function migrate() {
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

async function migrateAtBoot() {
    try {
        await migrate();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }

    console.log('Finished setting up database');
}

migrateAtBoot();
