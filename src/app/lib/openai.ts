import type { ConfirmedImprovementItem, PlanItemDraft, SessionType } from "./flueetApi";
import type { SessionTranscriptEntry } from "./sessionStore";

const CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

interface ChatMessage {
  role: "system" | "user";
  content: string;
}

interface CoachMemoryUpdateResult {
  memory_md: string;
  recurring_errors: Array<{ error: string; weight: number; last_seen?: string }>;
  confirmed_improvements: ConfirmedImprovementItem[];
  next_focus: string;
}

export interface FeedbackInsights {
  resumo: string;
  fluencia: number;
  pronuncia: number;
  vocabulario: number;
  gramatica: number;
  clareza: number;
  pontos_fortes: string[];
  pontos_de_atencao: string[];
  proximo_passo: string;
}

async function runChatCompletion(apiKey: string, messages: ChatMessage[], temperature = 0.3): Promise<string> {
  const response = await fetch(CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Falha na chamada OpenAI (${response.status}): ${text || "sem detalhes"}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("A OpenAI não retornou conteúdo.");
  }

  return content;
}

function extractJsonArray(text: string): string {
  const first = text.indexOf("[");
  const last = text.lastIndexOf("]");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("Não foi possível localizar um array JSON válido na resposta.");
  }
  return text.slice(first, last + 1);
}

function extractJsonObject(text: string): string {
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first === -1 || last === -1 || last < first) {
    throw new Error("Não foi possível localizar um objeto JSON válido na resposta.");
  }
  return text.slice(first, last + 1);
}

function normalizePlanItems(planItems: unknown): PlanItemDraft[] {
  if (!Array.isArray(planItems)) {
    throw new Error("Plano de correção inválido: a resposta não é um array.");
  }

  const normalized = planItems
    .filter((item) => typeof item === "object" && item !== null)
    .map((item) => {
      const raw = item as Record<string, unknown>;
      const sessionType = raw.session_type;
      const safeSessionType: PlanItemDraft["session_type"] =
        sessionType === "pronunciation_drill" ||
        sessionType === "vocabulary" ||
        sessionType === "free_conversation"
          ? sessionType
          : "free_conversation";

      return {
        order_index: Number(raw.order_index ?? 0),
        title: String(raw.title ?? "Sessão de correção"),
        focus: String(raw.focus ?? "Corrigir pontos críticos detectados no diagnóstico."),
        session_type: safeSessionType,
        duration_minutes: Math.max(5, Number(raw.duration_minutes ?? 8)),
        unlocked: Boolean(raw.unlocked),
      };
    })
    .filter((item) => item.order_index > 0)
    .sort((a, b) => a.order_index - b.order_index);

  if (normalized.length < 1) {
    throw new Error("Plano de correção vazio após normalização.");
  }

  return normalized;
}

function createFeedbackPrompt(input: {
  sessionType: SessionType;
  durationSeconds: number;
  transcript: SessionTranscriptEntry[];
}): string {
  const transcriptText = input.transcript
    .map((entry) => `[${entry.role}] ${entry.text}`)
    .join("\n")
    .slice(0, 8000);

  return [
    "Você é um language coach especializado em feedback de sessão oral.",
    "Gere APENAS markdown em português com as seções abaixo.",
    "",
    "Seções obrigatórias:",
    "## Erros observados",
    "- fonema ou construção",
    "- exemplo de ocorrência",
    "- frequência",
    "",
    "## Melhorias detectadas",
    "- melhorias em relação ao esperado para o nível",
    "",
    "## Nota do coach",
    "- observação qualitativa sobre comportamento do usuário",
    "",
    "Contexto da sessão:",
    `- session_type: ${input.sessionType}`,
    `- duration_seconds: ${input.durationSeconds}`,
    "- transcrição:",
    transcriptText || "(sem transcrição disponível)",
  ].join("\n");
}

export async function generateSessionFeedback(
  apiKey: string,
  input: {
    sessionType: SessionType;
    durationSeconds: number;
    transcript: SessionTranscriptEntry[];
  },
): Promise<string> {
  return runChatCompletion(
    apiKey,
    [
      {
        role: "system",
        content:
          "You are a strict language coach. Return markdown only, no code fences and no extra preamble.",
      },
      {
        role: "user",
        content: createFeedbackPrompt(input),
      },
    ],
    0.3,
  );
}

