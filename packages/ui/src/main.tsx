import { createRoot } from "react-dom/client";
import "semantic-ui-css/semantic.min.css";

import { App } from "./App";
import "./styles/global.css";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Root container not found");
}

createRoot(container).render(<App />);
