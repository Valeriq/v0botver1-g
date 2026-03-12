import { Router } from "express"
import { pool } from "../db"
import { generateCompletion } from "../lib/openai-client"
import { getAllMcpTools, executeMcpTool, policyCheckTool, saveArtifactTool } from "../lib/mcp-tools"

export const generateRouter = Router()

generateRouter.post("/email", async (req, res, next) => {
  try {
    const { workspace_id, contact_id, prompt_profile_id, context } = req.body

    if (!workspace_id || !contact_id) {
      return res.status(400).json({ error: "workspace_id and contact_id are required" })
    }

    // Get contact data
    const contactResult = await pool.query(`SELECT * FROM contacts WHERE id = $1 AND workspace_id = $2`, [
      contact_id,
      workspace_id,
    ])

    if (contactResult.rows.length === 0) {
      return res.status(404).json({ error: "Contact not found" })
    }

    const contact = contactResult.rows[0]

    // Get prompt profile
    let systemPrompt = "You are an expert email writer. Write professional, personalized cold emails."
    let config: any = {}

    if (prompt_profile_id) {
      const profileResult = await pool.query(`SELECT * FROM prompt_profiles WHERE id = $1 AND workspace_id = $2`, [
        prompt_profile_id,
        workspace_id,
      ])

      if (profileResult.rows.length > 0) {
        systemPrompt = profileResult.rows[0].system_prompt || systemPrompt
        config = profileResult.rows[0].config || {}
      }
    }

    // Build user prompt with contact data
    const userPrompt = `Generate a cold email for this contact:

Name: ${contact.first_name} ${contact.last_name}
Email: ${contact.email}
Company: ${contact.company || "Unknown"}
Website: ${contact.website || "Unknown"}

${context ? `Additional context: ${context}` : ""}

Generate both subject line and email body. Keep it professional, concise, and personalized.`

    console.log("[generate] Generating email draft...")

    // Get all tools including Docker ones
    const allTools = await getAllMcpTools()

    // Step 1: Generate draft
    const draftResponse = await generateCompletion(systemPrompt, userPrompt, allTools)

    let emailContent = draftResponse.content || ""

    // Handle tool calls if any
    if (draftResponse.tool_calls && draftResponse.tool_calls.length > 0) {
      console.log(`[generate] Executing ${draftResponse.tool_calls.length} tool calls...`)

      for (const toolCall of draftResponse.tool_calls) {
        const toolName = toolCall.function.name
        const toolArgs = JSON.parse(toolCall.function.arguments)

        console.log(`[generate] Calling tool: ${toolName}`)
        const toolResult = await executeMcpTool(toolName, toolArgs)

        // Re-generate with tool results (simplified for MVP)
        emailContent += `\n\n[Tool result from ${toolName}: ${JSON.stringify(toolResult).substring(0, 100)}...]`
      }
    }

    // Step 2: Compliance check
    console.log("[generate] Running compliance check...")
    const complianceCheck = await policyCheckTool(emailContent)

    if (!complianceCheck.passed) {
      console.warn("[generate] Compliance violations found:", complianceCheck.violations)
      // For MVP, log warning but continue
    }

    // Step 3: Parse subject and body
    const lines = emailContent.split("\n")
    let subject = "Quick question"
    let body = emailContent

    // Try to extract subject line
    for (const line of lines) {
      if (line.toLowerCase().includes("subject:")) {
        subject = line.replace(/subject:/i, "").trim()
        body = lines.slice(lines.indexOf(line) + 1).join("\n")
        break
      }
    }

    // Step 4: Save artifact
    const artifactId = await saveArtifactTool(
      workspace_id,
      "email_draft",
      { subject, body },
      {
        contact_id,
        prompt_profile_id,
        compliance_score: complianceCheck.score,
        usage: draftResponse.usage,
      },
    )

    console.log("[generate] Email generated successfully:", artifactId)

    res.json({
      success: true,
      artifact_id: artifactId,
      subject,
      body,
      compliance: complianceCheck,
      usage: draftResponse.usage,
    })
  } catch (error) {
    next(error)
  }
})
