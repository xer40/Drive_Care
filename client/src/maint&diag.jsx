import React, { useState } from "react";
import "./maint&diag.css";

function Maintenance() {
  const [activeTab, setActiveTab] = useState("overview");

  const [records, setRecords] = useState([
    {
      id: 1,
      service: "Oil Change",
      date: "2026-09-15",
      mileage: 42000,
      cost: 89.99,
    },
    {
      id: 2,
      service: "Brake Replacement",
      date: "2026-08-10",
      mileage: 39500,
      cost: 350,
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
          <select>
            <option>2022 Dodge Charger</option>
            <option>2020 Honda Civic</option>
            <option>2025 Hyundai Gray</option>
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
          onClick={() => setActiveTab("diagnostics")}
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

      </div>
      {/* END OF MAINTENANCE DASHBOARD */}

      {/* ===================================
          ADD MAINTENANCE RECORD
      =================================== */}

      <section>
        <h2>Add Maintenance Record</h2>

        <form onSubmit={addRecord}>

          <input
            name="service"
            placeholder="Service Type"
            value={newRecord.service}
            onChange={handleChange}
            required
          />

          <input
            type="date"
            name="date"
            value={newRecord.date}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="mileage"
            placeholder="Mileage"
            value={newRecord.mileage}
            onChange={handleChange}
            required
          />

          <input
            type="number"
            name="cost"
            placeholder="Cost"
            value={newRecord.cost}
            onChange={handleChange}
            min="0"
            step="0.01"
            required
          />

          <button type="submit">
            Add Record
          </button>

        </form>
      </section>

      {/* ===================================
          MAINTENANCE HISTORY
      =================================== */}

      <section>
        <h2>Maintenance History</h2>

        {records.map((record) => (
          <div key={record.id} className="maintenance-card">

            <h3>{record.service}</h3>

            <p>Date: {record.date}</p>

            <p>Mileage: {record.mileage}</p>

            <p>Cost: ${Number(record.cost).toFixed(2)}</p>

          </div>
        ))}
      </section>

      {/* ===================================
          VEHICLE DIAGNOSTICS
      =================================== */}

      <section>
        <h2>Vehicle Diagnostics</h2>

        <p>
          Describe any issues you're experiencing with your vehicle.
        </p>

        <textarea
          placeholder="Describe your vehicle's symptoms..."
        />

        <button type="button">
          Ask AI Assistant
        </button>

      </section>

    </div>
  );
}

export default Maintenance;