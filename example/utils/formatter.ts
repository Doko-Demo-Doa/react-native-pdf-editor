export const formatter = {
  trimString: (value: string | undefined, maxLength = 14) => {
    if (!value) return '';
    if (value.length <= maxLength) return value;
    return value.slice(0, maxLength - 3) + '...';
  },
};
