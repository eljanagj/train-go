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
import Unauthorized from '../pages/Unauthorized';
import { ProtectedRoute, AdminRoute } from '../components/ProtectedRoute';
import MaintenanceManagement from '../pages/admin/MaintenanceManagement';
import Reviews from '../pages/Reviews';
import ReviewManagement from '../pages/admin/ReviewManagement';

export default function AppRoutes({ theme, toggleTheme }) {
  return (
    <Routes>
      {/* Public Routes - No Authentication Required */}
      <Route path="/" element={<Home theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/reviews" element={<Reviews theme={theme} toggleTheme={toggleTheme} />} />
      <Route path="/unauthorized" element={<Unauthorized theme={theme} toggleTheme={toggleTheme} />} />
      
      {/* Protected Routes - Authentication Required */}
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage theme={theme} toggleTheme={toggleTheme} />
        </ProtectedRoute>
      } />
      <Route path="/reservation" element={
        <ProtectedRoute>
          <ReservationPage theme={theme} toggleTheme={toggleTheme} />
        </ProtectedRoute>
      } />
      <Route path="/payment/:reservationId" element={
        <ProtectedRoute>
          <PaymentPage theme={theme} toggleTheme={toggleTheme} />
        </ProtectedRoute>
      } />
      <Route path="/reservations/:reservationId/confirmation" element={
        <ProtectedRoute>
          <PaymentConfirmation theme={theme} toggleTheme={toggleTheme} />
        </ProtectedRoute>
      } />
      <Route path="/search" element={
        <ProtectedRoute>
          <RouteSearch theme={theme} toggleTheme={toggleTheme} />
        </ProtectedRoute>
      } />


      {/* Admin Routes - Authentication + Admin Role Required */}
      <Route path="/admin/trains" element={
        <AdminRoute>
          <TrainManagement theme={theme} toggleTheme={toggleTheme} />
        </AdminRoute>
      } />
      <Route path="/admin/trains/:trainId/seats" element={
        <AdminRoute>
          <SeatManagement theme={theme} toggleTheme={toggleTheme} />
        </AdminRoute>
      } />
      <Route path="/admin/routes" element={
        <AdminRoute>
          <RouteManagement theme={theme} toggleTheme={toggleTheme} />
        </AdminRoute>
      } />
      <Route path="/admin/schedules" element={
        <AdminRoute>
          <ScheduleManagement theme={theme} toggleTheme={toggleTheme} />
        </AdminRoute>
      } />
      <Route path="/admin/reservations" element={
        <AdminRoute>
          <ReservationManagement theme={theme} toggleTheme={toggleTheme} />
        </AdminRoute>
      } />
      <Route path="/admin/payments" element={
        <AdminRoute>
          <PaymentManagement theme={theme} toggleTheme={toggleTheme} />
        </AdminRoute>
      } />
      <Route path="/admin/tickets" element={
        <AdminRoute>
          <TicketManagement theme={theme} toggleTheme={toggleTheme} />
        </AdminRoute>
      } />
      <Route path="/admin/maintenance" element={
        <AdminRoute>
          <MaintenanceManagement theme={theme} toggleTheme={toggleTheme} />
        </AdminRoute>
      } />
      <Route path="/admin/reviews" element={
        <AdminRoute>
          <ReviewManagement theme={theme} toggleTheme={toggleTheme} />
        </AdminRoute>
      } />
    </Routes>
  );
}
