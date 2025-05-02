// src/components/AuthButtons.jsx
import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";
import { LoginButton } from "./buttons/LogInButton";
import { SignupButton } from "./buttons/SignUpButton";
import "../styles/AuthButtons.css";

export const AuthButtons = () => {
  const { user, isAuthenticated, logout } = useAuth0();

  return (
    <div className="nav-bar__buttons">
      {!isAuthenticated && (
        <>
          <SignupButton />
          <LoginButton />
        </>
      )}

      {isAuthenticated && (
        <div className="dropdown">
          <button
            className="btn btn-link nav-link dropdown-toggle p-0"
            type="button"
            id="profileDropdown"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            <img
              src={user.picture}
              alt={user.name}
              className="rounded-circle"
              width="30"
            />
          </button>
          <ul
            className="dropdown-menu dropdown-menu-end"
            aria-labelledby="profileDropdown"
          >
            <li>
              <Link className="dropdown-item" to="/profile">
                Profile
              </Link>
            </li>
            <li>
              <hr className="dropdown-divider" />
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() =>
                  logout({ logoutParams: { returnTo: window.location.origin } })
                }
              >
                Log out
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};
