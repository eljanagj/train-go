import React, { useState, useEffect } from 'react';
import { Container, Table, Alert, Spinner } from 'react-bootstrap';
import Sidebar from '../../components/Sidebar';
import { userService } from '../../services/userService';
import '../../styles/management.css';

const UsersPage = ({ theme, toggleTheme }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const userData = await userService.getAllUsers();
      setUsers(userData);
    } catch (err) {
      setError('Failed to load users');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <Sidebar theme={theme} onToggleTheme={toggleTheme} />
        <div className="management-page">
          <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <Spinner animation="border" role="status" />
          </Container>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Sidebar theme={theme} onToggleTheme={toggleTheme} />
      <div className="management-page">
        <Container fluid className="mt-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>User Management</h2>
            <div className="text-muted">
              Total Users: {users.length}
            </div>
          </div>
          
          {error && (
            <Alert variant="danger" onClose={() => setError('')} dismissible>
              {error}
            </Alert>
          )}

          {users.length === 0 ? (
            <Alert variant="info">No users found</Alert>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead className="table-dark">
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Auth0 ID</th>
                    <th>User ID</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <div className="fw-bold">
                          {user.name || 'N/A'}
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <small className="text-muted font-monospace">
                          {user.auth0Id}
                        </small>
                      </td>
                      <td>
                        <small className="text-muted font-monospace">
                          {user.id}
                        </small>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
};

export default UsersPage; 