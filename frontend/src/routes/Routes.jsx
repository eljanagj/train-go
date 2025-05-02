// src/routes/AppRoutes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import RouteSearch from "../pages/RouteSearch";
import ReservationPage from "../pages/Reservation";
import ProfilePage from "../pages/ProfilePage";

export default function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<RouteSearch />} />
        <Route path="/reservation" element={<ReservationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}
