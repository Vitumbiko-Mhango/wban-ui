import { useEffect } from "react";

const useClickOutside = (ref, callback, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;

    const handleClick = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        callback(event);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, [ref, callback, enabled]);
};

export default useClickOutside;
