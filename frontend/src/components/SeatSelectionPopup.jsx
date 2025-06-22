import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { seatService } from '../services/seatService';
import '../styles/SeatSelectionPopup.css';

const SeatSelectionPopup = ({ isOpen, onClose, trainId, date, time, selectedSeats = [], onSeatSelect, userId, selectedClass }) => {
  const [seatConfig, setSeatConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSeatData = async () => {
      try {
        setLoading(true);
        console.log('Fetching seat data for:', { trainId, date, time });
        // Get seat details for specific date and time
        const seatConfigData = await seatService.getSeatDetails(
          trainId,
          date,
          time
        );
        console.log('Seat config data received:', seatConfigData);
        setSeatConfig(seatConfigData);
      } catch (err) {
        setError('Failed to load seat data');
        console.error('Error fetching seat data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen && trainId && date && time) {
      fetchSeatData();
    }
  }, [isOpen, trainId, date, time]);

  const getSeatStatus = (seatNumber) => {
    if (selectedSeats && selectedSeats.includes(seatNumber)) return 'selected';
    const seat = seatConfig[seatNumber];
    if (!seat) {
      console.log(`No seat data found for seat ${seatNumber}`);
      return 'unknown';
    }
    console.log(`Seat ${seatNumber} status:`, seat.status);
    return seat.status || 'available';
  };

  const getSeatInfo = (seatNumber) => {
    const seatData = seatConfig[seatNumber];
    if (!seatData) {
      console.log(`No seat info found for seat ${seatNumber}`);
      return { row: 0, position: 'unknown' };
    }
    return {
      row: seatData.row,
      position: seatData.position,
      type: seatData.type,
      class: seatData.class,
      price: seatData.price,
      status: seatData.status || 'available'
    };
  };

  const renderSeat = (seatNumber) => {
    const status = getSeatStatus(seatNumber);
    const seatInfo = getSeatInfo(seatNumber);
    const isClickable = status === 'available' || status === 'selected';

    if (seatInfo.class !== selectedClass) {
      return null;
    }

    return (
      <div
        key={seatNumber}
        className={`seat ${status}`}
        onClick={() => isClickable && onSeatSelect({ seatNumber, ...seatInfo })}
        title={`Seat ${seatNumber} - ${seatInfo.type} - ${seatInfo.class} - €${seatInfo.price} - ${status}`}
      >
        {seatNumber}
      </div>
    );
  };

  if (!isOpen) return null;
  if (loading) return <div className="seat-selection-popup">Loading seats...</div>;
  if (error) return <div className="seat-selection-popup">{error}</div>;

  // Group seats by row
  const seatsByRow = Object.entries(seatConfig).reduce((acc, [seatNumber, seatData]) => {
    if (seatData.class === selectedClass) {
      if (!acc[seatData.row]) {
        acc[seatData.row] = [];
      }
      acc[seatData.row].push({ seatNumber, ...seatData });
    }
    return acc;
  }, {});

  // Sort rows numerically
  const sortedRows = Object.keys(seatsByRow).sort((a, b) => Number(a) - Number(b));

  return (
    <div className="seat-selection-popup">
      <div className="popup-header">
        <h2>Select Seat(s) for {selectedClass.toUpperCase()} Class</h2>
        <button className="close-button" onClick={onClose}>
          <FaTimes />
        </button>
      </div>
      <div className="seat-map">
        {sortedRows.map(rowNum => (
          <div key={rowNum} className="seat-row">
            <div className="row-number">{rowNum}</div>
            <div className="row-seats">
              {seatsByRow[rowNum]
                .sort((a, b) => a.position.localeCompare(b.position))
                .map(seat => renderSeat(seat.seatNumber))}
            </div>
          </div>
        ))}
      </div>
      <div className="seat-legend">
        <div className="legend-item">
          <div className="seat-sample available" />
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="seat-sample selected" />
          <span>Selected</span>
        </div>
        <div className="legend-item">
          <div className="seat-sample reserved" />
          <span>Reserved</span>
        </div>
      </div>
      <div className="seat-info">
        <p className="text-muted">
          <small>
            • Click on available seats to select them<br />
            • Reserved seats cannot be selected<br />
            • Hover over seats to see more details
          </small>
        </p>
      </div>
    </div>
  );
};

export default SeatSelectionPopup;
