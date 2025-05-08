// src/routes/AppRoutes.js
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import RouteSearch from "../pages/RouteSearch";
import ReservationPage from "../pages/Reservation";
import ProfilePage from "../pages/ProfilePage";
import TrainManagement from '../pages/TrainManagement';
import RouteManagement from '../pages/RouteManagement';
import ScheduleManagement from '../pages/ScheduleManagement';

export default function AppRoutes() {
  return (
    <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/search" element={<RouteSearch />} />
        <Route path="/reservation" element={<ReservationPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/trains" element={<TrainManagement />} />
        <Route path="/routes" element={<RouteManagement />} />
        <Route path="/schedules" element={<ScheduleManagement />} />
    </Routes>
  );
}
