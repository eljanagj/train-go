import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Badge,
  Modal,
  Form,
  Nav,
  Tab,
  InputGroup,
  FormControl,
  NavDropdown,
  Alert,
  Spinner
} from 'react-bootstrap';
import {
  FaTools,
  FaCheck,
  FaExclamationTriangle,
  FaClock,
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaChartBar,
  FaBell,
  FaDownload,
  FaHistory,
  FaMapMarkerAlt,
  FaUserCog,
  FaClipboardList,
  FaTrain
} from 'react-icons/fa';
import { maintenanceService } from '../../services/maintenanceService';
import { trainService } from '../../services/trainService';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Sidebar from '../../components/Sidebar';
import FilterDropdown from '../../components/FilterDropdown';
import '../../styles/maintenance.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const MaintenanceManagement = () => {


  const [maintenanceList, setMaintenanceList] = useState([]);
  const [trains, setTrains] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showFilter, setShowFilter] = useState(false);
  const [stats, setStats] = useState({
    operational: 0,
    underMaintenance: 0,
    outOfService: 0,
    scheduled: 0,
    overdue: 0,
    critical: 0
  });

  const [formData, setFormData] = useState({
    trainId: '',
    maintenanceType: '',
    description: '',
    priority: 'medium',
    status: 'pending',
    scheduledDate: '',
    assignedTechnician: '',
    partsRequired: '',
    estimatedDuration: '',
    location: ''
  });

  const [chartData, setChartData] = useState({
    pie: {
      labels: ['Operational', 'Under Maintenance', 'Out of Service', 'Scheduled'],
      datasets: [{
        data: [0, 0, 0, 0],
        backgroundColor: ['#28a745', '#17a2b8', '#dc3545', '#ffc107'],
        borderWidth: 1,
      }],
    },
    bar: {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      datasets: [
        {
          label: 'Completed',
          data: Array(12).fill(0),
          backgroundColor: '#28a745',
        },
        {
          label: 'Pending',
          data: Array(12).fill(0),
          backgroundColor: '#ffc107',
        },
      ],
    },
  });

  const maintenanceTypes = [
    { value: 'routine', label: 'Routine' },
    { value: 'preventive', label: 'Preventive' },
    { value: 'corrective', label: 'Corrective' },
    { value: 'emergency', label: 'Emergency' }
  ];

  useEffect(() => {
    loadMaintenanceData();
    loadTrains();
  }, []);

  const loadTrains = async () => {
    try {
      const data = await trainService.getAllTrains();
      setTrains(data);
    } catch (error) {
      console.error('Error loading trains:', error);
    }
  };

  const loadMaintenanceData = async () => {
    try {
      setLoading(true);
      const data = await maintenanceService.getAllMaintenance();
      setMaintenanceList(data);
      updateStats(data);
    } catch (error) {
      console.error('Error loading maintenance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStats = (data) => {
    const operational = data.filter(m => m.status === 'completed').length;
    const maintenance = data.filter(m => m.status === 'in_progress').length;
    const critical = data.filter(m => m.priority === 'high').length;
    const overdue = data.filter(m => m.status === 'overdue').length;

    setStats({
      operational,
      underMaintenance: maintenance,
      outOfService: data.filter(item => item.status === 'out_of_service').length,
      scheduled: data.filter(item => item.status === 'scheduled').length,
      overdue,
      critical,
    });

    // Update pie chart data
    setChartData(prev => ({
      ...prev,
      pie: {
        ...prev.pie,
        datasets: [{
          ...prev.pie.datasets[0],
          data: [operational, maintenance, critical, overdue],
        }],
      },
    }));

    // Calculate maintenance trends from actual data
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short' });
    }).reverse();

    console.log('Last 12 months labels:', last12Months);
    console.log('All maintenance data received:', data);

    const completedByMonth = last12Months.map(month => {
      const completedThisMonth = data.filter(m => 
        m.status === 'completed' && 
        new Date(m.completedDate).toLocaleString('default', { month: 'short' }) === month
      );
      console.log(`Completed in ${month}:`, completedThisMonth);
      return completedThisMonth.length;
    });

    const pendingByMonth = last12Months.map(month => {
      const pendingThisMonth = data.filter(m => 
        (m.status === 'pending' || m.status === 'in_progress') && 
        new Date(m.scheduledDate).toLocaleString('default', { month: 'short' }) === month
      );
      console.log(`Pending/In Progress in ${month}:`, pendingThisMonth);
      return pendingThisMonth.length;
    });

    // Update bar chart data with real data
    setChartData(prev => ({
      ...prev,
      bar: {
        labels: last12Months,
        datasets: [
          {
            label: 'Completed',
            data: completedByMonth,
            backgroundColor: '#28a745',
          },
          {
            label: 'Pending',
            data: pendingByMonth,
            backgroundColor: '#ffc107',
          },
        ],
      },
    }));
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { variant: 'warning', text: 'Pending' },
      in_progress: { variant: 'info', text: 'In Progress' },
      completed: { variant: 'success', text: 'Completed' },
      out_of_service: { variant: 'danger', text: 'Out of Service' },
      scheduled: { variant: 'primary', text: 'Scheduled' },
      overdue: { variant: 'danger', text: 'Overdue' }
    };

    const config = statusConfig[status] || { variant: 'secondary', text: status };
    return <Badge bg={config.variant}>{config.text}</Badge>;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formattedData = {
        trainId: selectedMaintenance ? selectedMaintenance.train.trainID : parseInt(formData.trainId),
        scheduledDate: new Date(formData.scheduledDate).toISOString(),
        estimatedDuration: formData.estimatedDuration ? parseInt(formData.estimatedDuration) : undefined,
        status: formData.status.toLowerCase(),
        maintenanceType: formData.maintenanceType.toLowerCase(),
        priority: formData.priority.toLowerCase(),
        description: formData.description,
        assignedTechnician: formData.assignedTechnician || 'Unassigned',
        partsRequired: formData.partsRequired,
        location: formData.location
      };

      console.log('Submitting maintenance data:', formattedData);

      if (selectedMaintenance) {
        await maintenanceService.updateMaintenance(selectedMaintenance.id, formattedData);
      } else {
        await maintenanceService.createMaintenance(formattedData);
      }
      setShowModal(false);
      loadMaintenanceData();
    } catch (error) {
      console.error('Error saving maintenance:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance record?')) {
      try {
        await maintenanceService.deleteMaintenance(id);
        loadMaintenanceData();
      } catch (error) {
        console.error('Error deleting maintenance:', error);
      }
    }
  };

  const handleFilterChange = (status) => {
    setFilterStatus(status);
  };

  const filteredMaintenance = maintenanceList.filter(item => {
    const matchesSearch = item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.maintenanceType.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.train?.trainName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const renderOverview = () => (
    <div className="overview-section">
      <Row className="g-4 mb-4">
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="status-icon operational me-3">
                  <FaCheck />
                </div>
                <div>
                  <h6 className="card-subtitle mb-1">Operational</h6>
                  <h3 className="card-title mb-0">{stats.operational}</h3>
                </div>
              </div>
              <p className="text-muted mb-0">Trains in service</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="status-icon maintenance me-3">
                  <FaTools />
                </div>
                <div>
                  <h6 className="card-subtitle mb-1">Under Maintenance</h6>
                  <h3 className="card-title mb-0">{stats.underMaintenance}</h3>
                </div>
              </div>
              <p className="text-muted mb-0">Trains in maintenance</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="status-icon critical me-3">
                  <FaExclamationTriangle />
                </div>
                <div>
                  <h6 className="card-subtitle mb-1">Critical Issues</h6>
                  <h3 className="card-title mb-0">{stats.critical}</h3>
                </div>
              </div>
              <p className="text-muted mb-0">Trains with critical issues</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex align-items-center mb-3">
                <div className="status-icon overdue me-3">
                  <FaClock />
                </div>
                <div>
                  <h6 className="card-subtitle mb-1">Overdue Tasks</h6>
                  <h3 className="card-title mb-0">{stats.overdue}</h3>
                </div>
              </div>
              <p className="text-muted mb-0">Maintenance tasks overdue</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Maintenance Status Distribution</Card.Title>
              <div className="chart-container">
                <Pie data={chartData.pie} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Maintenance Trends</Card.Title>
              <div className="chart-container">
                <Bar data={chartData.bar} options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    },
                  },
                }} />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-4 mt-4">
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Upcoming Maintenance</Card.Title>
              <div className="upcoming-list">
                {maintenanceList
                  .filter(item => item.status === 'scheduled')
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="upcoming-item d-flex align-items-center p-3 border-bottom">
                      <div className="status-icon maintenance me-3">
                        <FaTools />
                      </div>
                      <div className="upcoming-details flex-grow-1">
                        <h6 className="mb-1">{item.maintenanceType}</h6>
                        <p className="mb-0 text-muted">{item.description}</p>
                        <small className="upcoming-date">
                          Scheduled: {new Date(item.scheduledDate).toLocaleDateString()}
                        </small>
                      </div>
                      <Badge bg="info" className="ms-2">
                        {item.priority}
                      </Badge>
                    </div>
                  ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={6}>
          <Card className="h-100">
            <Card.Body>
              <Card.Title>Recent Activity</Card.Title>
              <div className="activity-list">
                {maintenanceList
                  .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                  .slice(0, 5)
                  .map((item, index) => (
                    <div key={index} className="activity-item d-flex align-items-center p-3 border-bottom">
                      <div className={`status-icon ${item.status.toLowerCase()} me-3`}>
                        {item.status === 'completed' ? <FaCheck /> :
                         item.status === 'in_progress' ? <FaTools /> :
                         item.status === 'overdue' ? <FaClock /> :
                         <FaExclamationTriangle />}
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{item.maintenanceType}</h6>
                        <p className="mb-0 text-muted">{item.description}</p>
                        <small className="text-muted">
                          Updated: {new Date(item.updatedAt).toLocaleString()}
                        </small>
                      </div>
                      <Badge bg={getStatusBadge(item.status).variant} className="ms-2">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );

  const renderMaintenanceList = () => (
    <Card>
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <InputGroup style={{ maxWidth: '300px' }}>
            <InputGroup.Text>
              <FaSearch />
            </InputGroup.Text>
            <FormControl
              placeholder="Search maintenance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <div className="d-flex gap-2">
            <FilterDropdown 
              filterStatus={filterStatus}
              onFilterChange={handleFilterChange}
            />
            <Button variant="primary" onClick={() => {
              setSelectedMaintenance(null);
              setFormData({
                trainId: '',
                maintenanceType: '',
                description: '',
                priority: 'medium',
                status: 'pending',
                scheduledDate: '',
                assignedTechnician: '',
                partsRequired: '',
                estimatedDuration: '',
                location: ''
              });
              setShowModal(true);
            }}>
              <FaPlus className="me-2" /> New Maintenance
            </Button>
          </div>
        </div>

        <Table responsive hover>
          <thead>
            <tr>
              <th>Train</th>
              <th>Type</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Scheduled Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaintenance.map((item) => (
              <tr key={item.id}>
                <td>{item.train?.trainName || 'Unknown Train'}</td>
                <td>{item.maintenanceType}</td>
                <td>{item.description}</td>
                <td>
                  <Badge bg={item.priority === 'high' ? 'danger' : item.priority === 'medium' ? 'warning' : 'info'}>
                    {item.priority}
                  </Badge>
                </td>
                <td>{getStatusBadge(item.status)}</td>
                <td>{new Date(item.scheduledDate).toLocaleDateString()}</td>
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => {
                      setSelectedMaintenance(item);
                      setFormData({
                        ...item,
                        trainId: item.train.trainID,
                        scheduledDate: new Date(item.scheduledDate).toISOString().slice(0, 16)
                      });
                      setShowModal(true);
                    }}
                  >
                    <FaEdit />
                  </Button>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleDelete(item.id)}
                  >
                    <FaTrash />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );

  return (
    <div className="page-container">
      <Sidebar />
      <div className="management-page">
        <Container fluid className="py-4">
          <Row className="mb-4">
            <Col>
              <h2 className="d-flex align-items-center gap-2">
                <FaTools /> Maintenance Management
              </h2>
            </Col>
          </Row>

          <Nav variant="tabs" className="mb-4">
            <Nav.Item>
              <Nav.Link active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
                <FaChartBar className="me-2" /> Overview
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')}>
                <FaClipboardList className="me-2" /> Maintenance List
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link active={activeTab === 'history'} onClick={() => setActiveTab('history')}>
                <FaHistory className="me-2" /> History
              </Nav.Link>
            </Nav.Item>
          </Nav>

          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && renderOverview()}
              {activeTab === 'maintenance' && renderMaintenanceList()}
              {activeTab === 'history' && (
                <Card>
                  <Card.Body>
                    <h5>Maintenance History</h5>
                    <Table responsive hover>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Train</th>
                          <th>Type</th>
                          <th>Description</th>
                          <th>Status</th>
                          <th>Technician</th>
                        </tr>
                      </thead>
                      <tbody>
                        {maintenanceList
                          .filter(item => item.status === 'completed')
                          .sort((a, b) => new Date(b.completedDate || b.updatedAt) - new Date(a.completedDate || a.updatedAt))
                          .map((item) => (
                            <tr key={item.id}>
                              <td>{new Date(item.completedDate || item.updatedAt).toLocaleDateString()}</td>
                              <td>{item.train?.trainName || 'Unknown Train'}</td>
                              <td>{item.maintenanceType}</td>
                              <td>{item.description}</td>
                              <td>{getStatusBadge(item.status)}</td>
                              <td>{item.assignedTechnician}</td>
                            </tr>
                          ))}
                      </tbody>
                    </Table>
                  </Card.Body>
                </Card>
              )}
            </>
          )}

          <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
            <Modal.Header closeButton>
              <Modal.Title>
                {selectedMaintenance ? 'Edit Maintenance' : 'New Maintenance'}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Train</Form.Label>
                      <Form.Select
                        value={formData.trainId}
                        onChange={(e) => setFormData({ ...formData, trainId: e.target.value })}
                        required
                        disabled={selectedMaintenance !== null}
                      >
                        <option value="">Select Train</option>
                        {trains.map(train => (
                          <option key={train.trainID} value={train.trainID}>
                            {train.trainName}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Maintenance Type</Form.Label>
                      <Form.Select
                        value={formData.maintenanceType}
                        onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                        required
                        disabled={selectedMaintenance !== null}
                      >
                        <option value="">Select Type</option>
                        {maintenanceTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Priority</Form.Label>
                      <Form.Select
                        value={formData.priority}
                        onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        disabled={selectedMaintenance !== null}
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status</Form.Label>
                      <Form.Select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="out_of_service">Out of Service</option>
                        <option value="scheduled">Scheduled</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Scheduled Date</Form.Label>
                      <Form.Control
                        type="datetime-local"
                        value={formData.scheduledDate}
                        onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                        required
                        disabled={selectedMaintenance !== null}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Assigned Technician</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.assignedTechnician}
                        onChange={(e) => setFormData({ ...formData, assignedTechnician: e.target.value })}
                        disabled={selectedMaintenance !== null}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Parts Required</Form.Label>
                      <Form.Control
                        type="text"
                        value={formData.partsRequired}
                        onChange={(e) => setFormData({ ...formData, partsRequired: e.target.value })}
                        disabled={selectedMaintenance !== null}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Estimated Duration (hours)</Form.Label>
                      <Form.Control
                        type="number"
                        value={formData.estimatedDuration}
                        onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                        disabled={selectedMaintenance !== null}
                      />
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>Location</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={selectedMaintenance !== null}
                  />
                </Form.Group>

                <div className="d-flex justify-content-end gap-2">
                  <Button variant="secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" type="submit">
                    {selectedMaintenance ? 'Update' : 'Create'}
                  </Button>
                </div>
              </Form>
            </Modal.Body>
          </Modal>
        </Container>
      </div>
    </div>
  );
};

export default MaintenanceManagement;