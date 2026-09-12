import { useCallback, useState } from 'react';

export function useLog() {
  const [lines, setLines] = useState<string[]>([]);
  const log = useCallback(
    (line: string) => setLines((prev) => [...prev, line]),
    []
  );
  return { lines, log };
}
