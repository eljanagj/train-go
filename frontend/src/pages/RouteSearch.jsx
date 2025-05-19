import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/RouteSearch.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { Link } from "react-router-dom";
import { FaTrain, FaClock, FaMapMarkerAlt, FaEuroSign, FaChevronDown, FaChevronUp, FaCalendarAlt } from "react-icons/fa";
import { useAuth0, withAuthenticationRequired } from "@auth0/auth0-react";
import { PageLoader } from "../components/PageLoader";

function TrainSearchPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [fromOptions, setFromOptions] = useState([]);
  const [toOptions, setToOptions] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [schedules, setSchedules] = useState({});
  const [selectedDate, setSelectedDate] = useState("");

  // Fetch station names for autocomplete
  const fetchStations = async (prefix, setOptions) => {
    if (!prefix) return setOptions([]);
    try {
      const res = await fetch(`http://localhost:3000/routes/autocomplete?prefix=${encodeURIComponent(prefix)}`);
      const data = await res.json();
      setOptions(data);
    } catch {
      setOptions([]);
    }
  };

  // Search for routes using backend
  const handleSearch = async () => {
    setLoading(true);
    setError("");
    setResults([]);
    setExpandedRoute(null);
    setSchedules({});
    setSelectedDate("");
    try {
      const res = await fetch(
        `http://localhost:3000/routes/search?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
      );
      if (!res.ok) throw new Error("No routes found");
      const data = await res.json();
      setResults(data);
    } catch (err) {
      setError(err.message || "Error searching routes");
    } finally {
      setLoading(false);
    }
  };

  const handleRouteExpand = async (route) => {
    if (expandedRoute === route.id) {
      setExpandedRoute(null);
      setSelectedDate("");
      return;
    }

    setExpandedRoute(route.id);
    
    // If we haven't fetched schedules for this route yet
    if (!schedules[route.id]) {
      try {
        const res = await fetch(`http://localhost:3000/schedules/route/${route.id}`);
        if (!res.ok) throw new Error("Failed to fetch schedules");
        const data = await res.json();
        setSchedules(prev => ({
          ...prev,
          [route.id]: data
        }));
      } catch (err) {
        setError("Failed to load schedules");
        console.error(err);
      }
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const filterSchedulesByDate = (schedules) => {
    if (!selectedDate) return schedules;
    return schedules.filter(schedule => {
      const scheduleDate = new Date(schedule.departureTime).toDateString();
      const selectedDateObj = new Date(selectedDate).toDateString();
      return scheduleDate === selectedDateObj;
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
              <div className="col-md-4">
                <input
                  className="form-control"
                  list="from-stations"
                  placeholder="From"
                  value={from}
                  onChange={e => {
                    setFrom(e.target.value);
                    fetchStations(e.target.value, setFromOptions);
                  }}
                />
                <datalist id="from-stations">
                  {fromOptions.map((city, idx) => (
                    <option key={idx} value={city} />
                  ))}
                </datalist>
              </div>
              <div className="col-md-4">
                <input
                  className="form-control"
                  list="to-stations"
                  placeholder="To"
                  value={to}
                  onChange={e => {
                    setTo(e.target.value);
                    fetchStations(e.target.value, setToOptions);
                  }}
                />
                <datalist id="to-stations">
                  {toOptions.map((city, idx) => (
                    <option key={idx} value={city} />
                  ))}
                </datalist>
              </div>
              <div className="col-md-2 d-grid">
                <button
                  className="btn search-btn"
                  onClick={handleSearch}
                  disabled={!from || !to || loading}
                >
                  {loading ? "Searching..." : "Search Routes"}
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
              <h4 className="search-title mb-4">Available Routes</h4>
              <div className="table-responsive">
                <table className="table route-table">
                  <thead className="table-dark">
                    <tr>
                      <th><FaMapMarkerAlt className="me-2" />From</th>
                      <th><FaMapMarkerAlt className="me-2" />To</th>
                      <th><FaEuroSign className="me-2" />Price</th>
                      <th>Capacity</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((route) => (
                      <React.Fragment key={route.id}>
                        <tr className="route-row">
                          <td>{route.departureStation}</td>
                          <td>{route.arrivalStation}</td>
                          <td>€{route.price}</td>
                          <td>{route.capacity}</td>
                          <td>
                            <button
                              className="btn search-btn btn-sm me-2"
                              onClick={() => handleRouteExpand(route)}
                            >
                              {expandedRoute === route.id ? (
                                <FaChevronUp className="me-1" />
                              ) : (
                                <FaChevronDown className="me-1" />
                              )}
                              Schedules
                            </button>
                          </td>
                        </tr>
                        {expandedRoute === route.id && (
                          <tr>
                            <td colSpan="5" className="p-0">
                              <div className="schedules-container p-3">
                                {schedules[route.id] ? (
                                  <>
                                    <div className="date-selector mb-3">
                                      <label className="form-label d-flex align-items-center">
                                        <FaCalendarAlt className="me-2" />
                                        Select Date:
                                      </label>
                                      <input
                                        type="date"
                                        className="form-control"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                      />
                                    </div>
                                  <div className="schedules-list">
                                      {filterSchedulesByDate(schedules[route.id]).map((schedule) => (
                                      <div key={schedule.id} className="schedule-card">
                                        <div className="schedule-info">
                                          <div className="time-info">
                                            <div className="departure">
                                              <FaClock className="icon" />
                                                <span>Departure: {formatTime(schedule.departureTime)}</span>
                                            </div>
                                            <div className="duration">
                                              <span>{schedule.duration} minutes</span>
                                            </div>
                                            <div className="arrival">
                                              <FaClock className="icon" />
                                                <span>Arrival: {formatTime(schedule.arrivalTime)}</span>
                                            </div>
                                          </div>
                                          <div className="train-info">
                                            <FaTrain className="icon" />
                                              <span>{schedule.train.trainName} (Train #{schedule.train.trainNumber})</span>
                                          </div>
                                        </div>
                                        <Link
                                          to="/reservation"
                                          state={{ schedule }}
                                          className="btn btn-primary"
                                        >
                                          Select
                                        </Link>
                                      </div>
                                    ))}
                                      {filterSchedulesByDate(schedules[route.id]).length === 0 && (
                                        <div className="text-center text-muted">
                                          <p>No schedules available for the selected date.</p>
                                        </div>
                                      )}
                                  </div>
                                  </>
                                ) : (
                                  <div className="text-center">
                                    <div className="spinner-border spinner-border-sm" role="status">
                                      <span className="visually-hidden">Loading...</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {results.length === 0 && from && to && !loading && !error && (
            <div className="text-center text-muted mt-4">
              <p>No matching routes found.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default withAuthenticationRequired(TrainSearchPage, {
  onRedirecting: () => <PageLoader />,
});