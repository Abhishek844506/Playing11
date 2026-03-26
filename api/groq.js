export default async function handler(req, res) {
  // ===== CORS =====
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    })
  }

  try {
    // ===== SAFE BODY PARSE =====
    let body = {}

    try {
      body = typeof req.body === "string"
        ? JSON.parse(req.body)
        : (req.body || {})
    } catch (e) {
      console.error("Body parse error:", req.body)
      return res.status(400).json({
        success: false,
        error: "Invalid request body"
      })
    }

    const { question, context } = body

    // ===== VALIDATION =====
    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'Question is required'
      })
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Missing GROQ API key'
      })
    }

    // ===== CALL GROQ =====
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: 'llama-3.1-8b-instant',
          messages: [
            {
              role: 'system',
              content:
                'You are DRS AI — a fantasy cricket assistant. Give short answers with player names. Max 5 lines. Use emojis.'
            },
            {
              role: 'user',
              content: `${context || ''}\n\n${question}`
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      }
    )

    // ===== SAFE RESPONSE PARSE =====
    const text = await response.text()

    let data = {}
    try {
      data = text ? JSON.parse(text) : {}
    } catch (err) {
      console.error("Groq invalid JSON:", text)
      return res.status(500).json({
        success: false,
        error: 'Invalid AI response'
      })
    }

    // ===== HANDLE GROQ ERROR =====
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || 'Groq API error'
      })
    }

    // ===== FINAL ANSWER =====
    const answer =
      data?.choices?.[0]?.message?.content?.trim() ||
      '⚠️ No response from AI'

    return res.status(200).json({
      success: true,
      answer
    })

  } catch (error) {
    console.error("SERVER ERROR:", error)

    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}