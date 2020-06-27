// Adds the ability to associate a Conn with a Request object in a safe and
// convenient API.
//
// Request handlers call getConn(req) to get a MySQL connection. Repeated calls
// to this function return the same connection object. If a connection has been
// opened for a request, it is closed in a router middleware that executes
// later in the handling of the request. This means the request handler does
// not need to worry about closing the connection itself.
//
// This API only associates a single connection object per request. If more are
// needed, you'll have to do something different.

import { NextFunction, Request, Response } from 'express';

import { CouldNotConnectDBError } from './errors.js';

import { Conn } from '../db.js';

// Cast a Request to this to get/set the new property we use.
interface RequestWithConn {
    conn?: Conn;
}

async function openConn(): Promise<Conn> {
    const conn = new Conn();

    try {
        await conn.connect();
    } catch (err) {
        throw new CouldNotConnectDBError(err);
    }

    return conn;
}

async function closeConn(conn: Conn): Promise<void> {
    try {
        await conn.end();
    } catch (err) {
        // Since this function is executed after an HTTP response has been
        // sent, we cannot send any information to the browser that something
        // strange happened. Just log the error.
        console.error(err);
    }
}

// Express middleware to close the database connection for a Request if one had
// been opened.
export async function closeDatabase(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    const req2 = (req as unknown) as RequestWithConn;

    if (req2.conn) {
        await closeConn(req2.conn);
    }

    next();
}

export async function getConn(req: Request): Promise<Conn> {
    const req2 = (req as unknown) as RequestWithConn;

    if (!req2.conn) {
        req2.conn = await openConn();
    }

    return req2.conn;
}
