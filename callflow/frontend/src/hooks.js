import { useEffect } from "react";

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · CallFlow` : "CallFlow: AI calls that book the slot";
  }, [title]);
}
