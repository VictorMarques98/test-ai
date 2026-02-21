import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initElectronStorage } from "./lib/electronStorage";

// Test environment variables
import './test-env.ts';

// Initialize electron storage before rendering
initElectronStorage().then(() => {
	createRoot(document.getElementById("root")!).render(<App />);
});
