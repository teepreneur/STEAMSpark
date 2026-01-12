import { grok, GROK_MODEL } from "@/lib/grok";
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const {
            childName,
            childAge,
            grade,
            careerGoal,
            interests,
            currentLevel = "beginner"
        } = await req.json();

        // Fetch available courses (gigs) from database
        const supabase = await createClient();
        const { data: gigs } = await supabase
            .from('gigs')
            .select(`
                id,
                title,
                description,
                subject,
                price,
                duration,
                total_sessions,
                profiles:teacher_id (full_name)
            `)
            .eq('status', 'active')
            .limit(50);

        // Format gigs for AI context
        const availableCourses = gigs?.map(gig => ({
            id: gig.id,
            title: gig.title,
            description: gig.description?.substring(0, 150) || "",
            subject: gig.subject,
            price: gig.price,
            sessions: gig.total_sessions || 1,
            teacher: (gig.profiles as any)?.full_name || "Teacher"
        })) || [];

        const coursesContext = availableCourses.length > 0
            ? `\n\nAVAILABLE COURSES ON PLATFORM:\n${availableCourses.map((c, i) =>
                `${i + 1}. "${c.title}" by ${c.teacher} - ${c.subject} (${c.sessions} sessions, GHS ${c.price}/session)\n   ${c.description}`
            ).join('\n')}`
            : "";

        const systemPrompt = `You are an expert STEAM educator specializing in creating personalized learning roadmaps for children in Ghana and West Africa.

Your task is to create a comprehensive, age-appropriate learning path for a child with the following profile:
- Name: ${childName}
- Age: ${childAge} years old
- Grade: ${grade}
- Career Interest: ${careerGoal}
- Interests: ${interests?.join(", ") || "General STEAM"}
- Current Level: ${currentLevel}
${coursesContext}

Create a structured learning roadmap that:
1. Is achievable within 6-12 months
2. Has 4-6 progressive milestones
3. Includes hands-on projects relevant to their goal
4. Considers resources available in Ghana/Africa
5. Connects to real-world applications
${availableCourses.length > 0 ? "6. IMPORTANT: For each module, check if any of the AVAILABLE COURSES above can help the child learn that module. Match relevant courses to modules." : ""}

Return a valid JSON object with this EXACT structure:
{
  "title": "Personalized title for this roadmap",
  "description": "Brief inspiring description (1-2 sentences)",
  "subject": "Primary subject area (e.g., robotics, coding, science, engineering, art)",
  "estimatedDuration": "Total estimated time (e.g., '6 months')",
  "modules": [
    {
      "id": 1,
      "title": "Module title",
      "description": "What they will learn in this module",
      "skills": ["skill1", "skill2"],
      "project": "Hands-on project description",
      "estimatedWeeks": 4,
      "status": "locked",
      "prerequisites": [],
      "recommendedCourses": [
        {
          "courseTitle": "Exact title of matching course from available courses",
          "teacher": "Teacher name",
          "reason": "Brief explanation of how this course helps with this module"
        }
      ]
    }
  ],
  "recommendedResources": [
    {
      "type": "video|book|website|kit",
      "title": "Resource name",
      "description": "Why this is helpful"
    }
  ],
  "nextStep": "First actionable step to begin learning"
}

IMPORTANT: 
- The first module should have status "in_progress", rest should be "locked"
- Make it exciting and achievable for a ${childAge}-year-old
- Include local context where possible (e.g., solar projects for Africa, agricultural tech)
- For recommendedCourses, ONLY include courses from the AVAILABLE COURSES list that genuinely match the module topic
- If no courses match a module, leave recommendedCourses as an empty array []`;

        const completion = await grok.chat.completions.create({
            model: GROK_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                {
                    role: "user",
                    content: `Create a personalized STEAM learning roadmap for ${childName} who wants to become a ${careerGoal}. Make it engaging and achievable! Match any relevant available courses to the learning modules.`
                },
            ],
            response_format: { type: "json_object" },
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content;

        let data;
        try {
            data = JSON.parse(content || "{}");
            // Ensure first module is in_progress
            if (data.modules && data.modules.length > 0) {
                data.modules[0].status = "in_progress";
            }

            // Add course IDs to recommended courses for linking
            if (data.modules && availableCourses.length > 0) {
                data.modules = data.modules.map((module: any) => {
                    if (module.recommendedCourses && module.recommendedCourses.length > 0) {
                        module.recommendedCourses = module.recommendedCourses.map((rec: any) => {
                            const matchingCourse = availableCourses.find(c =>
                                c.title.toLowerCase().includes(rec.courseTitle?.toLowerCase()?.substring(0, 20)) ||
                                rec.courseTitle?.toLowerCase().includes(c.title.toLowerCase().substring(0, 20))
                            );
                            return {
                                ...rec,
                                courseId: matchingCourse?.id || null,
                                price: matchingCourse?.price || null
                            };
                        });
                    }
                    return module;
                });
            }
        } catch (e) {
            console.error("JSON parse error:", e);
            data = { error: "Failed to parse AI response", raw: content };
        }

        return NextResponse.json(data);
    } catch (error: any) {
        console.error("AI Roadmap Error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to generate roadmap" },
            { status: 500 }
        );
    }
}
