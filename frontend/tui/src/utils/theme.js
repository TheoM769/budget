export const colors = {
  primary: "#5865F2",
  success: "#3BA55C",
  danger: "#ED4245",
  warning: "#FAA61A",
  text: "#DCDDDE",
  textMuted: "#72767D",
  surface: "#252627",
};

export function amountColor(amount) {
  return amount >= 0 ? colors.success : colors.danger;
}
