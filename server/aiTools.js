const pool = require('./db');

// Lookups the AI assistant can run while it works on a diagnosis.
// Every query is limited to the logged-in user's own data (userId always comes from their verified token,
// never from the model), and all of them are read-only. The model can only pick a tool and fill in its
// arguments; it never writes SQL itself.

const MAX_ROWS = 25;
const SNIPPET_LENGTH = 400;

const snippet = (text) => (text && text.length > SNIPPET_LENGTH ? `${text.slice(0, SNIPPET_LENGTH)}...` : text);

// Turns a keyword into an ILIKE pattern, escaping % and _ so they are matched literally
const likePattern = (keyword) => `%${String(keyword).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

const toId = (value) => (/^\d{1,15}$/.test(String(value ?? '')) ? Number(value) : null);

const toLimit = (value) => Math.min(Math.max(parseInt(value, 10) || MAX_ROWS, 1), MAX_ROWS);

// ---------- Tool implementations ----------

const listMyVehicles = async (userId) => {
  const result = await pool.query(
    `SELECT v.id, v.year, v.make, v.model, v.current_mileage,
            (SELECT COUNT(*) FROM maintenance_records m WHERE m.vehicle_id = v.id) AS record_count,
            (SELECT MAX(service_date) FROM maintenance_records m WHERE m.vehicle_id = v.id) AS last_service_date
     FROM vehicles v WHERE v.user_id = $1 ORDER BY v.id`,
    [userId]
  );
  return { vehicles: result.rows };
};

const getMaintenanceRecords = async (userId, { vehicle_id, keyword, limit }) => {
  const vehicleId = toId(vehicle_id);
  if (!vehicleId) return { error: 'vehicle_id is required. Call list_my_vehicles to find it.' };

  const result = await pool.query(
    `SELECT m.service_date, m.service_type, m.mileage, m.cost, m.notes
     FROM maintenance_records m JOIN vehicles v ON v.id = m.vehicle_id
     WHERE v.id = $1 AND v.user_id = $2
       AND ($3::text IS NULL OR m.service_type ILIKE $3 OR m.notes ILIKE $3)
     ORDER BY m.service_date DESC, m.id DESC LIMIT $4`,
    [vehicleId, userId, keyword ? likePattern(keyword) : null, toLimit(limit)]
  );
  return { records: result.rows, note: result.rows.length === 0 ? 'No matching records on file.' : undefined };
};

const getReminders = async (userId, { vehicle_id, include_done }) => {
  const result = await pool.query(
    `SELECT r.service_type, r.due_date, r.due_mileage, r.is_done,
            v.id AS vehicle_id, v.year, v.make, v.model, v.current_mileage,
            ((r.due_date IS NOT NULL AND r.due_date < CURRENT_DATE)
              OR (r.due_mileage IS NOT NULL AND v.current_mileage >= r.due_mileage)) AND NOT r.is_done AS overdue
     FROM reminders r JOIN vehicles v ON v.id = r.vehicle_id
     WHERE v.user_id = $1 AND ($2::bigint IS NULL OR v.id = $2) AND ($3 OR NOT r.is_done)
     ORDER BY r.is_done, r.due_date NULLS LAST, r.due_mileage NULLS LAST LIMIT $4`,
    [userId, toId(vehicle_id), include_done === true, MAX_ROWS]
  );
  return { reminders: result.rows };
};

// Earlier chatbot conversations by this user (not the current one), with the last answer they got
const searchPastDiagnoses = async (userId, { keyword, vehicle_id }, { conversationId }) => {
  const result = await pool.query(
    `SELECT c.id, c.title, c.updated_at, v.year, v.make, v.model,
            (SELECT content FROM ai_messages m WHERE m.conversation_id = c.id AND m.role = 'assistant'
             ORDER BY m.id DESC LIMIT 1) AS last_answer
     FROM ai_conversations c LEFT JOIN vehicles v ON v.id = c.vehicle_id
     WHERE c.user_id = $1 AND c.id <> $2
       AND ($3::bigint IS NULL OR c.vehicle_id = $3)
       AND ($4::text IS NULL OR c.title ILIKE $4
            OR EXISTS (SELECT 1 FROM ai_messages m WHERE m.conversation_id = c.id AND m.content ILIKE $4))
     ORDER BY c.updated_at DESC LIMIT 10`,
    [userId, conversationId, toId(vehicle_id), keyword ? likePattern(keyword) : null]
  );
  return {
    conversations: result.rows.map((row) => ({ ...row, last_answer: snippet(row.last_answer) })),
  };
};

// Community posts from any user. These are already visible to every logged-in user in the feed.
// Author names are left out because the assistant doesn't need them
const searchCommunityPosts = async (userId, { make, model, keyword }) => {
  if (!make && !model && !keyword) return { error: 'Give at least one of make, model or keyword.' };

  const result = await pool.query(
    `SELECT p.id, p.title, p.body, p.created_at, v.year, v.make, v.model,
            (SELECT COUNT(*) FROM post_likes l WHERE l.post_id = p.id) AS like_count,
            (SELECT json_agg(c.body ORDER BY c.id) FROM (
               SELECT id, body FROM comments WHERE post_id = p.id ORDER BY id LIMIT 5
             ) c) AS first_comments
     FROM posts p LEFT JOIN vehicles v ON v.id = p.vehicle_id
     WHERE ($1::text IS NULL OR v.make ILIKE $1)
       AND ($2::text IS NULL OR v.model ILIKE $2)
       AND ($3::text IS NULL OR p.title ILIKE $3 OR p.body ILIKE $3)
     ORDER BY p.created_at DESC LIMIT 10`,
    [make ? likePattern(make) : null, model ? likePattern(model) : null, keyword ? likePattern(keyword) : null]
  );
  return {
    posts: result.rows.map((row) => ({
      ...row,
      body: snippet(row.body),
      first_comments: (row.first_comments || []).map(snippet),
    })),
    note: result.rows.length === 0 ? 'No matching community posts.' : 'Posts are anecdotal reports from other owners.',
  };
};

// ---------- What the model is told about each tool ----------

const TOOLS = {
  list_my_vehicles: {
    run: listMyVehicles,
    declaration: {
      description: "List the user's vehicles with their ids, mileage, number of service records and last service date.",
      parametersJsonSchema: { type: 'object', properties: {} },
    },
  },
  get_maintenance_records: {
    run: getMaintenanceRecords,
    declaration: {
      description: "Look up a vehicle's logged maintenance records, newest first. Use keyword to find specific work, e.g. 'brake', 'spark', 'coolant', 'transmission'.",
      parametersJsonSchema: {
        type: 'object',
        properties: {
          vehicle_id: { type: 'integer', description: 'Id of one of the user\'s vehicles' },
          keyword: { type: 'string', description: 'Optional word to match in the service type or notes' },
          limit: { type: 'integer', description: `Max records to return (up to ${MAX_ROWS})` },
        },
        required: ['vehicle_id'],
      },
    },
  },
  get_reminders: {
    run: getReminders,
    declaration: {
      description: 'Look up upcoming and overdue maintenance reminders. Overdue items are likely contributors to problems.',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          vehicle_id: { type: 'integer', description: 'Optional: only this vehicle' },
          include_done: { type: 'boolean', description: 'Also include reminders already marked done' },
        },
      },
    },
  },
  search_past_diagnoses: {
    run: searchPastDiagnoses,
    declaration: {
      description: "Search this user's earlier conversations with you, to see if a symptom came up before and what was suggested then.",
      parametersJsonSchema: {
        type: 'object',
        properties: {
          keyword: { type: 'string', description: "Symptom or part to search for, e.g. 'shudder', 'squeal'" },
          vehicle_id: { type: 'integer', description: 'Optional: only conversations about this vehicle' },
        },
      },
    },
  },
  search_community_posts: {
    run: searchCommunityPosts,
    declaration: {
      description: 'Search DriveCare community posts for reports from other owners, e.g. the same make/model with a similar symptom.',
      parametersJsonSchema: {
        type: 'object',
        properties: {
          make: { type: 'string', description: "Vehicle make, e.g. 'Ford'" },
          model: { type: 'string', description: "Vehicle model, e.g. 'Focus'" },
          keyword: { type: 'string', description: 'Symptom or part to search for in post titles and text' },
        },
      },
    },
  },
};

const TOOL_DECLARATIONS = Object.entries(TOOLS).map(([name, tool]) => ({ name, ...tool.declaration }));

// Runs one tool call from the model. Errors are returned to the model as data instead of failing the chat
const runTool = async (userId, call, context) => {
  const tool = TOOLS[call.name];
  if (!tool) return { error: `Unknown tool ${call.name}` };

  try {
    return await tool.run(userId, call.args || {}, context);
  } catch (err) {
    console.error(`❌ AI tool ${call.name} failed:`, err.message);
    return { error: 'The lookup failed. Continue without it.' };
  }
};

module.exports = { TOOL_DECLARATIONS, runTool };
