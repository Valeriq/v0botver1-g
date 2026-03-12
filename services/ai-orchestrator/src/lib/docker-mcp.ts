import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { CallToolResultSchema, ListToolsResultSchema } from "@modelcontextprotocol/sdk/types.js"

export class DockerMCPClient {
  private client: Client | null = null
  private transport: StdioClientTransport | null = null
  private connectionPromise: Promise<void> | null = null

  async connect() {
    if (this.connectionPromise) return this.connectionPromise

    this.connectionPromise = (async () => {
      console.log("[DockerMCP] Connecting to Docker MCP server...")

      // Check if transport already exists and close it
      if (this.transport) {
        await this.disconnect()
      }

      this.transport = new StdioClientTransport({
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-docker"],
      })

      this.client = new Client(
        {
          name: "ai-orchestrator-client",
          version: "1.0.0",
        },
        {
          capabilities: {},
        },
      )

      try {
        await this.client.connect(this.transport)
        console.log("[DockerMCP] Connected successfully")
      } catch (error) {
        this.connectionPromise = null
        console.error("[DockerMCP] Connection failed:", error)
        throw error
      }
    })()

    return this.connectionPromise
  }

  async listTools() {
    if (!this.client) throw new Error("Client not connected")
    const response = await this.client.request({ method: "tools/list" }, ListToolsResultSchema)
    return response.tools
  }

  async callTool(name: string, args: any) {
    if (!this.client) throw new Error("Client not connected")
    const response = await this.client.request(
      {
        method: "tools/call",
        params: {
          name,
          arguments: args,
        },
      },
      CallToolResultSchema,
    )
    return response
  }

  async disconnect() {
    if (this.transport) {
      await this.transport.close()
    }
    this.client = null
    this.transport = null
  }
}

export const dockerMcpClient = new DockerMCPClient()
