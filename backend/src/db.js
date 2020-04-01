import { promises as fs } from 'fs';
import mysql from 'mysql';

const mysqlConfiguration = {
    user: 'root',
    database: 'test',

    charset: 'utf8mb4',
    multipleStatements: true,
};

// Error: ER_DUP_ENTRY
// Example: Inserting a row into a table with a primary key already in use.
// Documentation:
//     https://dev.mysql.com/doc/refman/8.0/en/server-error-reference.html#error_er_dup_entry
export const ERR_MYSQL_DUP_ENTRY = 'ER_DUP_ENTRY';

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

class Conn {
    static makeConn() {
        return new Promise((resolve, reject) => {
            const connection = mysql.createConnection(mysqlConfiguration);

            connection.connect((err) => {
                if (err) {
                    reject(err);
                    return;
                }

                const conn = new Conn(connection);
                resolve(conn);
            });
        });
    }

    constructor(connection) {
        this.connection = connection;
        connection.on('error', (err) => {
            console.error(error);
        });
    }

    query(options) {
        return new Promise((resolve, reject) => {
            console.log(stringify(options));
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

            this.connection = null;
        });
    }
}

export async function withConn(res, fn) {
    // Create connection.
    let conn;
    try {
        conn = await Conn.makeConn();
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
    const conn = await Conn.makeConn();

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
}

migrateAtBoot();
