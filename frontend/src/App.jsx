import React, { useEffect } from "react";
import AppRoutes from "./routes/Routes";
import { useAuth0 } from "@auth0/auth0-react";
import { PageLoader } from "./components/PageLoader";
import { setTokenGetter, clearTokenCache } from "./services/api";

function App() {
  const { isLoading, error, getAccessTokenSilently, isAuthenticated } = useAuth0();

  useEffect(() => {
    if (isAuthenticated) {
      setTokenGetter(getAccessTokenSilently);
    } else {
      clearTokenCache();
    }
  }, [isAuthenticated, getAccessTokenSilently]);

  if (error) {
    return <div>Oops... {error.message}</div>;
  }

  if (isLoading) {
    return <PageLoader />;
  }

  return <AppRoutes />
}

export default App;
