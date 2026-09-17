type TranslateFn = (key: string, defaultValue?: string) => string;

export const formatShiftDuration = (
  start: Date | string,
  end: Date | string,
  t: TranslateFn
): string => {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  const diffMs = Math.max(endDate.getTime() - startDate.getTime(), 0);
  const totalMinutes = Math.round(diffMs / (1000 * 60));

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const hourLabel =
    hours === 1 ? t("shifts.hour", "hour") : t("shifts.hours", "hours");
  const minLabel = t("shifts.min", "min");

  if (hours === 0) {
    return `${minutes} ${minLabel}`;
  }

  if (minutes === 0) {
    return `${hours} ${hourLabel}`;
  }

  return `${hours} ${hourLabel} ${minutes} ${minLabel}`;
};
