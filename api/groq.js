export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { question, context } = req.body

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
              content: 'You are DRS AI — a fantasy cricket assistant for Playing11 app. Give very short specific answers with player names. Max 5 lines. Use emojis. Be direct.'
            },
            {
              role: 'user',
              content: context + '\n\n' + question
            }
          ],
          max_tokens: 200,
          temperature: 0.7
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message || 'Groq API error')
    }

    const answer = data.choices?.[0]?.message?.content || 'No response!'
    return res.status(200).json({ answer })

  } catch(e) {
    return res.status(500).json({ error: e.message })
  }
}