export async function generateFeedbackInsightsJson(
  apiKey: string,
  input: {
    sessionType: SessionType;
    durationSeconds: number;
    transcript: SessionTranscriptEntry[];
    feedbackRaw: string;
  },
): Promise<FeedbackInsights> {
  const transcriptText = input.transcript
    .map((entry) => `[${entry.role}] ${entry.text}`)
    .join("\n")
    .slice(0, 6000);

  const prompt = [
    "Analise o feedback de sessão de idioma e gere APENAS um JSON válido com os campos fixos abaixo.",
    "Escala das notas: 0 a 100.",
    "Use linguagem clara para usuário final.",
    "",
    "Formato obrigatório:",
    "{",
    '  "resumo": "texto curto de 2-4 frases",',
    '  "fluencia": 0,',
    '  "pronuncia": 0,',
    '  "vocabulario": 0,',
    '  "gramatica": 0,',
    '  "clareza": 0,',
    '  "pontos_fortes": ["...", "..."],',
    '  "pontos_de_atencao": ["...", "..."],',
    '  "proximo_passo": "ação objetiva para próxima sessão"',
    "}",
    "",
    "Contexto da sessão:",
    `- session_type: ${input.sessionType}`,
    `- duration_seconds: ${input.durationSeconds}`,
    "",
    "Transcrição (recortada):",
    transcriptText || "(sem transcrição)",
    "",
    "Feedback bruto:",
    input.feedbackRaw,
  ].join("\n");

  const raw = await runChatCompletion(
    apiKey,
    [
      {
        role: "system",
        content: "Return only a valid JSON object with the requested keys and no markdown.",
      },
      { role: "user", content: prompt },
    ],
    0.2,
  );

  const parsed = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;
  const clampScore = (value: unknown, fallback = 50) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    return Math.max(0, Math.min(100, Math.round(numeric)));
  };

  return {
    resumo: String(parsed.resumo ?? "Seu desempenho mostrou evolução consistente nesta sessão."),
    fluencia: clampScore(parsed.fluencia, 60),
    pronuncia: clampScore(parsed.pronuncia, 60),
    vocabulario: clampScore(parsed.vocabulario, 60),
    gramatica: clampScore(parsed.gramatica, 60),
    clareza: clampScore(parsed.clareza, 60),
    pontos_fortes: Array.isArray(parsed.pontos_fortes)
      ? parsed.pontos_fortes.map((item) => String(item)).filter(Boolean).slice(0, 4)
      : [],
    pontos_de_atencao: Array.isArray(parsed.pontos_de_atencao)
      ? parsed.pontos_de_atencao.map((item) => String(item)).filter(Boolean).slice(0, 4)
      : [],
    proximo_passo: String(parsed.proximo_passo ?? "Continue praticando com foco em naturalidade e clareza."),
  };
}

export async function generateCorrectionPlanFromDiagnostic(
  apiKey: string,
  feedbackRaw: string,
): Promise<PlanItemDraft[]> {
  const userPrompt = [
    "Você é um coach de idiomas. Com base no feedback abaixo de uma sessão de diagnóstico,",
    "crie um plano de correção com 6 a 8 sessões progressivas.",
    "",
    "Cada sessão deve atacar um problema específico detectado.",
    "Ordene do mais crítico para o mais avançado.",
    "Varie os tipos de sessão - não repita o mesmo tipo consecutivamente.",
    "A primeira sessão deve ter unlocked: true. As demais false.",
    "",
    "Retorne APENAS um array JSON válido com este formato, sem texto adicional:",
    "[",
    "  {",
    "    \"order_index\": 1,",
    "    \"title\": \"Título curto e direto\",",
    "    \"focus\": \"Explicação do problema que esta sessão corrige\",",
    "    \"session_type\": \"pronunciation_drill\" | \"vocabulary\" | \"free_conversation\",",
    "    \"duration_minutes\": 8,",
    "    \"unlocked\": true",
    "  }",
    "]",
    "",
    "Feedback da sessão de diagnóstico:",
    feedbackRaw,
  ].join("\n");

  const raw = await runChatCompletion(
    apiKey,
    [
      {
        role: "system",
        content:
          "Return only a valid JSON array. No markdown, no explanation, no surrounding text.",
      },
      { role: "user", content: userPrompt },
    ],
    0.2,
  );

  const parsed = JSON.parse(extractJsonArray(raw)) as unknown;
  return normalizePlanItems(parsed);
}

