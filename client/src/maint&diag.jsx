import React, { useState } from "react";
import "./maint&diag.css";

function Maintenance() {
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
      <h1>Maintenance & Diagnostics</h1>
      <p>Track and manage your vehicle's maintenance history.</p>

      {/* Vehicle Selection */}
      <section>
        <h2>Selected Vehicle</h2>
        <select>
          <option>2022 Dodge Charger</option>
          <option>2020 Honda Civic</option>
        </select>
      </section>

      {/* Add Maintenance */}
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

          <button type="submit">Add Record</button>
        </form>
      </section>

      {/* Maintenance History */}
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

      {/* Diagnostics */}
      <section>
        <h2>Vehicle Diagnostics</h2>
        <p>Describe any issues you're experiencing with your vehicle.</p>

        <textarea placeholder="Describe your vehicle's symptoms..." />

        <button type="button">Ask AI Assistant</button>
      </section>
    </div>
  );
}

export default Maintenance;