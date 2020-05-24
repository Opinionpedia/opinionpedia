import SQL from 'sql-template-strings';

import { CURRENT_DATE, SQLDate, isId, isVarchar } from './util.js';

import { Conn } from '../db.js';

export interface Profile {
    id: number;

    username: string;
    password: string;
    salt: string;
    description: string;
    body: string;

    created: SQLDate;
    updated: SQLDate;
}

export interface CreateProfile {
    username: string;
    password: string;
    salt: string;
    description: string;
    body: string;
}

export interface UpdateProfile {
    id: number;

    username: string;
    password: string;
    description: string;
    body: string;
}

const MAXIMUM_USERNAME_LENGTH = 300;
const MAXIMUM_BODY_LENGTH = 10000;
const MAXIMUM_DESCRIPTION_LENGTH = 3000;

export function isIdValid(value: any): boolean {
    return isId(value);
}

export function isUsernameValid(value: any): boolean {
    if (!isVarchar(value, 1, MAXIMUM_USERNAME_LENGTH)) {
        return false;
    }

    // Usernames can't start with numbers.
    const isNum = !isNaN(parseInt(value));
    return !isNum;
}

export { isPasswordValid } from '../password.js';

export function isBodyValid(value: any): boolean {
    return isVarchar(value, 0, MAXIMUM_BODY_LENGTH);
}

export function isDescriptionValid(value: any): boolean {
    return isVarchar(value, 0, MAXIMUM_DESCRIPTION_LENGTH);
}

export async function getProfiles(conn: Conn): Promise<Profile[]> {
    const stmt = SQL`SELECT * FROM profile`;
    const { results: profiles } = await conn.query(stmt);
    return profiles;
}

export async function getProfile(
    conn: Conn,
    id: number
): Promise<Profile | null> {
    const stmt = SQL`
        SELECT * FROM profile
        WHERE id = ${id}`;
    const { results: profiles } = await conn.query(stmt);

    // Check if the result is found or not.
    if (profiles.length !== 1) {
        return null;
    }

    return profiles[0];
}

export async function getProfileByUsername(
    conn: Conn,
    username: string
): Promise<Profile | null> {
    const stmt = SQL`
        SELECT * FROM profile
        WHERE username = ${username}`;
    const { results: profiles } = await conn.query(stmt);

    // Check if the result is found or not.
    if (profiles.length !== 1) {
        return null;
    }

    return profiles[0];
}

export async function createProfile(
    conn: Conn,
    profile: CreateProfile
): Promise<number> {
    const {
        username,
        password,
        salt,
        description,
        body,
    } = profile;

    const created = CURRENT_DATE;
    const updated = CURRENT_DATE;

    const stmt = SQL`
        INSERT INTO profile
        (username, password, salt, description, body,
         created, updated)
        VALUES
        (${username}, ${password}, ${salt}, ${description}, ${body},
         ${created}, ${updated})`;

    const { results } = await conn.query(stmt);

    const id = results.insertId;
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

    const updated = CURRENT_DATE;

    const stmt = SQL`
        UPDATE profile
        SET username = ${username},
            password = ${password},
            description = ${description},
            body = ${body},
            updated = ${updated}
        WHERE id = ${id}`;

    await conn.query(stmt);
}
