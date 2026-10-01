const model = 'openai/gpt-oss-20b'

type ChatTurn = { role: 'user' | 'assistant'; content: string }

function isChatTurn(value: unknown): value is ChatTurn {
  if (typeof value !== 'object' || value === null) return false
  const turn = value as Record<string, unknown>
  return (turn.role === 'user' || turn.role === 'assistant') &&
    typeof turn.content === 'string' &&
    turn.content.trim().length > 0 &&
    turn.content.length <= 8000
}

export async function POST(request: Request) {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return Response.json({ error: 'La clave de Groq no está configurada en el servidor.' }, { status: 500 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'La solicitud debe contener JSON válido.' }, { status: 400 })
  }

  const turns =
    typeof body === 'object' && body !== null && 'messages' in body && Array.isArray(body.messages)
      ? body.messages
      : null

  if (!turns?.length || !turns.every(isChatTurn)) {
    return Response.json({ error: 'El historial debe incluir mensajes válidos de usuario y asistente.' }, { status: 400 })
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: turns.map((turn) => ({ role: turn.role, content: turn.content.trim() })),
      }),
    })

    const result = await response.json().catch(() => null) as {
      choices?: Array<{ message?: { content?: unknown } }>
      usage?: {
        prompt_tokens?: unknown
        completion_tokens?: unknown
        total_tokens?: unknown
      }
    } | null

    if (!response.ok) {
      return Response.json({ error: `Groq rechazó la solicitud (HTTP ${response.status}).` }, { status: 502 })
    }

    const reply = result?.choices?.[0]?.message?.content
    if (typeof reply !== 'string' || !reply.trim()) {
      return Response.json({ error: 'Groq devolvió una respuesta vacía.' }, { status: 502 })
    }

    const usage = result?.usage
    return Response.json({
      reply: reply.trim(),
      usage: {
        promptTokens: typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : null,
        completionTokens: typeof usage?.completion_tokens === 'number' ? usage.completion_tokens : null,
        totalTokens: typeof usage?.total_tokens === 'number' ? usage.total_tokens : null,
      },
    })
  } catch {
    return Response.json({ error: 'No se pudo conectar con Groq.' }, { status: 502 })
  }
}