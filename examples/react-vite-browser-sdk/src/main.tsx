import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes } from "react-router";
import { App } from "./App";
import { AppProviders } from "./AppProviders";

createRoot(document.getElementById("root") as HTMLElement).render(
  <BrowserRouter>
    <Routes>
      <Route
        path="/*"
        element={
          <AppProviders>
            <App />
          </AppProviders>
        }
      />
    </Routes>
  </BrowserRouter>,
);
