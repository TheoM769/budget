export const theme = {
  primary: '#5865F2',
  success: '#3BA55C',
  danger: '#ED4245',
  warning: '#FAA61A',
  text: '#DCDDDE',
  textMuted: '#72767D',
};

export const amountColor = (amount) => (amount >= 0 ? theme.success : theme.danger);
