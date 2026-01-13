import { google } from "googleapis"

export interface GmailAccount {
  id: string
  email: string
  access_token: string
  refresh_token: string
}

export class GmailClient {
  private oauth2Client: any
  private gmail: any

  constructor(credentials: { refresh_token: string; client_id?: string; client_secret?: string }) {
    this.oauth2Client = new google.auth.OAuth2(
      credentials.client_id || process.env.GOOGLE_CLIENT_ID,
      credentials.client_secret || process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    )

    this.oauth2Client.setCredentials({
      refresh_token: credentials.refresh_token,
    })

    this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client })
  }

  async sendEmail(params: {
    to: string
    from: string
    subject: string
    body: string
    inReplyTo?: string
    references?: string
  }) {
    const messageParts = [
      `To: ${params.to}`,
      `From: ${params.from}`,
      `Subject: ${params.subject}`,
      "Content-Type: text/html; charset=utf-8",
    ]

    if (params.inReplyTo) {
      messageParts.push(`In-Reply-To: ${params.inReplyTo}`)
    }

    if (params.references) {
      messageParts.push(`References: ${params.references}`)
    }

    messageParts.push("", params.body)

    const message = messageParts.join("\n")
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "")

    try {
      const response = await this.gmail.users.messages.send({
        userId: "me",
        requestBody: {
          raw: encodedMessage,
        },
      })

      return {
        message_id: response.data.id!,
        thread_id: response.data.threadId!,
      }
    } catch (error: any) {
      if (error.code === 429 || error.message?.includes("Rate Limit")) {
        throw new Error("RATE_LIMIT")
      } else if (error.code === 401) {
        throw new Error("AUTH_FAILED")
      }
      throw error
    }
  }

  async setupWatch(topicName: string) {
    const response = await this.gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName,
        labelIds: ["INBOX"],
      },
    })

    return {
      history_id: response.data.historyId!,
      expiration: response.data.expiration!,
    }
  }
}

export function getGmailClient(account: GmailAccount) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  )

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  })

  return google.gmail({ version: "v1", auth: oauth2Client })
}

export async function sendEmail(account: GmailAccount, to: string, subject: string, body: string, threadId?: string) {
  const gmail = getGmailClient(account)

  const messageParts = [`To: ${to}`, `Subject: ${subject}`, "Content-Type: text/html; charset=utf-8", "", body]

  const message = messageParts.join("\n")
  const encodedMessage = Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "")

  try {
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        threadId: threadId || undefined,
      },
    })

    return {
      message_id: response.data.id!,
      thread_id: response.data.threadId!,
    }
  } catch (error: any) {
    console.error("[gmail-client] Send error:", error.message)

    if (error.code === 429 || error.message?.includes("Rate Limit") || error.message?.includes("quotaExceeded")) {
      throw new Error("RATE_LIMIT")
    } else if (error.code === 401 || error.message?.includes("invalid_grant")) {
      throw new Error("AUTH_FAILED")
    } else if (error.code === 403) {
      throw new Error("PERMISSION_DENIED")
    } else if (error.code === 400 && error.message?.includes("recipient")) {
      throw new Error("INVALID_RECIPIENT")
    } else if (error.code === 503 || error.message?.includes("backendError")) {
      throw new Error("GMAIL_SERVICE_UNAVAILABLE")
    }

    throw error
  }
}

export async function setupWatch(account: GmailAccount, topicName: string) {
  const gmail = getGmailClient(account)

  try {
    const response = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName,
        labelIds: ["INBOX"],
      },
    })

    return {
      history_id: response.data.historyId!,
      expiration: response.data.expiration!,
    }
  } catch (error: any) {
    console.error("[gmail-client] Watch setup error:", error.message)
    throw error
  }
}

export async function getHistory(account: GmailAccount, startHistoryId: string) {
  const gmail = getGmailClient(account)

  try {
    const response = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
      historyTypes: ["messageAdded"],
    })

    return response.data.history || []
  } catch (error: any) {
    console.error("[gmail-client] Get history error:", error.message)
    throw error
  }
}

export async function getMessage(account: GmailAccount, messageId: string) {
  const gmail = getGmailClient(account)

  try {
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    })

    return response.data
  } catch (error: any) {
    console.error("[gmail-client] Get message error:", error.message)
    throw error
  }
}

export function parseMessage(message: any) {
  const headers = message.payload.headers
  const getHeader = (name: string) => headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value

  const from = getHeader("From")
  const to = getHeader("To")
  const subject = getHeader("Subject")
  const date = getHeader("Date")

  let body = ""
  if (message.payload.body?.data) {
    body = Buffer.from(message.payload.body.data, "base64").toString()
  } else if (message.payload.parts) {
    const textPart = message.payload.parts.find((p: any) => p.mimeType === "text/plain" || p.mimeType === "text/html")
    if (textPart?.body?.data) {
      body = Buffer.from(textPart.body.data, "base64").toString()
    }
  }

  return {
    message_id: message.id,
    thread_id: message.threadId,
    from,
    to,
    subject,
    date,
    body,
  }
}
