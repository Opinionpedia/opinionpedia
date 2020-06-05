import SQL from 'sql-template-strings';

import { SQLDate, isId, isInteger, isText, isVarchar } from './util.js';

import { Conn } from '../db.js';

const MAXIMUM_HEADER_VALUE = 1000;
const MAXIMUM_BODY_LENGTH = 10000;
const MAXIMUM_DESCRIPTION_LENGTH = 3000;
const MAXIMUM_ACTIVE_VALUE = 10000;

export interface Vote {
    id: number;

    profile_id: number;
    question_id: number;
    option_id: number;

    header: number | null;
    body: string | null;
    description: string | null;
    active: number;

    created: SQLDate;
    updated: SQLDate;
}

export interface CreateVote {
    profile_id: number;
    question_id: number;
    option_id: number;

    header: number | null;
    body: string | null;
    description: string | null;
    active: number;
}

export interface UpdateVote {
    id: number;

    header?: number | null;
    body?: string | null;
    description?: string | null;
    active?: number;
}

export function isIdValid(value: any): boolean {
    return isId(value);
}

export function isHeaderValid(value: any): boolean {
    return value === null || isInteger(value, 0, MAXIMUM_HEADER_VALUE);
}

export function isBodyValid(value: any): boolean {
    return value === null || isText(value, MAXIMUM_BODY_LENGTH);
}

export function isDescriptionValid(value: any): boolean {
    return value === null || isText(value, MAXIMUM_DESCRIPTION_LENGTH);
}

export function isActiveValid(value: any): boolean {
    return isInteger(value, 0, MAXIMUM_ACTIVE_VALUE);
}

export async function getVotes(conn: Conn): Promise<Vote[]> {
    const stmt = SQL`SELECT * FROM vote`;
    const { results: votes } = await conn.query(stmt);
    return votes;
}

export async function getVote(
    conn: Conn,
    id: number
): Promise<Vote | null> {
    const sql = SQL`
        SELECT * FROM vote
        WHERE id = ${id}`;
    const { results: votes } = await conn.query(sql);

    // Check if the result is found or not.
    if (votes.length !== 1) {
        return null;
    }

    return votes[0];
}

export async function getVotesByQuestionId(
    conn: Conn,
    question_id: number
): Promise<Vote[]> {
    const sql = SQL`
        SELECT * FROM vote
        WHERE question_id = ${question_id}`;
    const { results: votes } = await conn.query(sql);
    return votes;
}

export async function createVote(
    conn: Conn,
    vote: CreateVote
): Promise<number> {
    const {
        profile_id,
        question_id,
        option_id,

        header,
        body,
        description,
        active,
    } = vote;

    const stmt = SQL`
        INSERT INTO vote (profile_id, question_id, option_id, header, body,
                          description, active)
        VALUES (${profile_id}, ${question_id}, ${option_id}, ${header}, ${body},
                ${description}, ${active})`;

    const { results } = await conn.query(stmt);

    const id = results.insertId;
    return id;
}

export async function updateVote(
    conn: Conn,
    vote: UpdateVote
): Promise<void> {
    const {
        id,

        header,
        body,
        description,
        active,
    } = vote;

    const stmt = SQL`
        UPDATE vote
        SET header = ${header},
            body = ${body},
            description = ${description},
            active = ${active}
        WHERE id = ${id}`;

    await conn.query(stmt);
}
