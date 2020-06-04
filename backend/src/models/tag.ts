import SQL from 'sql-template-strings';

import { SQLDate, isId, isText, isVarchar } from './util.js';

import { Conn } from '../db.js';

const MAXIMUM_NAME_LENGTH = 100;
const MAXIMUM_DESCRIPTION_LENGTH = 3000;

export interface Tag {
    id: number;

    profile_id: number;

    name: string;
    description: string | null;

    created: SQLDate;
    updated: SQLDate;
}

export interface CreateTag {
    profile_id: number;

    name: string;
    description: string | null;
}

export interface UpdateTag {
    id: number;

    name?: string;
    description?: string | null;
}

export function isIdValid(value: any) {
    return isId(value);
}

export function isNameValid(value: any) {
    return value === null || isVarchar(value, 1, MAXIMUM_NAME_LENGTH);
}

export function isDescriptionValid(value: any) {
    return value === null || isText(value, MAXIMUM_DESCRIPTION_LENGTH);
}

export async function getTags(conn: Conn): Promise<Tag[]> {
    const stmt = SQL`SELECT * FROM tag`;
    const { results: tags } = await conn.query(stmt);
    return tags;
}

export async function getTag(
    conn: Conn,
    id: number
): Promise<Tag | null> {
    const sql = SQL`
        SELECT * FROM tag
        WHERE id = ${id}`;
    const { results: tags } = await conn.query(sql);

    // Check if the result is found or not.
    if (tags.length !== 1) {
        return null;
    }

    return tags[0];
}

export async function createTag(
    conn: Conn,
    tag: CreateTag
): Promise<number> {
    const {
        profile_id,

        name,
        description,
    } = tag;

    const stmt = SQL`
        INSERT INTO tag (profile_id, name, description)
        VALUES (${profile_id}, ${name}, ${description})`;

    const { results } = await conn.query(stmt);

    const id = results.insertId;
    return id;
}

export async function updateTag(
    conn: Conn,
    tag: UpdateTag
): Promise<void> {
    const {
        id,

        name,
        description,
    } = tag;

    const stmt = SQL`
        UPDATE tag
        SET name = ${name},
            description = ${description}
        WHERE id = ${id}`;

    await conn.query(stmt);
}
