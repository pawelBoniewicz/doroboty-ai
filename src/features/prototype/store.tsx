import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import posthog from "posthog-js";
import { posthogAppLogger } from "@/lib/posthog-logs";
import {
  currentPerson,
  initialState,
  transition,
  type Action,
  type Person,
  type State,
} from "./model";
import { parseState, readState, saveState, STORAGE_KEY, type StoragePort } from "./storage";
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
  const restoredIdentity = useRef(false);

  function identifyPerson(person: Person) {
    if (!posthog.__loaded) return;
    try {
      posthog.identify(person.id, {
        name: person.name,
        role: person.role,
        ...(person.companyId ? { company_id: person.companyId } : {}),
      });
    } catch {
      // Analytics must not interrupt the prototype workflow.
    }
  }

  function syncIdentity(previous: Person | undefined, next: Person | undefined) {
    if (!posthog.__loaded || previous?.id === next?.id) return;
    try {
      if (previous) posthog.reset();
      if (next) identifyPerson(next);
    } catch {
      // Analytics must not interrupt the prototype workflow.
    }
  }

  useEffect(() => {
    if (restoredIdentity.current) return;
    restoredIdentity.current = true;
    const person = currentPerson(loaded.state);
    if (person) identifyPerson(person);
  }, [loaded.state]);
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
      posthogAppLogger.statePersistenceFailed();
      setIssue((e as Error).message);
    }
  }
  function run(action: Action) {
    try {
      const previous = currentPerson(latest.current);
      const next = transition(latest.current, action);
      if (action.type === "select_person") syncIdentity(previous, currentPerson(next));
      commit(next);
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
      syncIdentity(currentPerson(latest.current), currentPerson(next));
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
    syncIdentity(currentPerson(latest.current), currentPerson(current.state));
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
    reset: () => {
      const next = initialState();
      syncIdentity(currentPerson(latest.current), currentPerson(next));
      commit(next, true);
    },
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
