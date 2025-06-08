import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/RouteSearch.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { Link } from "react-router-dom";
import { FaTrain, FaClock } from "react-icons/fa";
import { useAuth0 } from "@auth0/auth0-react";
import { PageLoader } from "../components/PageLoader";
import { routeService } from '../services/routeService';
import { scheduleService } from '../services/scheduleService';

function TrainSearchPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [travelDate, setTravelDate] = useState(() => {
    const today = new Date();
    today.setDate(today.getDate());
    return today.toISOString().split('T')[0];
  });
  const [fromOptions, setFromOptions] = useState([]);
  const [toOptions, setToOptions] = useState([]);
  const [allRoutes, setAllRoutes] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);

  React.useEffect(() => {
    fetchAllRoutes();
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown-container')) {
        setShowFromDropdown(false);
        setShowToDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchAllRoutes = async () => {
    try {
      const data = await routeService.getAllRoutes();
      setAllRoutes(data);

      const uniqueFromStations = [...new Set(data.map(route => route.departureStation))];
      setFromOptions(uniqueFromStations.sort());
    } catch (error) {
      console.error('Error fetching routes:', error);
    }
  };

  const handleFromSelect = (station) => {
    setFrom(station);
    setTo("");
    setShowFromDropdown(false);

    // Filter routes that depart from selected station and get unique destinations
    const availableDestinations = allRoutes
      .filter(route => route.departureStation === station)
      .map(route => route.arrivalStation);

    const uniqueDestinations = [...new Set(availableDestinations)];
    setToOptions(uniqueDestinations.sort());
  };

  const handleToSelect = (station) => {
    setTo(station);
    setShowToDropdown(false);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    try {
      // Filter routes locally instead of making a search API call
      const routes = allRoutes.filter(route => 
        route.departureStation === from && route.arrivalStation === to
      );

      if (routes.length === 0) {
        setError("No routes found for the selected stations");
        return;
      }

      const schedulesPromises = routes.map(async (route) => {
        try {
          const schedules = await scheduleService.getSchedulesByRoute(route.id);

          // Store the travel date with each schedule for reservation purposes
          return schedules.map(schedule => ({
            ...schedule,
            route: route,
            travelDate: new Date(travelDate).toISOString() // Ensure proper date format
          }));
        } catch (err) {
          console.error(`Error fetching schedules for route ${route.id}:`, err);
          return [];
        }
      });

      const allSchedules = await Promise.all(schedulesPromises);
      const flatSchedules = allSchedules.flat();
      setResults(flatSchedules);

      if (flatSchedules.length === 0) {
        setError("No schedules found for the selected route");
      }
    } catch (err) {
      setError(err.message || "Error searching routes");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="search-page">
      <NavBar />

      <header className="search-header text-center">
        <div className="search-container">
          <h1 className="search-title display-4 mb-3">Plan Your Journey</h1>
          <p className="lead text-light">Discover Your Next Adventure by Rail</p>

          <div className="container mt-5">
            <div className="row g-3 justify-content-center">
              <div className="col-md-3">
                <div className="dropdown-container">
                  <input
                    className="form-control dropdown-input"
                    placeholder="From"
                    value={from}
                    onClick={() => {
                      setShowFromDropdown(!showFromDropdown);
                      setShowToDropdown(false);
                    }}
                    onChange={e => setFrom(e.target.value)}
                    readOnly
                  />
                  {showFromDropdown && (
                    <div className="dropdown-menu show">
                      {fromOptions.map((station, idx) => (
                        <div
                          key={idx}
                          className="dropdown-item"
                          onClick={() => handleFromSelect(station)}
                        >
                          {station}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <div className="dropdown-container">
                  <input
                    className="form-control dropdown-input"
                    placeholder="To"
                    value={to}
                    onClick={() => {
                      if (from) {
                        setShowToDropdown(!showToDropdown);
                        setShowFromDropdown(false);
                      }
                    }}
                    onChange={e => setTo(e.target.value)}
                    readOnly
                    disabled={!from}
                  />
                  {showToDropdown && toOptions.length > 0 && (
                    <div className="dropdown-menu show">
                      {toOptions.map((station, idx) => (
                        <div
                          key={idx}
                          className="dropdown-item"
                          onClick={() => handleToSelect(station)}
                        >
                          {station}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="col-md-3">
                <input
                  type="date"
                  className="form-control"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="col-md-3 d-grid">
                <button
                  className="btn search-btn"
                  onClick={handleSearch}
                  disabled={!from || !to || !travelDate || loading}
                >
                  {loading ? "Searching..." : "Search"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="py-5">
        <div className="container">
          {error && (
            <div className="alert alert-danger text-center">{error}</div>
          )}
          {results.length > 0 && (
            <div className="results-container">
              <h4 className="search-title mb-4">Available Trains</h4>
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th scope="col">Route</th>
                      <th scope="col">Departure</th>
                      <th scope="col">Arrival</th>
                      <th scope="col">Train</th>
                      <th scope="col">Seats Available</th>
                      <th scope="col">Price</th>
                      <th scope="col">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((schedule) => (
                      <tr key={schedule.id}>
                        <td>
                          <div className="route-info">
                            <strong>{schedule.route.departureStation}</strong>
                            <span className="text-muted mx-2">→</span>
                            <strong>{schedule.route.arrivalStation}</strong>
                          </div>
                        </td>
                        <td>
                          <div className="time-info">
                            {formatTime(schedule.departureTime)}
                          </div>
                        </td>
                        <td>
                          <div className="time-info">
                            {formatTime(schedule.arrivalTime)}
                          </div>
                        </td>
                        <td>
                          <div className="train-info">
                            <div>
                              <div className="fw-bold">{schedule.train.trainName}</div>
                              <small className="text-muted">{schedule.train.trainNumber}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${(schedule.train.availableSeats || 0) > 0 ? 'bg-success' : 'bg-danger'}`}>
                            {schedule.train.availableSeats || 0}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-primary">€{schedule.route.price}</span>
                        </td>
                        <td>
                          {(schedule.train.availableSeats || 0) > 0 ? (
                            <Link
                              to="/reservation"
                              state={{ schedule }}
                              className="btn btn-primary btn-sm"
                            >
                              Select
                            </Link>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled
                            >
                              Sold Out
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.length === 0 && from && to && travelDate && !loading && !error && (
            <div className="text-center text-muted mt-4">
              <p>No trains found for the selected route and date.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default TrainSearchPage;