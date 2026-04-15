import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./index.css";
import { reportWebVitals } from "./reportWebVitals";

// Apply saved theme before first render to prevent flash
try {
  const saved = JSON.parse(localStorage.getItem("fofa-theme") ?? "{}") as {
    state?: { isDark?: boolean };
  };
  if (saved?.state?.isDark) document.documentElement.classList.add("dark");
} catch {
  // ignore malformed storage
}

if (import.meta.env.DEV) {
  reportWebVitals();
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
