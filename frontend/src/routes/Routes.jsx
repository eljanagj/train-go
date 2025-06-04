// src/routes/AppRoutes.js
import React from 'react';
import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import ReservationPage from "../pages/Reservation";
import ProfilePage from "../pages/ProfilePage";
import TrainManagement from '../pages/admin/TrainManagement';
import RouteManagement from '../pages/admin/RouteManagement';
import ScheduleManagement from '../pages/admin/ScheduleManagement';
import ReservationManagement from '../pages/admin/ReservationManagement';
import PaymentManagement from '../pages/admin/PaymentManagement';
import TicketManagement from '../pages/admin/TicketManagement';
import RouteSearch from '../pages/RouteSearch';
import SeatManagement from '../pages/admin/SeatManagement';
import PaymentPage from '../pages/PaymentPage';
import PaymentConfirmation from '../pages/PaymentConfirmation';
import MaintenanceManagement from '../pages/admin/MaintenanceManagement';

export default function AppRoutes({ theme, toggleTheme }) {
  return (
    <Routes>
        <Route path="/" element={<Home theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/search" element={<RouteSearch theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/reservation" element={<ReservationPage theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/profile" element={<ProfilePage theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin/trains" element={<TrainManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin/trains/:trainId/seats" element={<SeatManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin/routes" element={<RouteManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin/schedules" element={<ScheduleManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin/reservations" element={<ReservationManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin/payments" element={<PaymentManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin/tickets" element={<TicketManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/admin/maintenance" element={<MaintenanceManagement theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/payment/:reservationId" element={<PaymentPage theme={theme} toggleTheme={toggleTheme} />} />
        <Route path="/reservations/:reservationId/confirmation" element={<PaymentConfirmation theme={theme} toggleTheme={toggleTheme} />} />
    </Routes>
  );
}
