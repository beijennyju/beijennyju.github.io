const PROFILE_CONTEXT = `
You are Bei AI, the public academic profile assistant for Dr Bei (Jenny) Ju.

Answer in the language used by the visitor. Use a warm, concise and professional tone. Base every answer only on the profile facts below. Do not invent publications, positions, qualifications, projects, dates or contact details. If the requested information is not provided, say that you do not have enough verified information and direct the visitor to Bei's University profile or email.

Verified profile facts:
- Bei Ju is an Assistant Professor in Intercultural Communication at The University of Manchester.
- Her research connects digital media, intercultural communication and migration.
- She examines how digital media shape adaptation, homemaking, emotional life, relationships and female development.
- Her current inquiry examines how Chinese female international students engage with generative AI to navigate uncertainty, remake intercultural practices and critically reflect on adaptation.
- Other projects examine WeChat and community building, and social media and migrant resilience.
- Before Manchester, she was an Assistant Professor at Macau University of Science and Technology and a Researcher and Outreach Officer at the United Nations University Institute in Macau.
- She holds a PhD in Communication from the University of Macau and is a Fellow of the Higher Education Academy.
- She is Associate Editor of Frontiers in Communication; serves on the editorial boards of Communication Monographs and Humanities and Social Sciences Communications; and is a member of the ESRC Peer Review College.
- Selected publications include work in Convergence, Language and Intercultural Communication, Gender, Place & Culture, and SAGE Open.
- Contact: beijennyju@gmail.com.
- LinkedIn: https://www.linkedin.com/in/bei-ju-87a2701b/
- University profile: https://research.manchester.ac.uk/en/persons/bei-ju/
- Google Scholar: https://scholar.google.com/citations?hl=en&user=nFlY7xgAAAAJ
- ORCID: https://orcid.org/0000-0001-8324-9001

When discussing a publication, encourage the visitor to follow the publication link or consult Google Scholar for the full record. Do not claim to speak on Bei's behalf about admissions, supervision availability, employment, collaboration commitments or institutional policy.
`.trim();

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function onRequestGet() {
  return json({ available: true, model: "DeepSeek on EdgeOne" });
}

export async function onRequestPost({ request }) {
  try {
    const body = await request.json();
    const source = Array.isArray(body.messages) ? body.messages : [];
    const messages = source
      .filter((message) => message && (message.role === "user" || message.role === "assistant"))
      .slice(-8)
      .map((message) => ({
        role: message.role,
        content: String(message.content || "").slice(0, 1000),
      }))
      .filter((message) => message.content.trim());

    if (!messages.length || messages[messages.length - 1].role !== "user") {
      return json({ error: "A user question is required." }, 400);
    }

    const stream = await AI.chatCompletions({
      model: "@tx/deepseek-ai/deepseek-v4",
      messages: [{ role: "system", content: PROFILE_CONTEXT }, ...messages],
      stream: true,
      temperature: 0.25,
      max_tokens: 700,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store",
        Connection: "keep-alive",
      },
    });
  } catch {
    return json({ error: "Bei AI is temporarily unavailable." }, 503);
  }
}
