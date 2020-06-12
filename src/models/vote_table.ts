import SQL from 'sql-template-strings';

import { Conn } from '../db.js';

import * as option from './option.js';

export type VoteTable = {
    [option_id: string]: {
        total: number;
        [tag_id: string]: number;
    };
};

type OptionVoteCounts = {
    option_id: number;
    count: number;
}[];

type TagIdVoteCounts = {
    tag_id: number;
    count: number;
}[];

/*
 * Example output:
 *
 * Group           Option 1    Option 2
 * -----           --------    --------
 * Total           54914       51922
 * Americans       6734        2827
 * International   6974        7573
 * Men             8275        7279
 * Women           9337        5126
 */
export async function getVoteTable(
    conn: Conn,
    question_id: number
): Promise<VoteTable> {
    const optionIds = await getOptionIdsOnQuestion(conn, question_id);

    const table: VoteTable = {};

    for (const option_id of optionIds) {
        table[option_id] = {
            total: 0
        };
    }

    const optionCounts: OptionVoteCounts =
        await countVotesByOptionIdOnQuestion(conn, question_id);

    for (const { option_id, count } of optionCounts) {
        table[option_id].total = count;
    }

    for await (const option_id of optionIds) {
        const tagIdCounts: TagIdVoteCounts =
            await countVotesByProfileTagOnOption(conn, option_id);

        for (const { tag_id, count } of tagIdCounts) {
            table[option_id][tag_id] = count;
        }
    }

    return table;
}

async function getOptionIdsOnQuestion(
    conn: Conn,
    question_id: number
): Promise<number[]> {
    const stmt = SQL`
        SELECT id FROM option_
        WHERE question_id = ${question_id}`;
    const results = await conn.query(stmt);
    const options = results.asRows() as Pick<option.Option, 'id'>[];

    const optionIds = options.map((option) => option.id);

    return optionIds;
}

async function countVotesByOptionIdOnQuestion(
    conn: Conn,
    question_id: number
): Promise<OptionVoteCounts> {
    const stmt = SQL`
        SELECT COUNT(1) AS count,
               option_id
        FROM vote
        WHERE vote.question_id = ${question_id}
        GROUP BY vote.option_id`;
    const results = await conn.query(stmt);
    const counts = results.asRows() as OptionVoteCounts;

    return counts;
}

async function countVotesByProfileTagOnOption(
    conn: Conn,
    option_id: number
): Promise<TagIdVoteCounts> {
    const stmt = SQL`
        SELECT COUNT(1) AS count,
               profile_tag.tag_id as tag_id
        FROM vote
             JOIN
             profile_tag ON profile_tag.profile_id = vote.profile_id
        WHERE vote.option_id = ${option_id}
        GROUP BY profile_tag.tag_id`;
    const results = await conn.query(stmt);
    const counts = results.asRows() as TagIdVoteCounts;

    return counts;
}
