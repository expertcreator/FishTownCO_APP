export function formatRating(rating?: number | string | null): string {
  if (rating === null || rating === undefined || rating === "") {
    return "N/A";
  }

  const numericRating =
    typeof rating === "string" ? Number.parseFloat(rating) : rating;

  if (!Number.isFinite(numericRating)) {
    return "N/A";
  }

  return numericRating.toFixed(1);
}
