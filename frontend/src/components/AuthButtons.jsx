import React, { useState, useEffect, useRef } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link } from "react-router-dom";
import { LoginButton } from "./buttons/LogInButton";
import { SignupButton } from "./buttons/SignUpButton";
import "../styles/AuthButtons.css";

export const AuthButtons = () => {
  const { user, isAuthenticated, logout } = useAuth0();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const closeDropdown = () => {
    setIsDropdownOpen(false);
  };

  return (
    <div className="nav-bar__buttons">
      {!isAuthenticated && (
        <>
          <SignupButton />
          <LoginButton />
        </>
      )}

      {isAuthenticated && (
        <div className="dropdown" ref={dropdownRef}>
          <button
            className="btn btn-link nav-link dropdown-toggle p-0"
            type="button"
            onClick={toggleDropdown}
            aria-expanded={isDropdownOpen}
          >
            <img
              src={user.picture}
              alt={user.name}
              className="rounded-circle"
              width="30"
            />
          </button>
          {isDropdownOpen && (
            <ul className="dropdown-menu dropdown-menu-end show">
              <li>
                <Link className="dropdown-item" to="/profile" onClick={closeDropdown}>
                  Profile
                </Link>
              </li>
              <li>
                <hr className="dropdown-divider" />
              </li>
              <li>
                <button
                  className="dropdown-item"
                  onClick={() => {
                    closeDropdown();
                    logout({ logoutParams: { returnTo: window.location.origin } });
                  }}
                >
                  Log out
                </button>
              </li>
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
