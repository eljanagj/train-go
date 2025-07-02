import React, { useEffect } from "react";
import AppRoutes from "./routes/Routes";
import { useAuth0 } from "@auth0/auth0-react";
import { PageLoader } from "./components/PageLoader";
import { setTokenGetter, clearTokenCache } from "./services/api";

function App() {
  const { isLoading, error, getAccessTokenSilently, isAuthenticated, user } =
    useAuth0();

  useEffect(() => {
    console.log("Auth state changed:", { isAuthenticated, user });
    if (isAuthenticated) {
      console.log("Setting token getter...");
      setTokenGetter(getAccessTokenSilently);
    } else {
      console.log("Clearing token cache...");
      clearTokenCache();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  return <AppRoutes />;
}

export default App;
