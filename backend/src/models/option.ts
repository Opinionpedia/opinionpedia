import SQL from 'sql-template-strings';

import { SQLDate, isId, isVarchar } from './util.js';

import { Conn } from '../db.js';

const MAXIMUM_PROMPT_LENGTH = 1000;
const MAXIMUM_DESCRIPTION_LENGTH = 3000;

export interface Option {
    id: number;

    profile_id: number;
    question_id: number;

    prompt: string;
    description: string | null;

    created: SQLDate;
    updated: SQLDate;
}

export interface CreateOption {
    profile_id: number;
    question_id: number;

    prompt: string;
    description: string | null;
}

export interface UpdateOption {
    id: number;

    profile_id: number;
    question_id: number;

    prompt: string;
    description: string | null;
}

export function isIdValid(value: any) {
    return isId(value);
}

export function isPromptValid(value: any) {
    return isVarchar(value, 0, MAXIMUM_PROMPT_LENGTH);
}

export function isDescriptionValid(value: any) {
    return value === null || isVarchar(value, 0, MAXIMUM_DESCRIPTION_LENGTH);
}

export async function getOptions(conn: Conn): Promise<Option[]> {
    const stmt = SQL`SELECT * FROM option_`;
    const { results: options } = await conn.query(stmt);
    return options;
}

export async function getOption(
    conn: Conn,
    id: number
): Promise<Option | null> {
    const sql = SQL`
        SELECT * FROM option_
        WHERE id = ${id}`;
    const { results: options } = await conn.query(sql);

    // Check if the result is found or not.
    if (options.length !== 1) {
        return null;
    }

    return options[0];
}

export async function getOptionsByQuestionId(
    conn: Conn,
    question_id: number
): Promise<Option[]> {
    const sql = SQL`
        SELECT * FROM option_
        WHERE question_id = ${question_id}`;
    const { results: options } = await conn.query(sql);
    return options;
}

export async function createOption(
    conn: Conn,
    option: CreateOption
): Promise<number> {
    const {
        profile_id,
        question_id,

        prompt,
        description,
    } = option;

    const stmt = SQL`
        INSERT INTO option_ (profile_id, question_id, prompt, description)
        VALUES (${profile_id}, ${question_id}, ${prompt}, ${description})`;

    const { results } = await conn.query(stmt);

    const id = results.insertId;
    return id;
}

export async function updateOption(
    conn: Conn,
    option: UpdateOption
): Promise<void> {
    const {
        id,

        profile_id,
        question_id,

        prompt,
        description,
    } = option;

    const stmt = SQL`
        UPDATE option_
        SET profile_id = ${profile_id},
            question_id = ${question_id},
            prompt = ${prompt},
            description = ${description}
        WHERE id = ${id}`;

    await conn.query(stmt);
}
