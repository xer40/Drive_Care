import { useEffect, useRef, useState } from "react";
import "./maint&diag.css";
import { authFetch } from "./auth.js";
import DiagnosticsChat from "./DiagnosticsChat.jsx";

function Maintenance() {
  const [activeTab, setActiveTab] = useState("overview");

  // The logged-in user's vehicles from the database, and which one is selected
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  useEffect(() => {
    authFetch("/api/vehicles")
      .then((data) => {
        setVehicles(data.vehicles);
        if (data.vehicles.length > 0) setSelectedVehicleId(data.vehicles[0].id);
      })
      .catch((err) => console.error("Could not load vehicles:", err.message));
  }, []);

  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
  const vehicleName = selectedVehicle
    ? `${selectedVehicle.year} ${selectedVehicle.make} ${selectedVehicle.model}`
    : "";

  // Quick Diagnostics card: what the user typed, and the question handed to the full chat.
  // chatSession changes every time the card sends a question, which starts a fresh conversation
  const [quickMessage, setQuickMessage] = useState("");
  const [chatQuestion, setChatQuestion] = useState("");
  const [chatSession, setChatSession] = useState(0);
  const chatRef = useRef(null);

  const openDiagnostics = (question = "") => {
    setChatQuestion(question.trim());
    setChatSession((session) => session + 1);
    setActiveTab("diagnostics");
    setQuickMessage("");
    // Wait for the chat to appear, then scroll to it
    setTimeout(() => chatRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  const [records, setRecords] = useState([
  {
    id: 1,
    service: "Oil Change",
    category: "Oil & Fluids",
    date: "2026-09-15",
    mileage: 42000,
    cost: 89.99,
    location: "Valvoline",
    icon: "🛢️",
  },
  {
    id: 2,
    service: "Brake Pads (Front)",
    category: "Brakes",
    date: "2026-08-02",
    mileage: 39400,
    cost: 350.00,
    location: "Local Shop",
    icon: "🔧",
  },
  {
    id: 3,
    service: "Air Filter",
    category: "Filters",
    date: "2026-06-10",
    mileage: 37200,
    cost: 45.00,
    location: "AutoZone",
    icon: "🔩",
  },
  {
    id: 4,
    service: "Tire Rotation",
    category: "Tires",
    date: "2026-03-18",
    mileage: 33100,
    cost: 30.00,
    location: "Discount Tire",
    icon: "🛞",
  },
  {
    id: 5,
    service: "Battery Replacement",
    category: "Electrical",
    date: "2026-01-05",
    mileage: 28500,
    cost: 220.00,
    location: "Dealer",
    icon: "🔋",
  },
]);

  const [newRecord, setNewRecord] = useState({
    service: "",
    date: "",
    mileage: "",
    cost: "",
  });

  const handleChange = (e) => {
    setNewRecord({
      ...newRecord,
      [e.target.name]: e.target.value,
    });
  };

  const addRecord = (e) => {
    e.preventDefault();

    const record = {
      ...newRecord,
      id: Date.now(),
    };

    setRecords([...records, record]);

    setNewRecord({
      service: "",
      date: "",
      mileage: "",
      cost: "",
    });
  };

  return (
    <div className="maintenance-page">

      {/* ===================================
          PAGE HEADER
      =================================== */}

      <div className="maintenance-header">

        <div className="maintenance-header-text">
          <h1>Maintenance & Diagnostics</h1>

          <p>
            Track your maintenance history, get reminders,
            and diagnose issues with AI.
          </p>
        </div>

        {/* Vehicle Selector */}
        <div className="maintenance-vehicle-selector">
          <select
            value={selectedVehicleId ?? ""}
            onChange={(e) => setSelectedVehicleId(Number(e.target.value))}
            disabled={vehicles.length === 0}
          >
            {vehicles.length === 0 && <option value="">No vehicles added yet</option>}
            {vehicles.map((vehicle) => (
              <option key={vehicle.id} value={vehicle.id}>
                {vehicle.year} {vehicle.make} {vehicle.model}
              </option>
            ))}
          </select>
        </div>

      </div>

      {/* ===================================
          MAINTENANCE NAVIGATION TABS
      =================================== */}

      <div className="maintenance-tabs">

        <button
          type="button"
          className={activeTab === "overview" ? "active" : ""}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>

        <button
          type="button"
          className={activeTab === "records" ? "active" : ""}
          onClick={() => setActiveTab("records")}
        >
          Maintenance Records
        </button>

        <button
          type="button"
          className={activeTab === "add" ? "active" : ""}
          onClick={() => setActiveTab("add")}
        >
          Add Record
        </button>

        <button
          type="button"
          className={activeTab === "diagnostics" ? "active" : ""}
          onClick={() => openDiagnostics()}
        >
          Diagnose Issue
        </button>

        <button
          type="button"
          className={activeTab === "schedule" ? "active" : ""}
          onClick={() => setActiveTab("schedule")}
        >
          Service Schedule
        </button>

      </div>

      {/* ===================================
          AI DIAGNOSTICS CHAT
          Opens from the "Diagnose Issue" tab or the Quick Diagnostics card
      =================================== */}

      {activeTab === "diagnostics" && (
        <section ref={chatRef} className="diagnostics-chat-section">
          {/* key: a new car or a new quick question starts a fresh conversation */}
          <DiagnosticsChat
            key={`${selectedVehicleId ?? "none"}-${chatSession}`}
            vehicleId={selectedVehicleId}
            vehicleName={vehicleName}
            initialMessage={chatQuestion}
          />
        </section>
      )}

      {/* ===================================
          MAINTENANCE DASHBOARD
          Both cards go inside this container
      =================================== */}

      <div className="maintenance-dashboard">

        {/* ===================================
            CARD 1: VEHICLE OVERVIEW
        =================================== */}

        <div className="vehicle-overview-card">

          {/* Vehicle Image */}
          <div className="vehicle-image">
            <img
              src="https://images.unsplash.com/photo-1493238792000-8113da705763"
              alt="Vehicle"
            />
          </div>

          {/* Vehicle Information */}
          <div className="vehicle-overview-info">

            <div className="vehicle-overview-heading">
              <h2>2022 Dodge Charger</h2>             
              <span className="vehicle-status">Active</span>
            </div>

            <p className="vehicle-trim">SRT Hellcat Widebody</p>

            <div className="vehicle-overview-details">

              <div>
                <span>Current Mileage</span>
                <strong>42,500 mi</strong>
              </div>

              <div>
                <span>Last Service</span>
                <strong>Sep 15, 2026</strong>
              </div>

            </div>

            <button
              type="button"
              className="vehicle-details-button"
            >
              View Vehicle Details →
            </button>

          </div>

        </div>

        {/* ===================================
            ⭐ NEW CARD ADDED HERE ⭐
            CARD 2: NEXT MAINTENANCE
        =================================== */}

        <div className="next-maintenance-card">

          {/* Card Header */}
          <div className="next-maintenance-header">
            <h2>Next Maintenance</h2>
            <span className="maintenance-icon">🔧</span>
          </div>

          {/* Maintenance Information */}
          <div className="next-maintenance-content">

            <span className="maintenance-label">
              UPCOMING SERVICE
            </span>

            <h3>Oil Change</h3>

            <p className="maintenance-due">
              Due in <strong>1,200 miles</strong>
            </p>

            {/* Mileage Progress Bar */}
            <div className="maintenance-progress">
              <div className="maintenance-progress-fill"></div>
            </div>

            {/* Mileage Information */}
            <div className="maintenance-mileage">
              <span>42,500 mi</span>
              <span>43,700 mi</span>
            </div>

            {/* Reminder Message */}
            <div className="maintenance-reminder">
              <span>🔔</span>
              <p>
                Keep your vehicle running smoothly
                by staying on schedule.
              </p>
            </div>

          </div>

          {/* Service Schedule Button */}
          <button
            type="button"
            className="maintenance-schedule-button"
            onClick={() => setActiveTab("schedule")}
          >
            View Service Schedule →
          </button>

        </div>
                {/* ===================================
            CARD 3: QUICK DIAGNOSTICS
        =================================== */}

        <div className="quick-diagnostics-card">

          <div className="quick-diagnostics-header">
            <h2>Quick Diagnostics</h2>
            <span className="diagnostics-icon">🤖</span>
          </div>

          <p className="quick-diagnostics-description">
            Experiencing an issue with your vehicle?
            Describe the symptoms and let AI help.
          </p>

          <textarea
            className="quick-diagnostics-input"
            placeholder="e.g., My car makes a squeaking noise when braking..."
            value={quickMessage}
            onChange={(e) => setQuickMessage(e.target.value)}
          />

          <div className="diagnostics-suggestions">
            <span>Common Issues</span>

            <div className="diagnostics-chips">
              <button type="button" onClick={() => setQuickMessage("My engine is making an unusual noise")}>Engine Noise</button>
              <button type="button" onClick={() => setQuickMessage("A warning light came on on my dashboard")}>Warning Light</button>
              <button type="button" onClick={() => setQuickMessage("Something feels wrong when I brake")}>Braking Issues</button>
              <button type="button" onClick={() => setQuickMessage("My car is slow to start or the battery seems weak")}>Battery</button>
            </div>
          </div>

          <button
            type="button"
            className="diagnostics-analyze-button"
            onClick={() => openDiagnostics(quickMessage)}
          >
            ✨ Diagnose with AI
          </button>

        </div>
              
      </div>
      {/* END OF MAINTENANCE DASHBOARD */}
       
            {/* ===================================
          MAINTENANCE STATISTICS
      =================================== */}

      <div className="maintenance-stats">

        {/* CARD 1: TOTAL RECORDS */}
        <div className="maintenance-stat-card">

          <div className="stat-icon stat-icon-blue">
            📄
          </div>

          <div className="stat-info">
            <h3>5</h3>
            <p>Total Records</p>
          </div>

          <span className="stat-arrow">›</span>

        </div>

        {/* CARD 2: TOTAL SPENT */}
        <div className="maintenance-stat-card">

          <div className="stat-icon stat-icon-blue">
            💲
          </div>

          <div className="stat-info">
            <h3>$642</h3>
            <p>Total Spent (This Year)</p>
          </div>

          <span className="stat-arrow">›</span>

        </div>

        {/* CARD 3: UPCOMING SERVICES */}
        <div className="maintenance-stat-card">

          <div className="stat-icon stat-icon-blue">
            📅
          </div>

          <div className="stat-info">
            <h3>3</h3>
            <p>Upcoming Services</p>
          </div>

          <span className="stat-arrow">›</span>

        </div>

        {/* CARD 4: VEHICLE HEALTH */}
        <div className="maintenance-stat-card">

          <div className="stat-icon stat-icon-green">
            ✓
          </div>

          <div className="stat-info">
            <h3>All Good</h3>
            <p>No critical issues</p>
          </div>

          <span className="stat-arrow">›</span>

        </div>

      </div>
      
      
      {/* ===================================
    MAINTENANCE HISTORY TABLE
=================================== */}
<div className="maintenance-bottom-grid">
<section className="maintenance-history-section">

  {/* Header */}
  <div className="history-header">

    <h2>Maintenance History</h2>

    <button type="button" className="history-filter-button">
      ⚲ Filter
    </button>

  </div>

  {/* Table */}
  <div className="history-table-wrapper">

    <table className="history-table">

      <thead>
        <tr>
          <th>Service</th>
          <th>Date</th>
          <th>Mileage</th>
          <th>Cost</th>
          <th>Location</th>
          <th></th>
        </tr>
      </thead>

      <tbody>

        {records.map((record) => (

          <tr key={record.id}>

            {/* Service */}
            <td>
              <div className="history-service">

                <span className="history-service-icon">
                  {record.icon || "🔧"}
                </span>

                <div className="history-service-info">
                  <strong>{record.service}</strong>
                  <span>{record.category || "General Maintenance"}</span>
                </div>

              </div>
            </td>

            {/* Date */}
            <td>
              {new Date(`${record.date}T00:00:00`).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }
              )}
            </td>

            {/* Mileage */}
            <td>
              {Number(record.mileage).toLocaleString()} mi
            </td>

            {/* Cost */}
            <td className="history-cost">
              ${Number(record.cost).toFixed(2)}
            </td>

            {/* Location */}
            <td>{record.location || "Not specified"}</td>

            {/* Actions */}
            <td>
              <button
                type="button"
                className="history-actions-button"
              >
                •••
              </button>
            </td>

          </tr>

        ))}

      </tbody>

    </table>

  </div>

</section>
    {/* ===================================
    RIGHT COLUMN: MAINTENANCE SIDEBAR
=================================== */}

<div className="maintenance-right-column">

  {/* ===================================
      MAINTENANCE COSTS
  =================================== */}

  <div className="maintenance-costs-card">

    <div className="costs-header">
      <h2>Maintenance Costs</h2>

      <select defaultValue="year">
        <option value="year">This Year</option>
        <option value="month">This Month</option>
        <option value="all">All Time</option>
      </select>
    </div>

    <div className="costs-content">

      {/* DONUT CHART */}
      <div className="costs-donut">

        <div className="costs-donut-center">
          <strong>$642</strong>
          <span>Total</span>
        </div>

      </div>

      {/* COST BREAKDOWN */}
      <div className="costs-legend">

        <div className="costs-legend-item">
          <span className="legend-dot tires"></span>
          <span className="legend-name">Tires</span>
          <strong>$120</strong>
          <span className="legend-percent">19%</span>
        </div>

        <div className="costs-legend-item">
          <span className="legend-dot brakes"></span>
          <span className="legend-name">Brakes</span>
          <strong>$350</strong>
          <span className="legend-percent">55%</span>
        </div>

        <div className="costs-legend-item">
          <span className="legend-dot fluids"></span>
          <span className="legend-name">Oil & Fluids</span>
          <strong>$89</strong>
          <span className="legend-percent">14%</span>
        </div>

        <div className="costs-legend-item">
          <span className="legend-dot filters"></span>
          <span className="legend-name">Filters</span>
          <strong>$45</strong>
          <span className="legend-percent">7%</span>
        </div>

        <div className="costs-legend-item">
          <span className="legend-dot other"></span>
          <span className="legend-name">Other</span>
          <strong>$38</strong>
          <span className="legend-percent">6%</span>
        </div>

      </div>

    </div>

  </div>

  {/* ===================================
      COMMON SERVICES
  =================================== */}

  <div className="common-services-card">

    <div className="common-services-header">
      <h2>Common Services for Your Vehicle</h2>

      <button type="button" className="common-view-all">
        View All →
      </button>
    </div>

    <div className="common-service-item">

      <span className="common-service-icon oil-icon">🛢️</span>

      <div className="common-service-info">
        <strong>Oil Change</strong>
        <span>Every 5,000 – 7,500 mi</span>
      </div>

      <button type="button" className="common-learn-button">
        Learn More
      </button>

    </div>

    <div className="common-service-item">

      <span className="common-service-icon tire-icon">🛞</span>

      <div className="common-service-info">
        <strong>Tire Rotation</strong>
        <span>Every 5,000 – 8,000 mi</span>
      </div>

      <button type="button" className="common-learn-button">
        Learn More
      </button>

    </div>

    <div className="common-service-item">

      <span className="common-service-icon brake-icon">🔧</span>

      <div className="common-service-info">
        <strong>Brake Inspection</strong>
        <span>Every 10,000 – 15,000 mi</span>
      </div>

      <button type="button" className="common-learn-button">
        Learn More
      </button>

    </div>

  </div>

</div>

</div> {/* END OF MAINTENANCE BOTTOM GRID */}


    </div>
  );
}

export default Maintenance;