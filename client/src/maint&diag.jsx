import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./maint&diag.css";
import { authFetch } from "./auth.js";
import DiagnosticsChat from "./DiagnosticsChat.jsx";
import { VehiclePhoto, ChangePhotoButton } from "./VehiclePhoto.jsx";


// The API stores a record as { service_type, service_date, service_location, category, category_icon, ... }.
// The page's tables and form use shorter names, so records are converted on the way in and out
const toPageRecord = (record) => ({
  id: record.id,
  service: record.service_type,
  date: record.service_date,
  mileage: record.mileage,
  cost: record.cost,
  location: record.service_location,
  category: record.category,
  icon: record.category_icon,
});

const toApiRecord = (record) => ({
  service_type: record.service,
  service_date: record.date,
  mileage: record.mileage,
  cost: record.cost,
  service_location: record.location,
});

// "Sep 15, 2026" from a 'YYYY-MM-DD' date
const formatDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const formatMoney = (amount) =>
  `$${Number(amount || 0).toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

// Colours for the costs chart (the legend dots use the matching CSS classes)
const CATEGORY_STYLE = {
  Tires: { color: "#3b82f6", dot: "tires" },
  Brakes: { color: "#fb923c", dot: "brakes" },
  "Oil & Fluids": { color: "#22c55e", dot: "fluids" },
  Filters: { color: "#8b5cf6", dot: "filters" },
  Engine: { color: "#ef4444", dot: "engine" },
  Electrical: { color: "#eab308", dot: "electrical" },
  Other: { color: "#94a3b8", dot: "other" },
};

// Builds the donut's conic-gradient from the summary's cost_by_category. Grey ring when there's nothing to show
const donutBackground = (costByCategory = []) => {
  const used = costByCategory.filter((c) => c.total > 0);
  const total = used.reduce((sum, c) => sum + c.total, 0);
  if (total === 0) return "#e2e8f0";

  let start = 0;
  const slices = used.map((c) => {
    const end = start + (c.total / total) * 100;
    const slice = `${CATEGORY_STYLE[c.category]?.color || "#94a3b8"} ${start}% ${end}%`;
    start = end;
    return slice;
  });
  return `conic-gradient(${slices.join(", ")})`;
};

function Maintenance() {
  const [activeTab, setActiveTab] = useState("overview");
  const location = useLocation();
  const navigate = useNavigate();

  // The logged-in user's vehicles from the database, and which one is selected
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);


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

  // A question asked in the homepage's "Ask DriveCare AI" box arrives here as
  // { diagnoseQuestion, vehicleId }. It's sent once the vehicles have loaded: opening the chat earlier would
  // restart it when the car list arrives and ask the AI twice
  const handoff = useRef(location.state);

  useEffect(() => {
    const { diagnoseQuestion, vehicleId } = handoff.current || {};

    authFetch("/api/vehicles")
      .then((data) => {
        setVehicles(data.vehicles);
        const asked = data.vehicles.find((vehicle) => vehicle.id === vehicleId);
        if (asked) setSelectedVehicleId(asked.id);
        else if (data.vehicles.length > 0) setSelectedVehicleId(data.vehicles[0].id);
      })
      .catch((err) => console.error("Could not load vehicles:", err.message))
      .finally(() => {
        if (diagnoseQuestion) {
          openDiagnostics(diagnoseQuestion);
          // Forget the handed-over question so refreshing the page doesn't ask it again
          navigate(".", { replace: true, state: null });
        }
      });
    // Runs once when the page opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Maintenance records for the selected car, from the database
  const [records, setRecords] = useState([]);
  // Stat cards use this year's numbers; the costs chart uses whichever period is picked
  const [yearSummary, setYearSummary] = useState(null);
  const [costPeriod, setCostPeriod] = useState("year");
  const [costSummary, setCostSummary] = useState(null);
  // The car's next open reminder, for the Next Maintenance card
  const [nextReminder, setNextReminder] = useState(null);
  const [savingRecord, setSavingRecord] = useState(false);
  // Bumped after a save or delete so everything below reloads
  const [dataVersion, setDataVersion] = useState(0);
  // Which car (and version) the records on screen belong to; anything else means they're still loading
  const [recordsLoadedFor, setRecordsLoadedFor] = useState(null);
  const recordsLoading = Boolean(selectedVehicleId) && recordsLoadedFor !== `${selectedVehicleId}-${dataVersion}`;

  // Load the selected car's records, this year's summary and its next reminder
  useEffect(() => {
    if (!selectedVehicleId) return;

    authFetch(`/api/vehicles/${selectedVehicleId}/maintenance`)
      .then((data) => setRecords(data.records.map(toPageRecord)))
      .catch((err) => console.error("Could not load maintenance records:", err.message))
      .finally(() => setRecordsLoadedFor(`${selectedVehicleId}-${dataVersion}`));

    authFetch(`/api/vehicles/${selectedVehicleId}/maintenance/summary?period=year`)
      .then((data) => setYearSummary(data))
      .catch((err) => console.error("Could not load maintenance summary:", err.message));

    // Open reminders come back soonest first
    authFetch(`/api/vehicles/${selectedVehicleId}/reminders`)
      .then((data) => setNextReminder(data.reminders.find((r) => !r.is_done) || null))
      .catch((err) => console.error("Could not load reminders:", err.message));
  }, [selectedVehicleId, dataVersion]);

  // The costs chart, for the period picked in its dropdown
  useEffect(() => {
    if (!selectedVehicleId) return;

    authFetch(`/api/vehicles/${selectedVehicleId}/maintenance/summary?period=${costPeriod}`)
      .then((data) => setCostSummary(data))
      .catch((err) => console.error("Could not load maintenance costs:", err.message));
  }, [selectedVehicleId, costPeriod, dataVersion]);

  // After a save or delete: reload the records and numbers, and the car itself, because logging a higher
  // mileage raises the car's current mileage on the server
  const refreshAfterChange = () => {
    setDataVersion((version) => version + 1);
    authFetch(`/api/vehicles/${selectedVehicleId}`)
      .then((data) => setVehicles((prev) => prev.map((v) => (v.id === data.vehicle.id ? data.vehicle : v))))
      .catch(() => {});
  };

  // Next Maintenance card: how soon the next reminder is due
  const describeDue = (reminder) => {
    if (!reminder) return null;
    const mileage = selectedVehicle?.current_mileage;
    if (reminder.due_mileage != null && mileage != null) {
      const left = reminder.due_mileage - mileage;
      return left <= 0 ? <strong>Overdue</strong> : <>Due in <strong>{left.toLocaleString()} miles</strong></>;
    }
    if (reminder.due_date) {
      const days = Math.round((new Date(`${reminder.due_date}T00:00:00`) - new Date()) / 86400000);
      return days < 0 ? <strong>Overdue</strong> : <>Due on <strong>{formatDate(reminder.due_date)}</strong></>;
    }
    return <>Due at <strong>{Number(reminder.due_mileage).toLocaleString()} miles</strong></>;
  };

  const emptyRecord = {
  service: "",
  date: "",
  mileage: "",
  cost: "",
  location: "",
};

const [newRecord, setNewRecord] = useState(emptyRecord);
const [editingRecordId, setEditingRecordId] = useState(null);

  const handleChange = (e) => {
    setNewRecord({
      ...newRecord,
      [e.target.name]: e.target.value,
    });
  };

  const addRecord = (e) => {
  e.preventDefault();

  const recordData = {
    ...newRecord,
    service: newRecord.service.trim(),
    location: newRecord.location.trim(),
    mileage: Number(newRecord.mileage),
    cost: Number(newRecord.cost),
  };

  if (
    !recordData.service ||
    !recordData.date ||
    !recordData.location ||
    newRecord.mileage === "" ||
    newRecord.cost === "" ||
    !Number.isFinite(recordData.mileage) ||
    !Number.isFinite(recordData.cost) ||
    recordData.mileage < 0 ||
    recordData.cost < 0
  ) {
    alert("Please complete all fields with valid information.");
    return;
  }

  if (!selectedVehicleId) {
    alert("Add a vehicle first, then you can log its maintenance.");
    return;
  }

  saveRecord(recordData);
};

// Saves a new record (POST) or changes to an existing one (PATCH), then goes back to the records list
const saveRecord = async (recordData) => {
  setSavingRecord(true);
  try {
    if (editingRecordId !== null) {
      await authFetch(`/api/maintenance/${editingRecordId}`, { method: "PATCH", body: toApiRecord(recordData) });
    } else {
      await authFetch(`/api/vehicles/${selectedVehicleId}/maintenance`, { method: "POST", body: toApiRecord(recordData) });
    }
    refreshAfterChange();

    setNewRecord({ ...emptyRecord });
    setEditingRecordId(null);
    setActiveTab("records");
  } catch (err) {
    alert(`Could not save the record: ${err.message === "Failed to fetch" ? "can't reach the server" : err.message}`);
  } finally {
    setSavingRecord(false);
  }
};

const editRecord = (record) => {
  setNewRecord({
    service: record.service,
    date: record.date,
    mileage: String(record.mileage),
    cost: String(record.cost),
    location: record.location || "",
  });

  setEditingRecordId(record.id);
  setActiveTab("add");
};

const deleteRecord = async (id) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this maintenance record?"
  );

  if (!confirmed) return;

  try {
    await authFetch(`/api/maintenance/${id}`, { method: "DELETE" });
    refreshAfterChange();
  } catch (err) {
    alert(`Could not delete the record: ${err.message}`);
  }
};

const cancelRecord = () => {
  setNewRecord({ ...emptyRecord });
  setEditingRecordId(null);
  setActiveTab("records");
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

      {activeTab === "overview" && (
      <>
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
            {/* The selected car's photo; the stock picture is only shown when no car has been added */}
            <VehiclePhoto
              vehicle={selectedVehicle}
              width={800}
              height={360}
              fallback={selectedVehicle ? undefined : "https://images.unsplash.com/photo-1493238792000-8113da705763"}
            />
            {selectedVehicle && (
              <ChangePhotoButton
                vehicle={selectedVehicle}
                onUpdated={(updated) =>
                  setVehicles((prev) => prev.map((v) => (v.id === updated.id ? updated : v)))
                }
              />
            )}
          </div>

          {/* Vehicle Information */}
          <div className="vehicle-overview-info">

            <div className="vehicle-overview-heading">
              <h2>{vehicleName || "2022 Dodge Charger"}</h2>             
              <span className="vehicle-status">Active</span>
            </div>

            <p className="vehicle-trim">SRT Hellcat Widebody</p>

            <div className="vehicle-overview-details">

              <div>
                <span>Current Mileage</span>
                <strong>
                  {selectedVehicle
                    ? selectedVehicle.current_mileage != null
                      ? `${Number(selectedVehicle.current_mileage).toLocaleString()} mi`
                      : "Not set"
                    : "42,500 mi"}
                </strong>
              </div>

              <div>
                <span>Last Service</span>
                <strong>
                  {yearSummary?.last_service ? formatDate(yearSummary.last_service.service_date) : "None yet"}
                </strong>
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

            {nextReminder ? (
              <>
                <h3>{nextReminder.service_type}</h3>

                <p className="maintenance-due">
                  {describeDue(nextReminder)}
                </p>

                {/* Mileage progress: how close the odometer is to the due mileage */}
                {nextReminder.due_mileage != null && selectedVehicle?.current_mileage != null && (
                  <>
                    <div className="maintenance-progress">
                      <div
                        className="maintenance-progress-fill"
                        style={{ width: `${Math.min(100, Math.round((selectedVehicle.current_mileage / nextReminder.due_mileage) * 100))}%` }}
                      ></div>
                    </div>

                    <div className="maintenance-mileage">
                      <span>{Number(selectedVehicle.current_mileage).toLocaleString()} mi</span>
                      <span>{Number(nextReminder.due_mileage).toLocaleString()} mi</span>
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <h3>Nothing scheduled</h3>
                <p className="maintenance-due">No upcoming services for this vehicle.</p>
              </>
            )}

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
            <h3>{yearSummary?.total_records ?? 0}</h3>
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
            <h3>{formatMoney(yearSummary?.total_spent)}</h3>
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
            <h3>{yearSummary?.upcoming_services ?? 0}</h3>
            <p>Upcoming Services</p>
          </div>

          <span className="stat-arrow">›</span>

        </div>

        {/* CARD 4: VEHICLE HEALTH */}
        <div className="maintenance-stat-card">

          {/* Vehicle health: flags overdue services from the car's reminders */}
          <div className={`stat-icon ${yearSummary?.overdue_services > 0 ? "stat-icon-blue" : "stat-icon-green"}`}>
            {yearSummary?.overdue_services > 0 ? "⚠" : "✓"}
          </div>

          <div className="stat-info">
            <h3>{yearSummary?.overdue_services > 0 ? "Needs Attention" : "All Good"}</h3>
            <p>
              {yearSummary?.overdue_services > 0
                ? `${yearSummary.overdue_services} overdue service${yearSummary.overdue_services === 1 ? "" : "s"}`
                : "No overdue services"}
            </p>
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

        {records.length === 0 && (
          <tr>
            <td colSpan={6} className="records-empty">
              {recordsLoading
                ? "Loading records..."
                : selectedVehicleId
                  ? "No maintenance records yet. Use Add Record to log a service."
                  : "Add a vehicle to start tracking maintenance."}
            </td>
          </tr>
        )}

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

      <select value={costPeriod} onChange={(e) => setCostPeriod(e.target.value)}>
        <option value="year">This Year</option>
        <option value="month">This Month</option>
        <option value="all">All Time</option>
      </select>
    </div>

    <div className="costs-content">

      {/* DONUT CHART (slices sized by how much was spent in each category) */}
      <div className="costs-donut" style={{ background: donutBackground(costSummary?.cost_by_category) }}>

        <div className="costs-donut-center">
          <strong>{formatMoney(costSummary?.total_spent)}</strong>
          <span>Total</span>
        </div>

      </div>

      {/* COST BREAKDOWN (only categories with spending in this period) */}
      <div className="costs-legend">

        {(costSummary?.cost_by_category || []).filter((c) => c.total > 0).map((c) => (
          <div className="costs-legend-item" key={c.category}>
            <span className={`legend-dot ${CATEGORY_STYLE[c.category]?.dot || "other"}`}></span>
            <span className="legend-name">{c.category}</span>
            <strong>{formatMoney(c.total)}</strong>
            <span className="legend-percent">{c.percent}%</span>
          </div>
        ))}

        {!(costSummary?.total_spent > 0) && (
          <p className="costs-empty">No maintenance costs in this period.</p>
        )}

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

  </>
)}

{/* ===================================
    ADD / EDIT MAINTENANCE RECORD
=================================== */}

{activeTab === "add" && (
  <div className="add-record-page">

    <div className="add-record-header">
      <h2>
        {editingRecordId !== null
          ? "Edit Maintenance Record"
          : "Add Maintenance Record"}
      </h2>

      <p>
        Enter your vehicle's maintenance information below.
      </p>
    </div>

    <div className="add-record-card">

      <form onSubmit={addRecord} className="add-record-form">

        <div className="add-record-field">
          <label htmlFor="record-service">Service Performed</label>
          <input
            id="record-service"
            type="text"
            name="service"
            placeholder="e.g., Oil Change"
            value={newRecord.service}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-record-field">
          <label htmlFor="record-date">Service Date</label>
          <input
            id="record-date"
            type="date"
            name="date"
            value={newRecord.date}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-record-field">
          <label htmlFor="record-mileage">Vehicle Mileage</label>
          <input
            id="record-mileage"
            type="number"
            name="mileage"
            placeholder="e.g., 43000"
            min="0"
            step="1"
            value={newRecord.mileage}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-record-field">
          <label htmlFor="record-cost">Total Cost ($)</label>
          <input
            id="record-cost"
            type="number"
            name="cost"
            placeholder="e.g., 89.99"
            min="0"
            step="0.01"
            value={newRecord.cost}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-record-field add-record-full">
          <label htmlFor="record-location">Service Location</label>
          <input
            id="record-location"
            type="text"
            name="location"
            placeholder="e.g., Valvoline"
            value={newRecord.location}
            onChange={handleChange}
            required
          />
        </div>

        <div className="add-record-actions">

          <button
            type="button"
            className="record-cancel-button"
            onClick={cancelRecord}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="record-save-button"
            disabled={savingRecord}
          >
            {savingRecord
              ? "Saving..."
              : editingRecordId !== null
                ? "Save Changes"
                : "+ Save Record"}
          </button>

        </div>

      </form>

    </div>

  </div>
)}

{/* ===================================
    MAINTENANCE RECORDS TAB
=================================== */}

{activeTab === "records" && (
  <div className="records-page">

    <div className="records-page-header">
      <div>
        <h2>Maintenance History</h2>
        <p>
          View and manage your vehicle's maintenance
          history, repairs, and expenses.
        </p>
      </div>

      <button
        type="button"
        className="records-add-button"
        onClick={() => setActiveTab("add")}
      >
        + Add Record
      </button>
    </div>

    <div className="records-summary">
      <div className="records-summary-card">
        <span>📋 Total Records</span>
        <h3>{records.length}</h3>
        <p>Maintenance services recorded</p>
      </div>

      <div className="records-summary-card">
        <span>💰 Total Spent</span>
        <h3>
          ${records.reduce(
            (total, record) => total + Number(record.cost || 0),
            0
          ).toFixed(2)}
        </h3>
        <p>All recorded maintenance expenses</p>
      </div>

      <div className="records-summary-card">
        <span>🔧 Last Service</span>
        <h3>
          {records.length > 0
            ? new Date(
                `${[...records].sort(
                  (a, b) => new Date(b.date) - new Date(a.date)
                )[0].date}T00:00:00`
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "N/A"}
        </h3>
        <p>Most recent maintenance</p>
      </div>
    </div>

    <div className="records-table-container">
  <table className="records-table">

    <thead>
      <tr>
        <th>Service</th>
        <th>Date</th>
        <th>Mileage</th>
        <th>Cost</th>
        <th>Location</th>
        <th>Actions</th>
      </tr>
    </thead>

    <tbody>
      {records.map((record) => (
        <tr key={record.id}>

          <td>
            {record.icon || "🔧"} {record.service}
          </td>

          <td>{formatDate(record.date)}</td>

          <td>
            {Number(record.mileage).toLocaleString()} mi
          </td>

          <td>
            ${Number(record.cost).toFixed(2)}
          </td>

          <td>
            {record.location || "Not specified"}
          </td>

          <td>
            <div className="record-action-buttons">

              <button
                type="button"
                className="record-edit-button"
                onClick={() => editRecord(record)}
              >
                ✏️ Edit
              </button>

              <button
                type="button"
                className="record-delete-button"
                onClick={() => deleteRecord(record.id)}
              >
                🗑️ Delete
              </button>

            </div>
          </td>

        </tr>
      ))}

      {records.length === 0 && (
        <tr>
          <td colSpan={6} className="records-empty">
            {recordsLoading ? "Loading records..." : "No maintenance records yet."}
          </td>
        </tr>
      )}

    </tbody>

  </table>
</div>
    </div>

  
)}

    </div>
  );
}

export default Maintenance;