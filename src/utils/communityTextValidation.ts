export const SPECIAL_CHARACTER_PATTERN = /[^\p{L}\p{N}\s.,!?@#$%&*()_+=:;'"/\\[\]{}<>~^|\-]/gu;

export const sanitizeCommunityText = (value: string, maxLength: number) =>
  value.replace(SPECIAL_CHARACTER_PATTERN, '').slice(0, maxLength);

export const getCommunityTextValidationError = (input: string, fieldName = '내용') => {
  const text = input.normalize('NFC');

  if (text.length > 5000) {
    return `${fieldName}은 5000자 이하로 입력해 주세요.`;
  }

  if (/\p{Mark}{4,}/u.test(text)) {
    return '같은 문자에 특수 기호가 과도하게 반복되었습니다.';
  }

  if (/(.)\1{30,}/u.test(text)) {
    return '같은 문자를 과도하게 반복할 수 없습니다.';
  }

  return '';
};
