import React from "react";
import AppRoutes from "./routes/Routes";
import { useAuth0 } from "@auth0/auth0-react";
import { PageLoader } from "./components/PageLoader";

function App() {

  const { isLoading, error } = useAuth0();

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  return <AppRoutes />
}

export default App;
