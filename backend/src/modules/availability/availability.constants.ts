export const DAYS_OF_WEEK = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];

export const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
