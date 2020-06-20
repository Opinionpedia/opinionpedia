interface Code {
    code: number | string;
}

export function hasCode(
    err: any,
    code: number | string
): err is Error {
    return (
        (err as Code).code === code &&
        err instanceof Error
    );
}

export class MySQLError extends Error {
    constructor(message?: string) {
        super(message);
    }
}

export class MySQLDriverError extends MySQLError {
    // Original error thrown from the mysql package.
    err: Error;

    // Either a MySQL server error, a Node.js error, or an internal error.
    code: string;

    // Error number for the error code.
    errno: number;

    // SQL state marker.
    sqlStateMarker?: string;

    // SQL state.
    sqlState?: string;

    // Field count.
    fieldCount?: number;

    // Stack trace for the error.
    stack?: string;

    // If this error is terminal to the connection object.
    fatal: boolean;

    // SQL of failed query.
    sql?: string;

    // Error message from MySQL.
    sqlMessage?: string;

    constructor(err: Error) {
        super(err.message);

        // Satisfy TypeScript.
        this.code = '';
        this.errno = 0;
        this.fatal = false;

        Object.assign(this, err);

        this.err = err;
    }
}
