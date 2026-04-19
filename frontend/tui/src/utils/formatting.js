export const formatAmount = (amount) => {
  const sign = amount >= 0 ? '+' : '';
  return `${sign}€${Math.abs(amount).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')}`;
};

export const truncate = (str, maxLen) => {
  if (!str) return '';
  return str.length <= maxLen ? str : str.slice(0, maxLen - 1) + '…';
};

export const extractKeyword = (description) => {
  if (!description) return '';
  const words = description.trim().split(/\s+/);
  // Pick longest word as keyword for rule pattern
  return words.reduce((a, b) => (b.length > a.length ? b : a), '');
};
