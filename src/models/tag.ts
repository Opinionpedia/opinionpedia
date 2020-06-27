import SQL from 'sql-template-strings';

import { SQLDate, isId, isText, isVarchar } from './util.js';

import { Conn } from '../db.js';

const MAXIMUM_NAME_LENGTH = 100;
const MAXIMUM_DESCRIPTION_LENGTH = 3000;

const VALID_CATEGORIES = {
    identity: true,
};

export interface Tag {
    id: number;

    profile_id: number;

    name: string;
    description: string | null;

    category: string | null;

    created: SQLDate;
    updated: SQLDate;
}

export interface CreateTag {
    profile_id: number;

    name: string;
    description: string | null;

    category: string | null;
}

export interface UpdateTag {
    id: number;

    name: string;
    description: string | null;
}

export const isIdValid = isId;

export function isNameValid(value: unknown): boolean {
    return value === null || isVarchar(value, 1, MAXIMUM_NAME_LENGTH);
}

export function isDescriptionValid(value: unknown): boolean {
    return value === null || isText(value, MAXIMUM_DESCRIPTION_LENGTH);
}

export function isCategoryValid(value: unknown): boolean {
    return (
        value === null ||
        (typeof value === 'string' && value in VALID_CATEGORIES)
    );
}

export async function getTags(conn: Conn): Promise<Tag[]> {
    const stmt = SQL`SELECT * FROM tag`;
    const results = await conn.query(stmt);
    const tags = results.asRows() as Tag[];

    return tags;
}

export async function getTagById(conn: Conn, id: number): Promise<Tag | null> {
    const stmt = SQL`
        SELECT * FROM tag
        WHERE id = ${id}`;
    const results = await conn.query(stmt);
    const tags = results.asRows() as Tag[];

    // Check if the result is found or not.
    if (tags.length !== 1) {
        return null;
    }

    return tags[0];
}

export async function getTagByName(
    conn: Conn,
    name: string
): Promise<Tag | null> {
    const stmt = SQL`
        SELECT * FROM tag
        WHERE name = ${name}`;
    const results = await conn.query(stmt);
    const tags = results.asRows() as Tag[];

    // Check if the result is found or not.
    if (tags.length !== 1) {
        return null;
    }

    return tags[0];
}

export async function createTag(conn: Conn, tag: CreateTag): Promise<number> {
    const {
        profile_id,

        name,
        description,

        category,
    } = tag;

    const stmt = SQL`
        INSERT INTO tag (profile_id, name, description, category)
        VALUES (${profile_id}, ${name}, ${description}, ${category})`;

    const results = await conn.query(stmt);

    const id = results.asOk().insertId;
    return id;
}

export async function updateTag(conn: Conn, tag: UpdateTag): Promise<void> {
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
