import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { initialState, transition, type Action, type State } from "./model";
import { parseState, readState, saveState, STORAGE_KEY, type StoragePort } from "./storage";
import { toAnalyticsEvent, track } from "@/lib/analytics";
function browserStorage(): StoragePort | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}
function useStore() {
  const [loaded] = useState(() => readState(browserStorage()));
  const [state, setState] = useState(loaded.state);
  const [issue, setIssue] = useState(loaded.issue);
  const [error, setError] = useState("");
  const [blocked, setBlocked] = useState(loaded.blocked);
  const [externalChange, setExternalChange] = useState(false);
  const latest = useRef(state);
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (event.key !== null && event.key !== STORAGE_KEY) return;
      setExternalChange(true);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  function commit(next: State, replace = false) {
    latest.current = next;
    setState(next);
    setError("");
    if (externalChange && !replace) return;
    if (blocked && !replace) return;
    try {
      saveState(browserStorage(), next);
      setIssue("");
      if (replace) {
        setBlocked(false);
        setExternalChange(false);
      }
    } catch (e) {
      setIssue((e as Error).message);
    }
  }
  function run(action: Action) {
    try {
      const next = transition(latest.current, action);
      commit(next);
      track(toAnalyticsEvent(action, next));
      return true;
    } catch (e) {
      setError(
        e instanceof Error && e.name !== "ZodError"
          ? e.message
          : "Sprawdź poprawność i długość wprowadzonych danych.",
      );
      return false;
    }
  }
  function importState(raw: string) {
    try {
      const next = parseState(raw);
      commit(next, true);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    }
  }
  function adoptExternalState() {
    const current = readState(browserStorage());
    if (current.blocked) {
      setIssue(current.issue);
      return;
    }
    latest.current = current.state;
    setState(current.state);
    setIssue(current.issue);
    setError("");
    setExternalChange(false);
  }
  useEffect(() => {
    document.documentElement.classList.remove("dark");
  }, []);
  return {
    state,
    issue,
    error,
    blocked,
    externalChange,
    adoptExternalState,
    original: loaded.original,
    run,
    importState,
    clearError: () => setError(""),
    reset: () => commit(initialState(), true),
  };
}
type Store = ReturnType<typeof useStore>;
const Context = createContext<Store | null>(null);
export function PrototypeProvider({ children }: { children: ReactNode }) {
  const store = useStore();
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function usePrototype() {
  const store = useContext(Context);
  if (!store) throw new Error("PrototypeProvider is required");
  return store;
}
