import { z } from "zod";

// The production Content-Security-Policy forbids eval. Zod otherwise probes `new Function` on first
// parse; the error is caught, but browsers still report a CSP violation. Jitless mode skips the probe.
// Import this module before any schema is parsed (first import in main.tsx).
z.config({ jitless: true });
