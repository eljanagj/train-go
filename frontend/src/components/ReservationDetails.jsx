import React, { useState } from 'react';
import CancellationRequestForm from './CancellationRequestForm';

const ReservationDetails = ({ reservation }) => {
  const [showCancellationForm, setShowCancellationForm] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      {/* Existing reservation details */}
      
      {reservation.status === 'CONFIRMED' && (
        <button
          onClick={() => setShowCancellationForm(true)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Request Cancellation
        </button>
      )}

      {showCancellationForm && (
        <CancellationRequestForm
          reservationId={reservation.id}
          onClose={() => setShowCancellationForm(false)}
        />
      )}
    </div>
  );
};

 