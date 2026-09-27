import { create } from "zustand";

export type PickedLocation = {
  label: string;
  latitude: number;
  longitude: number;
};

type LocationPickerState = {
  result: PickedLocation | null;
  /**
   * Stores a map-picker result for the Add/Edit Safety form to consume.
   * @param value - Picked label and coordinates
   * @returns void
   */
  setResult: (value: PickedLocation) => void;
  /**
   * Reads and clears the pending map-picker result.
   * @returns Pending result, or null
   */
  consumeResult: () => PickedLocation | null;
};

/**
 * Temporary bridge between the free map picker screen and the safety form.
 */
export const useLocationPickerStore = create<LocationPickerState>((set, get) => ({
  result: null,
  setResult: (value) => set({ result: value }),
  consumeResult: () => {
    const value = get().result;
    set({ result: null });
    return value;
  },
}));
