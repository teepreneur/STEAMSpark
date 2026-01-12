import { grok, GROK_MODEL } from "@/lib/grok";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { topic, difficulty } = await req.json();

        const systemPrompt = `You are an expert STEAM educator. Create a short quiz (3 questions) to assess understanding of "${topic}" at a "${difficulty}" level.
    Return the response as a valid JSON object with:
    {
      "title": "Quiz Title",
      "questions": [
        {
          "question": "The question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correct_answer": "Option A"
        }
      ]
    }`;

        const completion = await grok.chat.completions.create({
            model: GROK_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Create a quiz for ${topic}` },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;

        let data;
        try {
            data = JSON.parse(content || "{}");
        } catch (e) {
            data = { error: "Failed to parse AI response", raw: content };
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("AI Assessment Error:", error);
        return NextResponse.json(
            { error: "Failed to generate assessment" },
            { status: 500 }
        );
    }
}
