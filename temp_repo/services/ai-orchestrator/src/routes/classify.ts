import { Router } from "express"
import { classifyText } from "../lib/openai-client"
import { pool } from "../db"

export const classifyRouter = Router()

classifyRouter.post("/reply", async (req, res, next) => {
  try {
    const { reply_event_id, message_body } = req.body

    if (!reply_event_id || !message_body) {
      return res.status(400).json({ error: "reply_event_id and message_body are required" })
    }

    console.log(`[classify] Classifying reply event ${reply_event_id}`)

    // Classify with AI
    const categories = ["positive", "negative", "question", "auto_reply", "bounce", "other"]
    const classification = await classifyText(message_body, categories)

    console.log(`[classify] Result: ${classification}`)

    // Update reply event
    await pool.query(`UPDATE reply_events SET classification = $1 WHERE id = $2`, [classification, reply_event_id])

    // Determine if it's a lead
    const isLead = ["positive", "question"].includes(classification)

    res.json({
      success: true,
      classification,
      is_lead: isLead,
    })
  } catch (error) {
    next(error)
  }
})

// Batch classify
classifyRouter.post("/batch", async (req, res, next) => {
  try {
    const { messages } = req.body

    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: "messages array is required" })
    }

    const results = []

    for (const msg of messages) {
      const categories = ["positive", "negative", "question", "auto_reply", "bounce", "other"]
      const classification = await classifyText(msg.body, categories)
      const isLead = ["positive", "question"].includes(classification)

      results.push({
        id: msg.id,
        classification,
        is_lead: isLead,
      })
    }

    res.json({ success: true, results })
  } catch (error) {
    next(error)
  }
})
