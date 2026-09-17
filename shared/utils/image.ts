/**
 * Backend used to return verification images as objects (`{ url, status, rejectionReason }`)
 * but now returns them as plain URL strings. This helper normalizes both shapes so the
 * app keeps working regardless of which payload the API sends.
 */
export type ImageLike =
	| string
	| { url?: string | null }
	| null
	| undefined;

export const getImageUrl = (image: ImageLike): string | undefined => {
	if (!image) {
		return;
	}
	if (typeof image === "string") {
		return image.trim() || undefined;
	}
	return image.url?.trim() || undefined;
};
