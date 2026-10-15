const express = require('express');
// Import the official Google Gen AI SDK
const { GoogleGenAI } = require('@google/genai');
const pool = require('../db');
const { HttpError, isBlank, orNull, requireFields, buildUpdate, checkId, getOwnedVehicle } = require('../helpers');

const router = express.Router();
router.param('id', checkId);

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// gemini-2.5-flash is no longer offered to new API keys. Set GEMINI_MODEL in .env to use a different model
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// How many past messages are sent to Gemini with each new question
const HISTORY_LIMIT = 40;

const getOwnedConversation = async (userId, conversationId) => {
  const result = await pool.query('SELECT * FROM ai_conversations WHERE id = $1 AND user_id = $2', [conversationId, userId]);
  if (result.rows.length === 0) throw new HttpError(404, 'Conversation not found.');
  return result.rows[0];
};

const createConversation = async (userId, { vehicle_id, title }) => {
  // You can only attach one of your own vehicles
  if (!isBlank(vehicle_id)) await getOwnedVehicle(userId, vehicle_id);

  const result = await pool.query(
    'INSERT INTO ai_conversations (user_id, vehicle_id, title) VALUES ($1, $2, $3) RETURNING *',
    [userId, orNull(vehicle_id), orNull(title)]
  );
  return result.rows[0];
};

// Builds the vehicle specs + service history text given to Gemini.
// Uses the conversation's vehicle if it has one, otherwise all of the user's vehicles
const buildVehicleContext = async (userId, vehicleId) => {
  const vehicles = await pool.query(
    `SELECT id, make, model, year, current_mileage FROM vehicles
     WHERE user_id = $1 AND ($2::bigint IS NULL OR id = $2) ORDER BY id`,
    [userId, vehicleId]
  );
  if (vehicles.rows.length === 0) return 'Unknown Vehicle Profile (No car specs provided yet).';

  const records = await pool.query(
    `SELECT vehicle_id, service_date, service_type, mileage, notes FROM maintenance_records
     WHERE vehicle_id = ANY($1) ORDER BY service_date DESC`,
    [vehicles.rows.map((car) => car.id)]
  );

  return vehicles.rows.map((car) => {
    const logs = records.rows
      .filter((log) => log.vehicle_id === car.id)
      .map((log) => `- Date: ${log.service_date}, Service: ${log.service_type}, Mileage: ${log.mileage ?? 'N/A'}, Notes: ${log.notes || 'None'}`);

    return [
      `Vehicle: ${car.year} ${car.make} ${car.model}`,
      `Current Mileage: ${car.current_mileage ?? 'Unknown'} miles`,
      'Service History:',
      logs.length > 0 ? logs.join('\n') : 'No prior service history recorded.',
    ].join('\n');
  }).join('\n\n');
};

// Sends the user's message (plus the conversation so far) to Gemini, then saves both sides of the exchange
const sendMessage = async (userId, conversation, content) => {
  const vehicleContext = await buildVehicleContext(userId, conversation.vehicle_id);

  const history = await pool.query(
    `SELECT role, content FROM (
       SELECT id, role, content FROM ai_messages WHERE conversation_id = $1 ORDER BY id DESC LIMIT $2
     ) recent ORDER BY id`,
    [conversation.id, HISTORY_LIMIT]
  );

  const systemInstruction = `
    You are an expert AI automotive diagnostic assistant.
    Analyze the user's car symptoms explicitly against their provided vehicle specs and service logs.
    Evaluate if recent services could relate to the current issue, or if deferred maintenance might be the cause.
    Provide realistic troubleshooting paths and remind them if safety components (brakes, steering) need physical inspection.

    [VEHICLE SPECIFICATIONS AND SERVICE HISTORY]
    ${vehicleContext}
  `;

  let reply;
  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        // Gemini calls the assistant's side of the chat "model"
        ...history.rows.map((msg) => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] })),
        { role: 'user', parts: [{ text: content }] },
      ],
      config: { systemInstruction },
    });
    reply = response.text;
  } catch (err) {
    console.error('❌ Chatbot Error:', err.message);
    throw new HttpError(502, 'Failed to process AI diagnostics.');
  }
  if (!reply) throw new HttpError(502, 'The AI assistant returned an empty reply.');

  // Saved only after Gemini answers, so a failed request never leaves a question without a reply
  const saved = await pool.query(
    `INSERT INTO ai_messages (conversation_id, role, content)
     VALUES ($1, 'user', $2), ($1, 'assistant', $3) RETURNING *`,
    [conversation.id, content, reply]
  );

  // Name an untitled conversation after its first question, and move it to the top of the list
  const updated = await pool.query(
    'UPDATE ai_conversations SET title = COALESCE(title, $2), updated_at = now() WHERE id = $1 RETURNING *',
    [conversation.id, String(content).slice(0, 60)]
  );

  return { conversation: updated.rows[0], messages: saved.rows, reply };
};

