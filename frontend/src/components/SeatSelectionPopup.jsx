import React from 'react';
import { FaTimes, FaChair, FaTrain } from 'react-icons/fa';
import '../styles/SeatSelectionPopup.css';

const SEAT_TYPES = {
  WINDOW: 'window',
  AISLE: 'aisle',
  PREMIUM: 'premium',
  ECONOMY: 'economy',
  BUSINESS: 'business'
};

const LOCATIONS = ['Front', 'Middle', 'Back'];

const SeatSelectionPopup = ({ isOpen, onClose, availableSeats, selectedSeat, onSeatSelect }) => {
  if (!isOpen) return null;

  const getSeatStatus = (seat) => {
    console.log("Checking status for seat:", seat.seatNumber, "Status:", seat.status);
    if (selectedSeat === seat.seatNumber) return 'selected';
    if (seat.status === 'reserved') return 'reserved';
    if (seat.status === 'pending') return 'pending';
    return 'available';
  };

  const getSeatInfo = (seatNumber) => {
    const row = parseInt(seatNumber.match(/\d+/)[0]);
    let position = 'left';
    if (seatNumber.endsWith('R') || seatNumber.endsWith('AR')) {
      position = 'right';
    }
    return { row, position };
  };

  const renderSeat = (seat) => {
    const status = getSeatStatus(seat);
    const isClickable = status === 'available' || status === 'selected';
    const { row, position } = getSeatInfo(seat.seatNumber);

    console.log("Seat object being rendered and passed to onSeatSelect:", seat);

    return (
      <div
        key={seat.seatNumber}
        className={`seat ${seat.type} ${status}`}
        onClick={() => isClickable && onSeatSelect(seat)}
        title={`Seat ${seat.seatNumber} - ${seat.type} - ${status}`}
      >
        <FaChair className="seat-icon" />
        <span className="seat-number">{seat.seatNumber}</span>
        {seat.price && <span className="seat-price">${parseFloat(seat.price).toFixed(0)}</span>}
      </div>
    );
  };

  const renderRow = (seats, rowNumber) => {
    const rowSeats = seats.filter(seat => getSeatInfo(seat.seatNumber).row === rowNumber);
    return (
      <div key={rowNumber} className="train-row">
        <div className="row-number">{rowNumber}</div>
        <div className="row-seats">
          <div className="seat-group left">
            {rowSeats.filter(seat => getSeatInfo(seat.seatNumber).position === 'left').map(renderSeat)}
          </div>
          <div className="aisle"></div>
          <div className="seat-group right">
            {rowSeats.filter(seat => getSeatInfo(seat.seatNumber).position === 'right').map(renderSeat)}
          </div>
        </div>
      </div>
    );
  };

  const renderLocationSection = (location) => {
    const locationSeats = availableSeats.filter(seat => seat.location === location);
    const rows = [...new Set(locationSeats.map(seat => getSeatInfo(seat.seatNumber).row))].sort((a, b) => a - b);
    
    return (
      <div key={location} className="train-section">
        <h4>{location} Section</h4>
        <div className="train-rows">
          {rows.map(row => renderRow(locationSeats, row))}
        </div>
      </div>
    );
  };

  return (
    <div className="seat-selection-overlay">
      <div className="seat-selection-popup">
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
        
        <div className="train-header">
          <FaTrain className="train-icon" />
          <h3>Select Your Seat</h3>
        </div>
        
        <div className="seat-legend">
          <div className="legend-item">
            <div className="seat available"></div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="seat selected"></div>
            <span>Selected</span>
          </div>
          <div className="legend-item">
            <div className="seat reserved"></div>
            <span>Reserved</span>
          </div>
          <div className="legend-item">
            <div className="seat pending"></div>
            <span>Pending</span>
          </div>
        </div>

        <div className="train-layout">
          {LOCATIONS.map(location => renderLocationSection(location))}
        </div>

        <div className="selected-seat-info">
          {selectedSeat && (
            <p>Selected Seat: {selectedSeat}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionPopup;
