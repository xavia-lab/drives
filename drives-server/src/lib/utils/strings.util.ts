// strings.util.ts
export const titleCaseString = (str: string): string => {
  // Replace underscores with spaces first
  const tempStr = str.replace(/_/g, ' ');

  // Capitalize the first letter of each word
  const titleCased = tempStr.replace(/\b\w/g, (char) => char.toUpperCase());

  return titleCased;
};
