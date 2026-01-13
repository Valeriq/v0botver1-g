import { Router } from "express"
import axios from "axios"
import { pool } from "../db"

export const perplexityRouter = Router()

const PERPLEXITY_API_URL = "https://api.perplexity.ai/chat/completions"
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY

perplexityRouter.post("/search-contacts", async (req, res) => {
  const { workspace_id, query } = req.body

  if (!workspace_id || !query) {
    return res.status(400).json({ error: "workspace_id and query required" })
  }

  if (!PERPLEXITY_API_KEY) {
    return res.status(503).json({ error: "Perplexity API key not configured" })
  }

  try {
    const systemPrompt = `You are an expert at finding business contacts and extracting structured data.
Your task is to find contacts based on the user's query and return them in a specific JSON format.

Output format (JSON array only, no extra text):
[
  {
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "company": "Example Corp",
    "website": "https://example.com"
  }
]

Rules:
- Only return valid email addresses
- Include as much information as you can find
- Verify that emails look legitimate (no obvious fake/test addresses)
- Return maximum 50 contacts
- If you can't find any contacts, return an empty array []`

    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: "llama-3.1-sonar-large-128k-online",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: query },
        ],
        temperature: 0.2,
        max_tokens: 4000,
      },
      {
        headers: {
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    const aiResponse = response.data.choices[0].message.content

    let contacts: any[] = []
    try {
      // Try to extract JSON array from response
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        contacts = JSON.parse(jsonMatch[0])
      }
    } catch (parseError) {
      console.error("[perplexity] JSON parse error:", parseError)
      return res.status(500).json({ error: "Failed to parse AI response", raw: aiResponse })
    }

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return res.json({ imported: 0, message: "No contacts found" })
    }

    let imported = 0
    const client = await pool.connect()

    try {
      for (const contact of contacts) {
        if (!contact.email) continue

        await client.query(
          `INSERT INTO contacts (workspace_id, email, first_name, last_name, company, website, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           ON CONFLICT (workspace_id, email) DO NOTHING`,
          [
            workspace_id,
            contact.email.toLowerCase(),
            contact.first_name || null,
            contact.last_name || null,
            contact.company || null,
            contact.website || null,
          ],
        )
        imported++
      }
    } finally {
      client.release()
    }

    res.json({
      imported,
      total_found: contacts.length,
      message: `Successfully imported ${imported} contacts`,
    })
  } catch (error: any) {
    console.error("[perplexity] Error:", error.response?.data || error.message)
    res.status(500).json({ error: "Failed to search contacts" })
  }
})
