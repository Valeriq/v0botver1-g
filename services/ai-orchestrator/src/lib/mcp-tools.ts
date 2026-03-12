import { Pool } from "pg"
import axios from "axios"

const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: Number.parseInt(process.env.PG_PORT || "5432"),
})

// MCP Tool: Database Read
export async function dbReadTool(query: string, params: any[] = []) {
  try {
    const result = await pool.query(query, params)
    return result.rows
  } catch (error: any) {
    console.error("[mcp-tools] dbRead error:", error.message)
    throw error
  }
}

// MCP Tool: Policy Check (compliance)
export async function policyCheckTool(content: string) {
  // Check for spam words, compliance issues
  const spamWords = [
    "100% free",
    "act now",
    "buy now",
    "click here",
    "congratulations",
    "dear friend",
    "free money",
    "guarantee",
    "limited time",
    "no obligation",
    "winner",
  ]

  const lowerContent = content.toLowerCase()
  const violations = spamWords.filter((word) => lowerContent.includes(word))

  return {
    passed: violations.length === 0,
    violations,
    score: violations.length === 0 ? 1.0 : Math.max(0, 1 - violations.length * 0.1),
  }
}

// MCP Tool: Artifact Storage
export async function saveArtifactTool(workspaceId: string, type: string, content: any, metadata: any = {}) {
  const artifactId = require("crypto").randomUUID()

  await pool.query(
    `INSERT INTO ai_artifacts (id, workspace_id, type, content, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [artifactId, workspaceId, type, JSON.stringify(content), JSON.stringify(metadata)],
  )

  return artifactId
}

// MCP Tool: Perplexity Research
export async function perplexitySearchTool(query: string) {
  if (!process.env.PERPLEXITY_API_KEY) {
    console.warn("[mcp-tools] Perplexity API key not set, skipping research")
    return { results: [], note: "Perplexity API not configured" }
  }

  try {
    const response = await axios.post(
      "https://api.perplexity.ai/chat/completions",
      {
        model: "llama-3.1-sonar-small-128k-online",
        messages: [{ role: "user", content: query }],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    return {
      results: response.data.choices[0].message.content,
      citations: response.data.citations || [],
    }
  } catch (error: any) {
    console.error("[mcp-tools] Perplexity error:", error.message)
    throw error
  }
}

// Define MCP tools for OpenAI function calling
export const mcpToolsDefinition = [
  {
    type: "function",
    function: {
      name: "db_read",
      description: "Read data from the database to personalize emails",
      parameters: {
        type: "object",
        properties: {
          table: {
            type: "string",
            description: "Table name to query",
          },
          columns: {
            type: "array",
            items: { type: "string" },
            description: "Columns to select",
          },
          where_clause: {
            type: "string",
            description: "WHERE clause for the query",
          },
        },
        required: ["table"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "policy_check",
      description: "Check if email content complies with anti-spam policies",
      parameters: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "Email content to check",
          },
        },
        required: ["content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "perplexity_search",
      description: "Search for information about a company or person using Perplexity",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query",
          },
        },
        required: ["query"],
      },
    },
  },
]

export async function executeMcpTool(toolName: string, args: any) {
  switch (toolName) {
    case "db_read": {
      const { table, columns, where_clause } = args
      const cols = columns ? columns.join(", ") : "*"
      const query = `SELECT ${cols} FROM ${table}${where_clause ? ` WHERE ${where_clause}` : ""}`
      return await dbReadTool(query) }

    case "policy_check":
      return await policyCheckTool(args.content)

    case "perplexity_search":
      return await perplexitySearchTool(args.query)

    default:
      throw new Error(`Unknown tool: ${toolName}`)
  }
}

export class MCPTools {
  constructor(private pool: Pool) {}

  async readDatabase(table: string, filters: Record<string, any> = {}) {
    const whereClause = Object.keys(filters)
      .map((key, idx) => `${key} = $${idx + 1}`)
      .join(" AND ")
    const query = `SELECT * FROM ${table}${whereClause ? ` WHERE ${whereClause}` : ""}`
    const values = Object.values(filters)

    const result = await this.pool.query(query, values)
    return result.rows
  }

  async checkPolicy(content: string, workspaceId: string) {
    const spamWords = [
      "100% free",
      "act now",
      "buy now",
      "click here",
      "congratulations",
      "dear friend",
      "free money",
      "guarantee",
      "limited time",
      "no obligation",
      "winner",
    ]

    const lowerContent = content.toLowerCase()
    const violations = spamWords.filter((word) => lowerContent.includes(word))

    return {
      compliant: violations.length === 0,
      violations,
      score: violations.length === 0 ? 1.0 : Math.max(0, 1 - violations.length * 0.1),
    }
  }

  async saveArtifact(workspaceId: string, type: string, content: any, metadata: any = {}) {
    const artifactId = require("crypto").randomUUID()

    await this.pool.query(
      `INSERT INTO ai_artifacts (id, workspace_id, type, content, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [artifactId, workspaceId, type, JSON.stringify(content), JSON.stringify(metadata)],
    )

    return artifactId
  }
}
