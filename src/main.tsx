import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { App } from "./App";
import "./styles.css";
import "./workshop-theme.css";
import "./policy/policy-reader-preferences.css";
import "./notebook.css";
import "./workshop-appearance.css";
import {initializeWorkshopTheme} from './appearance';

initializeWorkshopTheme();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
