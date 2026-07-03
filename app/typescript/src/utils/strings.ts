export function formatPercent(value: number, total: number, decimals = 1) {
  if (total === 0) return '0%';
  const percent = (value / total) * 100;
  if (Number.isInteger(percent)) {
    return `${percent}%`;
  } else {
    return `${percent.toFixed(decimals)}%`;
  }
}

export function capitalize(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function convertCase(str: string = '', targetCase: StringCase): string {
  const detectCase = (str: string): StringCase => {
    if (/^[a-z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$/.test(str)) return 'camel';
    if (/^[A-Z][a-z0-9]*(?:[A-Z][a-z0-9]*)*$/.test(str)) return 'pascal';
    if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(str)) return 'kebab';
    if (/^[a-z0-9]+(?:_[a-z0-9]+)*$/.test(str)) return 'snake';
    return null;
  }
  const toWordParts = (str: string, inputCase: Exclude<StringCase, null>): string[] => {
    if (inputCase === 'kebab') return str.split('-');
    if (inputCase === 'snake') return str.split('_');
    return str.match(/[A-Z]+(?![a-z])|[A-Z]?[a-z0-9]+/g) ?? [];
  }
  const inputCase = detectCase(str);
  if (!inputCase) return str;
  if (inputCase === targetCase) return str;

  const words = toWordParts(str, inputCase).map((word) => word.toLowerCase());
  if (!words.length) return str;

  if (targetCase === 'camel') {
    return words[0] + words.slice(1).map(capitalize).join('');
  }
  if (targetCase === 'pascal') {
    return words.map(capitalize).join('');
  }
  if (targetCase === 'kebab') {
    return words.join('-');
  }
  return words.join('_');
}

export function trimHtml(str: string): string {
  return str
    .replace(/>\s+</g, '><')         // Remove whitespace between tags
    .replace(/\s{2,}/g, ' ')         // Collapse multiple spaces into one
    .replace(/[\r\n]+/g, '')         // Remove all newlines
    .trim();                         // Trim leading/trailing whitespace
}