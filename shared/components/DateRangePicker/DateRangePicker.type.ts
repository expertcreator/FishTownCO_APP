export type DateRange = {
  startDate: string | null;
  endDate: string | null;
};

export type DateRangePickerProps = {
  value: DateRange;
  onChange: (range: DateRange) => void;
  isVisible?: boolean;
  onClose?: () => void;
};
