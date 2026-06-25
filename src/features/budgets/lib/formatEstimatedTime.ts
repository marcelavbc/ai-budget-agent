export function formatEstimatedTimeForPdf(
  value: string,
  lang: "ca" | "es"
): string {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "";

  const isPureNumberOrRange = /^[\d\s,-]+$/.test(trimmed);
  if (!isPureNumberOrRange) {
    return trimmed; // is already formatted, don't touch
  }

  const isSingular = trimmed === "1";
  const unit =
    lang === "es"
      ? isSingular
        ? "día hábil"
        : "días hábiles"
      : isSingular
        ? "dia hàbil"
        : "dies hàbils";

  return `${trimmed} ${unit}`;
}
