import isIp from 'is-ip';
import SQL from 'sql-template-strings';

import { SQLDate, isId, isVarchar } from './util.js';

import { Conn } from '../db.js';

const MAXIMUM_USERNAME_LENGTH = 300;
const MAXIMUM_BODY_LENGTH = 10000;
const MAXIMUM_DESCRIPTION_LENGTH = 3000;

export interface Profile {
    id: number;

    username: string;
    password: string;
    salt: string;
    description: string | null;
    body: string | null;

    created: SQLDate;
    updated: SQLDate;
}

export interface CreateProfile {
    username: string;
    password: string;
    salt: string;
    description: string | null;
    body: string | null;
}

export interface UpdateProfile {
    id: number;

    username: string;
    password: string;
    description: string | null;
    body: string | null;
}

export const isIdValid = isId;

export function isUsernameValid(value: unknown): boolean {
    if (!isVarchar(value, 1, MAXIMUM_USERNAME_LENGTH)) {
        return false;
    }

    // Usernames can't start with numbers.
    const isNum = !isNaN(parseInt(value));
    if (isNum) {
        return false;
    }

    // Usernames can't be an IP address.
    return !isIp(value);
}

export function isIPValid(value: unknown): boolean {
    return typeof value === 'string' && isIp(value);
}

export { isPasswordValid } from '../password.js';

export function isBodyValid(value: unknown): boolean {
    return value === null || isVarchar(value, 0, MAXIMUM_BODY_LENGTH);
}

export function isDescriptionValid(value: unknown): boolean {
    return value === null || isVarchar(value, 0, MAXIMUM_DESCRIPTION_LENGTH);
}

export async function getProfiles(conn: Conn): Promise<Profile[]> {
    const stmt = SQL`SELECT * FROM profile`;
    const results = await conn.query(stmt);
    const profiles = results.asRows() as Profile[];

    return profiles;
}

export async function getProfile(
    conn: Conn,
    id: number
): Promise<Profile | null> {
    const stmt = SQL`
        SELECT * FROM profile
        WHERE id = ${id}`;
    const results = await conn.query(stmt);
    const profiles = results.asRows() as Profile[];

    // Check if the result is found or not.
    if (profiles.length !== 1) {
        return null;
    }

    const profile = profiles[0];

    if (profile.salt === null || profile.password === null) {
        // It's possible to fetch an id for an IP address profile. Pretend
        // those don't exist here. Use getIPAddrProfileId() instead if this is
        // your intent.
        return null;
    }

    return profile;
}

export async function getProfileByUsername(
    conn: Conn,
    username: string
): Promise<Profile | null> {
    const stmt = SQL`
        SELECT * FROM profile
        WHERE username = ${username}`;
    const results = await conn.query(stmt);
    const profiles = results.asRows() as Profile[];

    // Check if the result is found or not.
    if (profiles.length !== 1) {
        return null;
    }

    const profile = profiles[0];

    if (profile.salt === null || profile.password === null) {
        // This is an IP address profile, which means either username was an IP
        // address or the database is inconsistent.
        //
        // Use getIPAddrProfileId() if you mean to get an IP address profile.
        throw new Error('Logic error: profile missing salt and/or password');
    }

    return profile;
}

export async function getIPAddrProfileId(
    conn: Conn,
    remoteAddress: string
): Promise<number | null> {
    const stmt = SQL`
        SELECT id FROM profile
        WHERE username = ${remoteAddress}`;
    const results = await conn.query(stmt);
    const profiles = results.asRows() as { id: number }[];

    // Check if the result is found or not.
    if (profiles.length !== 1) {
        return null;
    }

    return profiles[0].id;
}

export async function createProfile(
    conn: Conn,
    profile: CreateProfile
): Promise<number> {
    const { username, password, salt, description, body } = profile;

    const stmt = SQL`
        INSERT INTO profile (username, password, salt, description, body)
        VALUES (${username}, ${password}, ${salt}, ${description}, ${body})`;
    const results = await conn.query(stmt);
    const id = results.asOk().insertId;

    return id;
}

export async function createIPAddrProfile(
    conn: Conn,
    remoteAddress: string
): Promise<number> {
    const stmt = SQL`
        INSERT INTO profile (username)
        VALUES (${remoteAddress})`;
    const results = await conn.query(stmt);
    const id = results.asOk().insertId;

    return id;
}

export async function updateProfile(
    conn: Conn,
    profile: UpdateProfile
): Promise<void> {
    const {
        id,

        username,
        password,
        description,
        body,
    } = profile;

    const stmt = SQL`
        UPDATE profile
        SET username = ${username},
            password = ${password},
            description = ${description},
            body = ${body}
        WHERE id = ${id}`;
    await conn.query(stmt);
}
