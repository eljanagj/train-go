// src/routes/AppRoutes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import RouteSearch from "../pages/RouteSearch";
import LoginPage from "../pages/Login";
import SignupPage from "../pages/Signup";
import ReservationPage from "../pages/Reservation";

export default function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<RouteSearch />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/reservation" element={<ReservationPage />} />

    </Routes>
  );
}
