const SPECIAL_CHARACTER_PATTERN = /[^\p{L}\p{N}\s]/gu;

export const sanitizePlainText = (value: string) => value.replace(SPECIAL_CHARACTER_PATTERN, '');
