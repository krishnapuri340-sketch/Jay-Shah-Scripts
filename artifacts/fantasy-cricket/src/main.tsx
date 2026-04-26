import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { PredictionsProvider } from "./context/PredictionsContext";
import { PointsProvider } from "./context/PointsContext";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <PredictionsProvider>
      <PointsProvider>
        <App />
      </PointsProvider>
    </PredictionsProvider>
  </AuthProvider>
);
