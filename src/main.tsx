import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Render app (no local storage initialization needed - using backend API)
createRoot(document.getElementById("root")!).render(<App />);
