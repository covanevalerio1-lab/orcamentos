import { useEffect, useState } from "react";
import { useShareIntentContext } from "expo-share-intent";

export function useMpesaShareIntent() {
  const { hasShareIntent, shareIntent, resetShareIntent } = useShareIntentContext();
  const [sharedText, setSharedText] = useState(null);

  useEffect(() => {
    if (hasShareIntent && shareIntent?.text) {
      setSharedText(shareIntent.text);
    }
  }, [hasShareIntent, shareIntent]);

  const clear = () => {
    setSharedText(null);
    resetShareIntent();
  };

  return { sharedText, clear };
}
