export type SQLDate = string;

export const CURRENT_DATE = {
    toSqlString: () => 'CURRENT_DATE()'
};

export function isDate(value: any) {
    return typeof value === 'string' &&
           value.search(/^\d{4}-\d{2}-\d{2}$/) === 0;
}

export function isId(value: any) {
    if (typeof value === 'string') {
        value = parseInt(value);
    }
    return !isNaN(value) &&
           0 <= value;
}

export function isVarchar(value: any, min: number, max: number) {
    return typeof value === 'string' &&
           min <= value.length && value.length <= max;
}
