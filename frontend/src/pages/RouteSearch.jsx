import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../styles/RouteSearch.css";
import { NavBar } from "../components/NavBar";
import { Footer } from "../components/Footer";
import { Link } from "react-router-dom";
import { FaTrain, FaClock, FaMapMarkerAlt, FaEuroSign } from "react-icons/fa";
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
              <div className="col-md-3">
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
                    {results.map((r, idx) => (
                      <tr key={idx} className="route-row">
                        <td>{r.departureStation}</td>
                        <td>{r.arrivalStation}</td>
                        <td>€{r.price}</td>
                        <td>{r.capacity}</td>
                        <td>
                          <Link
                            to="/reservation"
                            state={{ route: r }}
                            className="btn search-btn btn-sm"
                          >
                            Select
                          </Link>
                        </td>
                      </tr>
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