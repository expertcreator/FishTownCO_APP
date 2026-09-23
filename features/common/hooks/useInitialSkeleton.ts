import { useEffect, useState } from "react";

const DEFAULT_MS = 700;

/**
 * Temporary first-paint skeleton flag until Firestore queries own `isPending`.
 * Starts `true`, then flips `false` after `durationMs` (demo / cold start feel).
 * @param durationMs - How long to show the skeleton
 * @returns Whether the screen should render its skeleton
 */
export function useInitialSkeleton(durationMs = DEFAULT_MS): boolean {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => setShow(false), durationMs);
    return () => clearTimeout(id);
  }, [durationMs]);

  return show;
}
