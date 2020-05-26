// A type that maybe holds a value. Works with all values, including null and
// undefined.
export type Maybe<T> = None | T;

export interface None {}

export const none = {};

export function isNone<T>(maybe: Maybe<T>): maybe is None {
    return maybe === none;
}
