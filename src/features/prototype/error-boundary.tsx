import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { downloadText } from "./settings";
import { STORAGE_KEY } from "./storage";

function readRawSave() {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

/** Replaces a blank page after a render error with local recovery steps. Sends nothing anywhere. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (!this.state.failed) return this.props.children;
    const raw = readRawSave();
    return (
      <main className="prototype-section mx-auto max-w-3xl px-5" role="alert">
        <h1>Coś poszło nie tak</h1>
        <p className="my-5">
          Ten ekran nie mógł się wyświetlić. Twoje zapisane dane nie zostały zmienione. Spróbuj
          przeładować stronę. Jeśli problem wraca, pobierz kopię danych i zgłoś problem osobie
          prowadzącej kurs.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => window.location.reload()}>Przeładuj stronę</Button>
          {raw && (
            <Button
              variant="outline"
              onClick={() => downloadText("doroboty-zapis-kopia.json", raw)}
            >
              Pobierz kopię danych
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => {
              window.location.hash = "#/pomoc";
              window.location.reload();
            }}
          >
            Jak zgłosić problem
          </Button>
        </div>
      </main>
    );
  }
}
