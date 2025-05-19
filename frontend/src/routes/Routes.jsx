// src/routes/AppRoutes.js
import React from 'react';
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import ReservationPage from "../pages/Reservation";
import ProfilePage from "../pages/ProfilePage";
import TrainManagement from '../pages/TrainManagement';
import RouteManagement from '../pages/RouteManagement';
import ScheduleManagement from '../pages/ScheduleManagement';
import RouteSearch from '../pages/RouteSearch';
import SeatManagement from '../pages/SeatManagement';

export default function AppRoutes({ theme, toggleTheme }) {
  return (
    <Routes>
        <Route path="/" element={<Home theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/search" element={<RouteSearch theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/reservation" element={<ReservationPage theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/profile" element={<ProfilePage theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/trains" element={<TrainManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/trains/:trainId/seats" element={<SeatManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/routes" element={<RouteManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/schedules" element={<ScheduleManagement theme={theme} toggleTheme={toggleTheme} />} />
    </Routes>
  );
}
