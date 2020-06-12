import SQL from 'sql-template-strings';

import { isId } from './util.js';
import { Tag } from './tag.js';

import { Conn } from '../db.js';

export interface ProfileTag {
    tag_id: number;
    profile_id: number;
}

export type TagOnProfile =
    { tag_id: number; } & Pick<Tag, 'name' | 'description'>;

export const isIdValid = isId;

export async function getTagsOnProfile(
    conn: Conn,
    profile_id: number
): Promise<TagOnProfile[]> {
    const stmt = SQL`
        SELECT tag_id, name, description
        FROM profile_tag
             JOIN
             tag ON profile_tag.tag_id = tag.id
        WHERE profile_tag.profile_id = ${profile_id}`;
    const results = await conn.query(stmt);
    const profileTags = results.asRows() as TagOnProfile[];

    return profileTags;
}

export async function createProfileTag(
    conn: Conn,
    profileTag: ProfileTag
): Promise<void> {
    const {
        tag_id,
        profile_id,
    } = profileTag;

    const stmt = SQL`
        INSERT INTO profile_tag (tag_id, profile_id)
        VALUES (${tag_id}, ${profile_id})`;

    await conn.query(stmt);
}
