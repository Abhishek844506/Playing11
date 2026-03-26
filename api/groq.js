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
    // ===== INPUT VALIDATION =====
    const { question, context } = req.body || {}

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

    // ===== CALL GROQ API =====
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
                'You are DRS AI — a fantasy cricket assistant for Playing11 app. Give very short specific answers with player names. Max 5 lines. Use emojis. Be direct.'
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

    // ===== SAFE RESPONSE PARSING =====
    const text = await response.text()
    console.log("RAW GROQ RESPONSE:", text)

    let data = {}
    try {
      data = text ? JSON.parse(text) : {}
    } catch (err) {
      console.error("JSON Parse Error:", text)
      return res.status(500).json({
        success: false,
        error: 'Invalid response from AI server'
      })
    }

    // ===== HANDLE API ERROR =====
    if (!response.ok) {
      console.error("Groq API Error:", data)
      return res.status(response.status).json({
        success: false,
        error: data?.error?.message || 'Groq API error'
      })
    }

    // ===== EXTRACT ANSWER =====
    const answer =
      data?.choices?.[0]?.message?.content?.trim() ||
      '⚠️ No response from AI'

    // ===== SUCCESS RESPONSE =====
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