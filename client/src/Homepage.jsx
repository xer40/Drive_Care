import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken, getTokenPayload, isLoggedIn, logout } from './auth.js';
import './Homepage.css';
import { Link } from "react-router-dom";

const backend = import.meta.env.VITE_BACKEND_LINK || 'http://localhost:5001';

export default function Homepage() {
  const navigate = useNavigate();

  // User info from token payload (falls back to 'Guest' or 'Driver')
  const userPayload = getTokenPayload();
  const displayName = userPayload?.username || 'User 1';

  // Vehicles and maintenance dynamic state (starts EMPTY for new user experience)
  const [vehicles, setVehicles] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [aiQuestion, setAiQuestion] = useState('');

  // Modal State for adding a vehicle
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    year: '2022',
    make: '',
    model: '',
    trim: '',
    current_mileage: '',
    imageUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sample prompt pills for AI
  const promptPills = [
    'Why is my car making a noise?',
    'When should I change my brake pads?',
    'Best tires for my car?'
  ];

  // Automotive placeholder photos
  const defaultCarImages = [
    'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1590362891988-f7780470208b?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=700&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=700&auto=format&fit=crop&q=80'
  ];

  // Try fetching real vehicles from backend if user is logged in
  useEffect(() => {
    async function fetchUserData() {
      const token = getToken();
      if (!token) return;

      try {
        const res = await fetch(`${backend}/api/vehicles`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data.vehicles && data.vehicles.length > 0) {
            setVehicles(data.vehicles);
          }
        }
      } catch {
        // Backend not running or .env not set: safely stay in local mode
      }
    }
    fetchUserData();
  }, []);

  // Handle adding a vehicle (both locally and to backend if connected)
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    if (!newVehicle.make || !newVehicle.model) return;

    setIsSubmitting(true);
    const token = getToken();
    const carImage = newVehicle.imageUrl.trim() || 
      defaultCarImages[vehicles.length % defaultCarImages.length];

    const carData = {
      id: Date.now(),
      year: parseInt(newVehicle.year, 10) || 2023,
      make: newVehicle.make,
      model: newVehicle.model,
      trim: newVehicle.trim || 'Standard',
      current_mileage: parseInt(newVehicle.current_mileage, 10) || 12000,
      imageUrl: carImage
    };

    // Attempt backend sync
    if (token) {
      try {
        await fetch(`${backend}/api/vehicles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            make: carData.make,
            model: carData.model,
            year: carData.year,
            current_mileage: carData.current_mileage
          })
        });
      } catch {
        // Offline / local fallback
      }
    }

    // Update frontend state immediately
    setVehicles((prev) => [...prev, carData]);
    setIsSubmitting(false);
    setIsModalOpen(false);
    setNewVehicle({
      year: '2023',
      make: '',
      model: '',
      trim: '',
      current_mileage: '',
      imageUrl: ''
    });
  };

  // Helper function to toggle demo mockup data on and off for testing
  const toggleDemoData = () => {
    if (vehicles.length === 0) {
      setVehicles([
        {
          id: 1,
          year: 2019,
          make: 'Audi',
          model: 'A4',
          trim: 'Premium Plus S Line 45 TFSI ',
          current_mileage: 78000,
          imageUrl: 'https://static0.carbuzzimages.com/wordpress/wp-content/uploads/gallery-images/original/435000/500/435552.jpg'
        },
        {
          id: 2,
          year: 2020,
          make: 'Honda',
          model: 'Civic',
          trim: 'Sport',
          current_mileage: 28320,
          imageUrl: 'https://hips.hearstapps.com/hmg-prod/images/img-9756-1590075686.jpg?resize=980:*'
        }
      ]);
      setMaintenance([
        { id: 1, name: 'Oil Change', status: 'Due in 1,200 mi', date: 'Oct 15, 2026 • 44,000 mi', type: 'upcoming' },
        { id: 2, name: 'Tire Rotation', status: 'Due in 2,500 mi', date: 'Nov 10, 2026 • 45,500 mi', type: 'upcoming' },
        { id: 3, name: 'Brake Inspection', status: 'Due in 4,000 mi', date: 'Dec 15, 2026 • 47,000 mi', type: 'upcoming' }
      ]);
    } else {
      setVehicles([]);
      setMaintenance([]);
    }
  };

  return (
    <div className="dc-dashboard">
      

      {/* ===================== MAIN CONTENT ===================== */}
      <main className="dc-main">
       

        {/* Dashboard Content */}
        <div className="dc-content-body">
          {/* Hero Row: Welcome Banner + Ask AI Card */}
          <section className="dc-hero-row">
            <div className="dc-welcome-banner">
              <div className="dc-banner-content">
                <h1 className="dc-banner-title">Welcome back,<br />{displayName}</h1>
                <p className="dc-banner-subtitle">
                  {vehicles.length === 0 
                    ? 'Get started by adding your first vehicle to unlock tracking, maintenance schedules, and AI-powered insights.'
                    : 'Keep your car running smoothly. Track maintenance, get AI-powered insights, and connect with a community of car enthusiasts.'
                  }
                </p>
                <button className="dc-btn-primary" onClick={() => setIsModalOpen(true)}>
                  <span>+ Add Vehicle</span>
                  <span className="dc-btn-arrow">→</span>
                </button>
              </div>
              <div className="dc-banner-car-image">
                <img 
                  src={vehicles[0]?.imageUrl || "https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=800&auto=format&fit=crop&q=80"} 
                  alt="Dashboard Vehicle" 
                />
              </div>
            </div>

            {/* AI Assistant Card */}
            <div className="dc-ai-card">
              <div className="dc-ai-header">
                <div className="dc-ai-icon-badge">✨</div>
                <div>
                  <h3 className="dc-ai-title">Ask DriveCare AI</h3>
                  <p className="dc-ai-subtitle">
                    Get instant answers about maintenance, repairs, and your specific vehicle.
                  </p>
                </div>
              </div>

              <div className="dc-ai-input-wrapper">
                <input 
                  type="text" 
                  placeholder={vehicles.length > 0 ? `Ask a question about your ${vehicles[0].make}...` : "Ask a question about your car..."}
                  value={aiQuestion}
                  onChange={(e) => setAiQuestion(e.target.value)}
                  className="dc-ai-input"
                />
                <button className="dc-ai-submit-btn" aria-label="Send">
                  →
                </button>
              </div>

              <div className="dc-ai-pills">
                {promptPills.map((pill, idx) => (
                  <button 
                    key={idx} 
                    className="dc-ai-pill-btn"
                    onClick={() => setAiQuestion(pill)}
                  >
                    {pill}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Metric Stats Row (Dynamic numbers based on user's cars) */}
          <section className="dc-stats-row">
            <div className="dc-stat-card" onClick={() => setIsModalOpen(true)}>
              <div className="dc-stat-icon-wrapper blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.8C2.1 10.7 2 10.8 2 11v5c0 .6.4 1 1 1h2" />
                  <circle cx="7" cy="17" r="2" />
                  <circle cx="17" cy="17" r="2" />
                </svg>
              </div>
              <div className="dc-stat-details">
                <span className="dc-stat-number">{vehicles.length}</span>
                <span className="dc-stat-label">Vehicles in Garage</span>
              </div>
              <span className="dc-stat-chevron">›</span>
            </div>

            <div className="dc-stat-card" onClick={() => navigate('/maintenance')}>
              <div className="dc-stat-icon-wrapper light-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div className="dc-stat-details">
                <span className="dc-stat-number">{vehicles.length > 0 ? '5' : '0'}</span>
                <span className="dc-stat-label">Maintenance Records</span>
              </div>
              <span className="dc-stat-chevron">›</span>
            </div>

            <div className="dc-stat-card" onClick={() => navigate('/maintenance')}>
              <div className="dc-stat-icon-wrapper soft-blue">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <div className="dc-stat-details">
                <span className="dc-stat-number">{vehicles.length > 0 ? maintenance.length : '0'}</span>
                <span className="dc-stat-label">Upcoming Services</span>
              </div>
              <span className="dc-stat-chevron">›</span>
            </div>

            <div className="dc-stat-card">
              <div className="dc-stat-icon-wrapper pale-blue">
                <span className="dc-currency-symbol">$</span>
              </div>
              <div className="dc-stat-details">
                <span className="dc-stat-number">{vehicles.length > 0 ? '$642' : '$0'}</span>
                <span className="dc-stat-label">Total Expenses</span>
              </div>
              <span className="dc-stat-chevron">›</span>
            </div>
          </section>

          {/* 3-Column Content Layout */}
          <section className="dc-columns-grid">
            {/* COLUMN 1: My Vehicles */}
            <div className="dc-grid-col">
              <div className="dc-section-header">
                <h2>My Vehicles</h2>
                {vehicles.length > 0 && <span className="dc-view-all">Total: {vehicles.length}</span>}
              </div>

              {/* EMPTY STATE: Shown when user has 0 cars */}
              {vehicles.length === 0 ? (
                <div className="dc-empty-state-card">
                  <div className="dc-empty-icon">🚗</div>
                  <h3>Your garage is empty</h3>
                  <p>You haven't added any vehicles yet. Add your car to start keeping track of mileage, repairs, and services.</p>
                  <button className="dc-btn-primary" onClick={() => setIsModalOpen(true)}>
                    + Add Your First Vehicle
                  </button>
                </div>
              ) : (
                /* POPULATED STATE: Render cars dynamically */
                <>
                  {/* Primary Vehicle */}
                  <div className="dc-vehicle-card primary">
                    <div className="dc-vehicle-img-wrapper">
                      <img 
                        src={vehicles[0].imageUrl} 
                        alt={`${vehicles[0].year} ${vehicles[0].make}`} 
                      />
                      <span className="dc-badge primary">Primary</span>
                    </div>
                    <div className="dc-vehicle-body">
                      <div className="dc-vehicle-title-row">
                        <div>
                          <h3>{vehicles[0].year} {vehicles[0].make} {vehicles[0].model}</h3>
                          <p className="dc-vehicle-trim">{vehicles[0].trim}</p>
                        </div>
                        <button className="dc-options-btn">•••</button>
                      </div>

                      <div className="dc-vehicle-tags">
                        <span className="dc-tag">📅 {vehicles[0].year}</span>
                        <span className="dc-tag">⚙ {vehicles[0].make}</span>
                        <span className="dc-tag">{vehicles[0].model}</span>
                        <span className="dc-tag">🏷 {vehicles[0].trim}</span>
                      </div>

                      <div className="dc-vehicle-odometer">
                        <span>🛣 {Number(vehicles[0].current_mileage || 0).toLocaleString()} miles</span>
                      </div>
                    </div>
                  </div>

                  {/* Secondary Vehicles */}
                  {vehicles.slice(1).map((car) => (
                    <div key={car.id} className="dc-vehicle-card secondary">
                      <img 
                        src={car.imageUrl} 
                        alt={`${car.make} ${car.model}`} 
                        className="dc-small-thumb"
                      />
                      <div className="dc-secondary-details">
                        <h4>{car.year} {car.make} {car.model}</h4>
                        <p className="dc-vehicle-trim">{car.trim}</p>
                        <span className="dc-vehicle-odometer-small">
                          🛣 {Number(car.current_mileage || 0).toLocaleString()} miles
                        </span>
                      </div>
                      <button className="dc-options-btn">•••</button>
                    </div>
                  ))}

                  <button className="dc-add-vehicle-outline-btn" onClick={() => setIsModalOpen(true)}>
                    <span>⊕ Add Another Vehicle</span>
                  </button>
                </>
              )}
            </div>

            {/* COLUMN 2: Upcoming & Recent Maintenance */}
            <div className="dc-grid-col">
              <div className="dc-section-header">
                <h2>Upcoming Maintenance</h2>
                <span className="dc-view-all" onClick={() => navigate('/maintenance')} style={{ cursor: 'pointer' }}>View All →</span>
              </div>

              {vehicles.length === 0 ? (
                <div className="dc-empty-state-card small">
                  <div className="dc-empty-icon-small">🔧</div>
                  <h4>No upcoming services</h4>
                  <p>Service intervals will appear here once you add a car.</p>
                </div>
              ) : (
                <div className="dc-service-list upcoming">
                  <div className="dc-service-item" onClick={() => navigate('/maintenance')}>
                    <div className="dc-service-icon orange">🛢️</div>
                    <div className="dc-service-info">
                      <div className="dc-service-top">
                        <span className="dc-service-name">Oil Change</span>
                        <span className="dc-status-pill amber">Due in 1,200 mi</span>
                      </div>
                      <span className="dc-service-sub">Estimated: Oct 15, 2026 • 44,000 mi</span>
                    </div>
                    <span className="dc-item-arrow">›</span>
                  </div>

                  <div className="dc-service-item" onClick={() => navigate('/maintenance')}>
                    <div className="dc-service-icon amber">⚙️</div>
                    <div className="dc-service-info">
                      <div className="dc-service-top">
                        <span className="dc-service-name">Tire Rotation</span>
                        <span className="dc-status-pill amber">Due in 2,500 mi</span>
                      </div>
                      <span className="dc-service-sub">Estimated: Nov 10, 2026 • 45,500 mi</span>
                    </div>
                    <span className="dc-item-arrow">›</span>
                  </div>

                  <div className="dc-service-item" onClick={() => navigate('/maintenance')}>
                    <div className="dc-service-icon slate">🛑</div>
                    <div className="dc-service-info">
                      <div className="dc-service-top">
                        <span className="dc-service-name">Brake Inspection</span>
                        <span className="dc-status-pill amber">Due in 4,000 mi</span>
                      </div>
                      <span className="dc-service-sub">Estimated: Dec 15, 2026 • 47,000 mi</span>
                    </div>
                    <span className="dc-item-arrow">›</span>
                  </div>
                </div>
              )}

              {/* Recent Maintenance Section */}
              <div className="dc-section-header" style={{ marginTop: '28px' }}>
                <h2>Recent Maintenance</h2>
                <span className="dc-view-all" onClick={() => navigate('/maintenance')} style={{ cursor: 'pointer' }}>View All →</span>
              </div>

              {vehicles.length === 0 ? (
                <div className="dc-empty-state-card small">
                  <div className="dc-empty-icon-small">📋</div>
                  <h4>No service records</h4>
                  <p>Completed repairs and logged services will show up here.</p>
                </div>
              ) : (
                <div className="dc-service-list recent">
                  <div className="dc-service-item" onClick={() => navigate('/maintenance')}>
                    <div className="dc-service-icon green">✓</div>
                    <div className="dc-service-info">
                      <div className="dc-service-top">
                        <span className="dc-service-name">Oil Change</span>
                        <span className="dc-service-price">$89.99</span>
                      </div>
                      <span className="dc-service-sub">Sep 15, 2026 • 42,000 mi • Valvoline</span>
                    </div>
                    <span className="dc-item-arrow">›</span>
                  </div>

                  <div className="dc-service-item" onClick={() => navigate('/maintenance')}>
                    <div className="dc-service-icon blue">🔧</div>
                    <div className="dc-service-info">
                      <div className="dc-service-top">
                        <span className="dc-service-name">Brake Pads (Front)</span>
                        <span className="dc-service-price">$350.00</span>
                      </div>
                      <span className="dc-service-sub">Aug 2, 2026 • 39,400 mi • Local Shop</span>
                    </div>
                    <span className="dc-item-arrow">›</span>
                  </div>
                </div>
              )}
            </div>

            {/* COLUMN 3: Community Feed */}
            <div className="dc-grid-col">
              <div className="dc-section-header">

                <h2>Community Feed</h2>
                
                <Link to="/community" className="dc-view-all">
                View All →
                </Link>
              </div>

              {/* Feed Card 1 */}
              <div className="dc-feed-card">
                <div className="dc-feed-header">
                  <img 
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" 
                    alt="Daniel R." 
                    className="dc-feed-avatar"
                  />
                  <div className="dc-feed-user">
                    <span className="dc-feed-name">Daniel R.</span>
                    <span className="dc-feed-time">2h ago</span>
                  </div>
                  <button className="dc-options-btn">•••</button>
                </div>
                <p className="dc-feed-text">
                  Just installed new tires on my WRX! Huge difference in handling. Highly recommend the Michelin Pilot Sport 4S. 🏎️
                </p>
                <div className="dc-feed-img-wrapper">
                  <img 
                    src="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?w=600&auto=format&fit=crop&q=80" 
                    alt="Blue Subaru WRX" 
                    className="dc-feed-img"
                  />
                </div>
                <div className="dc-feed-footer">
                  <div className="dc-feed-actions">
                    <button className="dc-feed-btn">❤️ <span>24</span></button>
                    <button className="dc-feed-btn">💬 <span>8</span></button>
                  </div>
                  <button className="dc-feed-btn">🔖</button>
                </div>
              </div>

              {/* Feed Card 2 */}
              <div className="dc-feed-card">
                <div className="dc-feed-header">
                  <img 
                    src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" 
                    alt="Maria S." 
                    className="dc-feed-avatar"
                  />
                  <div className="dc-feed-user">
                    <span className="dc-feed-name">Maria S.</span>
                    <span className="dc-feed-time">5h ago</span>
                  </div>
                  <button className="dc-options-btn">•••</button>
                </div>
                <p className="dc-feed-text">
                  Any recommendations for brake pads for a 2019 Toyota Corolla? Looking for something reliable but not too expensive.
                </p>
                <div className="dc-feed-footer">
                  <div className="dc-feed-actions">
                    <button className="dc-feed-btn">❤️ <span>5</span></button>
                    <button className="dc-feed-btn">💬 <span>12</span></button>
                  </div>
                  <button className="dc-feed-btn">🔖</button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ===================== ADD VEHICLE MODAL ===================== */}
      {isModalOpen && (
        <div className="dc-modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="dc-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="dc-modal-header">
              <h3>Add New Vehicle</h3>
              <button className="dc-modal-close-btn" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleAddVehicle} className="dc-modal-form">
              <div className="dc-form-row">
                <div className="dc-form-group">
                  <label>Year</label>
                  <input 
                    type="number" 
                    required 
                    min="1980" 
                    max="2030"
                    value={newVehicle.year}
                    onChange={(e) => setNewVehicle({...newVehicle, year: e.target.value})}
                    placeholder="e.g. 2022"
                  />
                </div>
                <div className="dc-form-group">
                  <label>Make</label>
                  <input 
                    type="text" 
                    required 
                    value={newVehicle.make}
                    onChange={(e) => setNewVehicle({...newVehicle, make: e.target.value})}
                    placeholder="e.g. Dodge, Toyota, BMW"
                  />
                </div>
              </div>

              <div className="dc-form-row">
                <div className="dc-form-group">
                  <label>Model</label>
                  <input 
                    type="text" 
                    required 
                    value={newVehicle.model}
                    onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                    placeholder="e.g. Charger, Corolla, M3"
                  />
                </div>
                <div className="dc-form-group">
                  <label>Trim / Edition (Optional)</label>
                  <input 
                    type="text" 
                    value={newVehicle.trim}
                    onChange={(e) => setNewVehicle({...newVehicle, trim: e.target.value})}
                    placeholder="e.g. Hellcat, LE, Sport"
                  />
                </div>
              </div>

              <div className="dc-form-group">
                <label>Current Mileage</label>
                <input 
                  type="number" 
                  value={newVehicle.current_mileage}
                  min = "0"
                  onChange={(e) => setNewVehicle({...newVehicle, current_mileage: e.target.value})}
                  placeholder="e.g. 42500"
                />
              </div>

              <div className="dc-form-group">
                <label>Image URL (Optional)</label>
                <input 
                  type="url" 
                  value={newVehicle.imageUrl}
                  onChange={(e) => setNewVehicle({...newVehicle, imageUrl: e.target.value})}
                  placeholder="Paste an image link or leave blank for automatic photo"
                />
              </div>

              <div className="dc-modal-actions">
                <button 
                  type="button" 
                  className="dc-modal-btn cancel" 
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="dc-modal-btn submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Add Vehicle to Garage'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
