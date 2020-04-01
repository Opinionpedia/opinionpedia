export const CURRENT_DATE = {
    toSqlString: () => 'CURRENT_DATE()'
};

export function isDate(value) {
    return typeof value === 'string' &&
        value.search(/^\d{4}-\d{2}-\d{2}$/) === 0;
}

export function isId(value) {
    if (typeof value === 'string') {
        value = parseInt(value);
    }
    return typeof value === 'number' &&
        0 <= value;
}

export function isVarchar(value, min, max) {
    return typeof value === 'string' &&
        min <= value.length && value.length <= max;
}
