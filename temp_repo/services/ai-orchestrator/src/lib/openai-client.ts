import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateCompletion(systemPrompt: string, userPrompt: string, tools?: any[]) {
  try {
    const messages: any[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]

    const params: any = {
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }

    if (tools && tools.length > 0) {
      params.tools = tools
      params.tool_choice = "auto"
    }

    const completion = await openai.chat.completions.create(params)

    return {
      content: completion.choices[0].message.content,
      tool_calls: completion.choices[0].message.tool_calls,
      usage: completion.usage,
    }
  } catch (error: any) {
    console.error("[openai-client] Error:", error.message)
    throw error
  }
}

export async function classifyText(text: string, categories: string[]) {
  const systemPrompt = `You are an expert at classifying email replies. Analyze the email and determine which category it belongs to.`

  const userPrompt = `Classify this email reply into one of these categories: ${categories.join(", ")}\n\nEmail:\n${text}\n\nRespond with just the category name.`

  const response = await generateCompletion(systemPrompt, userPrompt)

  return response.content?.trim().toLowerCase() || "other"
}