// List the user's conversations, most recently used first
router.get('/conversations', async (req, res) => {
  const result = await pool.query('SELECT * FROM ai_conversations WHERE user_id = $1 ORDER BY updated_at DESC, id DESC', [req.user.id]);
  res.json({ success: true, conversations: result.rows });
});

// Start an empty conversation. Optionally { vehicle_id, title }
router.post('/conversations', async (req, res) => {
  res.status(201).json({ success: true, conversation: await createConversation(req.user.id, req.body) });
});

// Get a conversation with all of its messages
router.get('/conversations/:id', async (req, res) => {
  const conversation = await getOwnedConversation(req.user.id, req.params.id);
  const messages = await pool.query('SELECT * FROM ai_messages WHERE conversation_id = $1 ORDER BY id', [conversation.id]);
  res.json({ success: true, conversation, messages: messages.rows });
});

// Rename a conversation or change which vehicle it is about
router.patch('/conversations/:id', async (req, res) => {
  const { sets, values } = buildUpdate(req.body, ['title', 'vehicle_id']);
  if (!isBlank(req.body.vehicle_id)) await getOwnedVehicle(req.user.id, req.body.vehicle_id);

  const result = await pool.query(
    `UPDATE ai_conversations SET ${sets} WHERE id = $${values.length + 1} AND user_id = $${values.length + 2} RETURNING *`,
    [...values, req.params.id, req.user.id]
  );
  if (result.rows.length === 0) throw new HttpError(404, 'Conversation not found.');
  res.json({ success: true, conversation: result.rows[0] });
});

// Delete a conversation (the database also deletes its messages)
router.delete('/conversations/:id', async (req, res) => {
  const result = await pool.query('DELETE FROM ai_conversations WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user.id]);
  if (result.rows.length === 0) throw new HttpError(404, 'Conversation not found.');
  res.json({ success: true, message: 'Conversation deleted.' });
});

// Ask a question in an existing conversation. Expects { content }
router.post('/conversations/:id/messages', async (req, res) => {
  requireFields(req.body, ['content']);
  const conversation = await getOwnedConversation(req.user.id, req.params.id);

  const result = await sendMessage(req.user.id, conversation, req.body.content);
  res.status(201).json({ success: true, ...result });
});

/**
 * AI DIAGNOSTIC CHATBOT SHORTCUT
 * Expects { message } and optionally { conversation_id, vehicle_id }.
 * Without a conversation_id it starts a new conversation, so one call is enough to ask a first question
 */
router.post('/chat', async (req, res) => {
  const { message, conversation_id, vehicle_id } = req.body;
  if (isBlank(message)) throw new HttpError(400, 'Missing message.');

  let conversation;
  let isNew = false;
  if (!isBlank(conversation_id)) {
    if (!/^\d{1,15}$/.test(String(conversation_id))) throw new HttpError(404, 'Conversation not found.');
    conversation = await getOwnedConversation(req.user.id, conversation_id);
  } else {
    conversation = await createConversation(req.user.id, { vehicle_id });
    isNew = true;
  }

  try {
    const result = await sendMessage(req.user.id, conversation, message);
    res.json({ success: true, ...result });
  } catch (err) {
    // Don't leave an empty conversation behind if the very first question failed
    if (isNew) await pool.query('DELETE FROM ai_conversations WHERE id = $1', [conversation.id]);
    throw err;
  }
});

module.exports = router;
