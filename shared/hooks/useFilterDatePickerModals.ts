import { useCallback, useState } from "react";
import type { DateRange } from "@/shared/components/DateRangePicker/DateRangePicker.type";
import { useModalTransitionDelay } from "./useModalTransitionDelay";

export const useFilterDatePickerModals = () => {
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: null,
    endDate: null,
  });
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const scheduleModalOpen = useModalTransitionDelay();

  const handleOpenFilterModal = useCallback(() => {
    setIsDatePickerVisible(false);
    setIsFilterModalVisible(true);
  }, []);

  const handleCloseFilterModal = useCallback(() => {
    setIsFilterModalVisible(false);
  }, []);

  const handleOpenDatePicker = useCallback(() => {
    setIsFilterModalVisible(false);
    scheduleModalOpen(() => setIsDatePickerVisible(true));
  }, [scheduleModalOpen]);

  const handleCloseDatePicker = useCallback(() => {
    setIsDatePickerVisible(false);
    setIsFilterModalVisible(false);
  }, []);

  const handleFilterConfirm = useCallback((newDateRange: DateRange) => {
    setDateRange(newDateRange);
    setIsDatePickerVisible(false);
    setIsFilterModalVisible(false);
  }, []);

  const handleFilterReset = useCallback(() => {
    setDateRange({ startDate: null, endDate: null });
    setIsDatePickerVisible(false);
    setIsFilterModalVisible(false);
  }, []);

  const handleDatePickerConfirm = useCallback((newDateRange: DateRange) => {
    setDateRange(newDateRange);
    setIsDatePickerVisible(false);
    setIsFilterModalVisible(false);
  }, []);

  return {
    dateRange,
    isFilterModalVisible,
    isDatePickerVisible,
    handleOpenFilterModal,
    handleCloseFilterModal,
    handleOpenDatePicker,
    handleCloseDatePicker,
    handleFilterConfirm,
    handleFilterReset,
    handleDatePickerConfirm,
  };
};
