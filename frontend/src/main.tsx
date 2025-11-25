  import { createRoot } from "react-dom/client";
  import App from "./App.tsx";
  // Global styles (design tokens, utilities like .alpha-badge)
  import "./styles/globals.css";
  // Tailwind build and component styles
  import "./index.css";

  createRoot(document.getElementById("root")!).render(<App />);
  