export async function generateInitialCoachMemoryMarkdown(
  apiKey: string,
  input: {
    targetLanguage: string;
    currentLevel: string;
    dateLabel: string;
    nextFocus: string;
    feedbackRaw: string;
  },
): Promise<string> {
  const prompt = [
    "Com base neste feedback de sessão de diagnóstico, gere o arquivo coach_memory.md",
    "no formato abaixo. Retorne APENAS o markdown, sem texto adicional.",
    "",
    `# Coach memory · ${input.targetLanguage}`,
    `updated: ${input.dateLabel}  |  sessions_total: 1  |  level: ${input.currentLevel}`,
    "",
    "## Recurring errors (weighted)",
    "- {erro} [weight: 0.80] - {descrição curta}",
    "",
    "## Confirmed improvements",
    "(nenhum ainda)",
    "",
    "## Next focus",
    input.nextFocus,
    "",
    "## Personality note",
    "{observação sobre o comportamento do usuário na sessão}",
    "",
    "Feedback:",
    input.feedbackRaw,
  ].join("\n");

  return runChatCompletion(
    apiKey,
    [
      {
        role: "system",
        content:
          "Return markdown only. Do not wrap in code fences and do not add any heading outside the requested structure.",
      },
      { role: "user", content: prompt },
    ],
    0.3,
  );
}

export async function updateCoachMemoryWithFeedback(
  apiKey: string,
  input: {
    currentMemoryMd: string;
    feedbackRaw: string;
  },
): Promise<CoachMemoryUpdateResult> {
  const prompt = [
    "Atualize a memória do coach aplicando estas regras:",
    "- weight +0.25 para erros que reapareceram",
    "- weight -0.15 para os que não apareceram",
    "- remova os abaixo de 0.1",
    "- atualize next_focus e confirmed_improvements",
    "",
    "Retorne APENAS JSON válido no formato:",
    "{",
    "  \"memory_md\": \"...markdown atualizado...\",",
    "  \"recurring_errors\": [{ \"error\": \"...\", \"weight\": 0.8 }],",
    "  \"confirmed_improvements\": [{ \"improvement\": \"...\", \"evidence\": \"...\" }],",
    "  \"next_focus\": \"...\"",
    "}",
    "",
    "Memória atual:",
    input.currentMemoryMd,
    "",
    "Novo feedback:",
    input.feedbackRaw,
  ].join("\n");

  const raw = await runChatCompletion(
    apiKey,
    [
      {
        role: "system",
        content: "Return only valid JSON object with the requested keys.",
      },
      { role: "user", content: prompt },
    ],
    0.2,
  );

  const parsed = JSON.parse(extractJsonObject(raw)) as Record<string, unknown>;

  const normalizedConfirmedImprovements: ConfirmedImprovementItem[] = Array.isArray(
    parsed.confirmed_improvements,
  )
    ? parsed.confirmed_improvements
        .map((item) => {
          if (item && typeof item === "object") {
            const rawItem = item as Record<string, unknown>;
            const improvement = String(
              rawItem.improvement ?? rawItem.text ?? rawItem.title ?? "",
            ).trim();
            if (!improvement) {
              return null;
            }

            return {
              ...rawItem,
              improvement,
            } as ConfirmedImprovementItem;
          }

          if (typeof item === "string" && item.trim()) {
            return { improvement: item.trim() } as ConfirmedImprovementItem;
          }

          return null;
        })
        .filter((item): item is ConfirmedImprovementItem => Boolean(item))
    : [];

  return {
    memory_md: String(parsed.memory_md ?? ""),
    recurring_errors: Array.isArray(parsed.recurring_errors)
      ? (parsed.recurring_errors as Array<{ error: string; weight: number; last_seen?: string }>)
      : [],
    confirmed_improvements: normalizedConfirmedImprovements,
    next_focus: String(parsed.next_focus ?? ""),
  };
}

export function extractRecurringErrorsFromMemoryMarkdown(markdown: string): Array<{ error: string; weight: number }> {
  const lines = markdown.split("\n").map((line) => line.trim());
  const result: Array<{ error: string; weight: number }> = [];

  for (const line of lines) {
    const match = line.match(/^-\s*(.+?)\s*\[weight:\s*([0-9.]+)\]/i);
    if (!match) {
      continue;
    }

    result.push({
      error: match[1].trim(),
      weight: Number(match[2]),
    });
  }

  return result;
}
