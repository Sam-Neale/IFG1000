import { useEffect, useState, type ReactElement } from "react";
import { AudioPanel } from "@ifg1000/g1000-ui";
import g1000FrameSrc from "./assets/g1000-frame.svg";
import { PrimaryFlightDisplay } from "./PrimaryFlightDisplay";
import type { ComputerEvent, DisplayRole, PanelKind, RendererContext } from "@ifg1000/shared";

export function App(): ReactElement {
  const [context, setContext] = useState<RendererContext>(() => readUrlContext());
  const [computerEvents, setComputerEvents] = useState<ComputerEvent[]>([]);

  useEffect(() => {
    if (typeof window.ifg1000 === "undefined") {
      return;
    }

    let mounted = true;

    window.ifg1000.getRendererContext().then((nextContext) => {
      if (mounted) {
        setContext(nextContext);
        document.title = nextContext.title;
      }
    });

    const unsubscribe = window.ifg1000.onComputerEvent((event) => {
      setComputerEvents((events) => [event, ...events].slice(0, 4));
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  return (
    <main className={`app-shell app-shell--${context.panel}`}>
      <section className="display-grid" aria-label={context.title}>
        {context.panel === "gma-1347" ? (
          <AudioPanel onControlInput={(control) => sendPanelInput(context, control)} />
        ) : (
          <PrimaryFlightDisplay
            displayRole={context.displayRole ?? "pfd"}
            frameSrc={g1000FrameSrc}
            onControlInput={(control) => sendPanelInput(context, control)}
          />
        )}
        <DiagnosticsOverlay events={computerEvents} />
      </section>
    </main>
  );
}

function sendPanelInput(context: RendererContext, control: string): void {
  if (typeof window.ifg1000 === "undefined") {
    return;
  }

  window.ifg1000.sendPanelInput({
    action: "press",
    control,
    ...(context.displayRole ? { displayRole: context.displayRole } : {}),
    panel: context.panel,
  });
}

interface DiagnosticsOverlayProps {
  events: ComputerEvent[];
}

function DiagnosticsOverlay({ events }: DiagnosticsOverlayProps): ReactElement {
  return (
    <aside className="diagnostics-overlay" aria-label="Emulator diagnostics">
      <strong>Bus</strong>
      {events.length === 0 ? (
        <span>Waiting for computer events</span>
      ) : (
        <ol>
          {events.map((event, index) => (
            <li key={`${event.type}-${index}`}>{event.type}</li>
          ))}
        </ol>
      )}
    </aside>
  );
}

function readUrlContext(): RendererContext {
  const params = new URLSearchParams(window.location.search);
  const panel = readPanelKind(params.get("panel"));
  const displayRole = readDisplayRole(params.get("role"));
  const windowId = Number.parseInt(params.get("windowId") ?? "0", 10);

  return {
    ...(displayRole ? { displayRole } : {}),
    panel,
    title:
      panel === "gma-1347"
        ? "IFG1000 GMA 1347 Audio Panel"
        : `IFG1000 ${displayRole?.toUpperCase() ?? "PFD"} - GDU 1044B`,
    windowId: Number.isFinite(windowId) ? windowId : 0,
  };
}

function readPanelKind(value: string | null): PanelKind {
  return value === "gma-1347" ? "gma-1347" : "gdu-1044b";
}

function readDisplayRole(value: string | null): DisplayRole | undefined {
  return value === "mfd" || value === "pfd" ? value : undefined;
}
