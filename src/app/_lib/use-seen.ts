import { useEffect, useRef, useState } from "react";

/**
 * Whether an element has come into view yet, for motion that should start
 * only once it can be seen. It stays true after that. `rootMargin` trims the
 * screen it counts against, so "-20%" at the bottom waits until the element
 * is a fifth of the way up from the bottom edge. Without IntersectionObserver
 * it counts as seen straight away.
 */
export function useSeen<T extends Element>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const watch = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setSeen(true);
          watch.disconnect();
        }
      },
      { rootMargin },
    );
    watch.observe(element);
    return () => watch.disconnect();
  }, [rootMargin]);

  return [ref, seen] as const;
}
