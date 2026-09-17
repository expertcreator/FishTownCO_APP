/** Dev-only logging (Metro development builds). */
export const devLog = (message: string, data?: unknown): void => {
  if (process.env.NODE_ENV !== "development") {
    return;
  }
};
