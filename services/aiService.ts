import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GameTemplate, GameModule, Level, ClassLevel, ModuleCategory, NoteLength, ActivityType } from "../types";

export const verifyContext = async (context: string): Promise<{approved: boolean, feedback: string}> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    return { approved: true, feedback: "Verification bypassed (No API Key). Proceeding." };
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      approved: { type: Type.BOOLEAN },
      feedback: { type: Type.STRING }
    },
    required: ["approved", "feedback"]
  };

  const prompt = `
    You are a safety moderator. Analyze context: "${context}".
    Is this safe/appropriate for children (10-15)? Return JSON.
  `;

  try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: schema,
        }
      });
      const text = response.text;
      if (!text) throw new Error("No response");
      return JSON.parse(text);
  } catch (e) {
      console.error("Verification failed", e);
      return { approved: true, feedback: "Service unavailable." };
  }
};

// --- Specialized Generators ---

export const extendLessonNote = async (currentNote: string, subject: string, classLevel: ClassLevel, instruction?: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return currentNote + "\n\n(Extension failed: No API Key)";

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
        You are an expert curriculum developer for ${classLevel} school ${subject}.
        
        TASK: Extend and deepen the following lesson note. 
        ${instruction ? `TEACHER INSTRUCTION: "${instruction}"` : '- Make it "Extensive" in detail.'}
        - If no specific instruction is provided, add more real-world examples and analysis.
        - Keep the Markdown formatting (### Headers, **bold**, - lists).
        - Maintain the same topic.
        - Do not simply repeat the existing note; expand upon it or modify it as requested.
        
        CURRENT NOTE:
        ${currentNote}
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 1024 }
            }
        });
        return response.text || currentNote;
    } catch (e) {
        console.error("Extension failed", e);
        return currentNote;
    }
};

export const generateSpecificLevel = async (
    activityType: ActivityType | 'boss_level' | 'question_bank',
    lessonNote: string,
    subject: string,
    classLevel: ClassLevel
): Promise<Level[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });

    let prompt = `
        You are a game level designer for ${classLevel} school ${subject}.
        Base your content STRICTLY on this Lesson Note:
        "${lessonNote.substring(0, 5000)}..."
    `;

    let schema: Schema = { type: Type.OBJECT, properties: {}, required: [] };

    // Configure Prompt & Schema based on Type
    if (activityType === 'flashcards') {
        prompt += `\nGenerate 5-8 high-quality Flashcards for key terms/concepts.`;
        schema = {
            type: Type.OBJECT,
            properties: {
                flashcards: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { front: { type: Type.STRING }, back: { type: Type.STRING } },
                        required: ["front", "back"]
                    }
                }
            }
        };
    } else if (activityType === 'matching') {
        prompt += `\nGenerate 5-8 Matching Pairs. For Secondary, focus on Logic Flows (Cause->Effect) or Term->Definition.`;
        schema = {
            type: Type.OBJECT,
            properties: {
                matching_pairs: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: { left: { type: Type.STRING }, right: { type: Type.STRING } },
                        required: ["left", "right"]
                    }
                }
            }
        };
    } else if (activityType === 'quiz' || activityType === 'question_bank') {
        const count = activityType === 'question_bank' ? 10 : 3;
        prompt += `\nGenerate ${count} multiple choice questions. ${activityType === 'question_bank' ? 'Create a comprehensive Question Bank covering the whole note.' : 'Create a short assessment quiz.'}`;
        schema = {
            type: Type.OBJECT,
            properties: {
                quiz_questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correct_option_letter: { type: Type.STRING },
                            context_scenario: { type: Type.STRING }
                        },
                        required: ["question", "options", "correct_option_letter", "context_scenario"]
                    }
                }
            }
        };
    } else if (activityType === 'fill_blank') {
        prompt += `\nGenerate 4-5 Fill-in-the-blank sentences for mastery check.`;
        schema = {
            type: Type.OBJECT,
            properties: {
                fill_in_blanks: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            sentence: { type: Type.STRING },
                            answer: { type: Type.STRING },
                            context: { type: Type.STRING }
                        },
                        required: ["sentence", "answer", "context"]
                    }
                }
            }
        };
    } else if (activityType === 'boss_level') {
        prompt += `\nGenerate a "BOSS LEVEL". This must be a very difficult, multi-stage logic puzzle or case study formatted as a Quiz Question, but with higher stakes text.`;
        schema = {
            type: Type.OBJECT,
            properties: {
                quiz_questions: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            question: { type: Type.STRING },
                            options: { type: Type.ARRAY, items: { type: Type.STRING } },
                            correct_option_letter: { type: Type.STRING },
                            context_scenario: { type: Type.STRING }
                        },
                        required: ["question", "options", "correct_option_letter", "context_scenario"]
                    }
                }
            }
        };
    }

    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });

    const text = response.text;
    if (!text) throw new Error("No response");
    const data = JSON.parse(text);
    const levels: Level[] = [];
    const timestamp = Date.now();

    // Mapping Logic
    if (data.flashcards) {
        levels.push({
            id: `lvl_fc_${timestamp}`,
            title: "Concept Deck",
            type: "flashcards",
            points: 50,
            challenge: "Review key concepts",
            flashcards: data.flashcards.map((f: any, i: number) => ({ id: `fc_${i}`, front: f.front, back: f.back }))
        });
    }
    if (data.matching_pairs) {
        levels.push({
            id: `lvl_ma_${timestamp}`,
            title: "Logic Links",
            type: "matching",
            points: 100,
            challenge: "Connect the relationships",
            pairs: data.matching_pairs.map((p: any, i: number) => ({ id: `pair_${i}`, left: p.left, right: p.right }))
        });
    }
    if (data.fill_in_blanks) {
        data.fill_in_blanks.forEach((fib: any, i: number) => {
            levels.push({
                id: `lvl_fib_${timestamp}_${i}`,
                title: "Mastery Check",
                type: "fill_blank",
                points: 40,
                challenge: fib.context,
                sentence: fib.sentence,
                correctAnswer: fib.answer
            });
        });
    }
    if (data.quiz_questions) {
        data.quiz_questions.forEach((q: any, i: number) => {
             const isBoss = activityType === 'boss_level';
             levels.push({
                id: `lvl_qz_${timestamp}_${i}`,
                title: isBoss ? "BOSS LEVEL: Final Challenge" : (activityType === 'question_bank' ? `Question Bank #${i+1}` : `Quiz Challenge`),
                type: "quiz",
                points: isBoss ? 200 : 20,
                challenge: q.context_scenario || "Test your knowledge",
                question: q.question,
                options: q.options.map((opt: string, idx: number) => ({
                    id: String.fromCharCode(97 + idx),
                    text: opt,
                    correct: (q.correct_option_letter || 'A').toLowerCase() === String.fromCharCode(97 + idx)
                }))
            });
        });
    }

    return levels;
};


// --- Main Full Generator (Existing) ---

const generateWithGemini = async (
    textInput: string, 
    fileInput: { mimeType: string, data: string } | null,
    template: GameTemplate, 
    customContext: string | undefined,
    targetClassLevel: ClassLevel,
    subjectInput: string,
    category: ModuleCategory,
    noteLength: NoteLength
): Promise<GameModule> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("No API Key");

  const ai = new GoogleGenAI({ apiKey });

  // Use custom context if provided
  const contextName = customContext ? "Custom Context" : template.name;
  const contextTheme = customContext ? customContext : template.theme;

  const curriculumSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      // Step 1: Lesson Notes Generation
      lesson_note_title: { type: Type.STRING },
      lesson_note_content: { type: Type.STRING, description: "The core lesson text. Structured with Markdown headers (###), bold (**), and lists (-)." },
      
      // Primary School Specific: Pictographic Descriptions
      illustrations: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Visual description of the image" },
            caption: { type: Type.STRING }
          },
          required: ["description", "caption"]
        }
      },

      estimated_study_time: { type: Type.INTEGER },
      difficulty_level: { type: Type.STRING, enum: ["easy", "medium", "hard"] },
      
      // Game Data Sections
      flashcards: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            front: { type: Type.STRING },
            back: { type: Type.STRING }
          },
          required: ["front", "back"]
        }
      },
      matching_pairs: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            left: { type: Type.STRING },
            right: { type: Type.STRING }
          },
          required: ["left", "right"]
        }
      },
      quiz_questions: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } },
            correct_option_letter: { type: Type.STRING },
            context_scenario: { type: Type.STRING }
          },
          required: ["question", "options", "correct_option_letter", "context_scenario"]
        }
      },
      fill_in_blanks: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sentence: { type: Type.STRING, description: "Use '___' for blank" },
            answer: { type: Type.STRING },
            context: { type: Type.STRING }
          },
          required: ["sentence", "answer", "context"]
        }
      }
    },
    required: ["lesson_note_title", "lesson_note_content", "illustrations", "flashcards", "matching_pairs", "quiz_questions", "fill_in_blanks", "estimated_study_time", "difficulty_level"]
  };

  const refineryPrompt = `
You are the Parentyn Nexus Refinery Engine using Gemini 3 Pro. 
You are an expert curriculum developer.

**CRITICAL INSTRUCTION:**
Strictly adhere to **NERDC (Nigerian Educational Research and Development Council)** and **International K-12 Academic Standards**.
While the 'Theme' (${contextTheme}) provides a setting, the **educational content must remain rigorous, accurate, and standard**. Do not dilute the academic facts with the theme; only use the theme for examples or scenarios *after* explaining the core concept.

TARGET CLASS: ${targetClassLevel.toUpperCase()} School.
SUBJECT: ${subjectInput}
CATEGORY: ${category.toUpperCase()}
LESSON NOTE DEPTH: ${noteLength.toUpperCase()}

TASK:
1. Analyze the input.
2. Generate a Lesson Note (Formatted with Markdown: ### for Headers, ** for bold, - for lists).
3. Generate Game Assets.

**SPECIAL HANDLING FOR UPLOADS:**
- **Handwritten Notes**: Decode messy handwriting with high precision. Fix grammar/spelling errors from quick note-taking. Structure unstructured notes logically.
- **Snapped Photos (Whiteboard/Textbook)**: If the image is skewed or has poor lighting, focus on extracting the textual content and key diagrams.
- **Visuals**: If a diagram is detected in the input, describe it for the 'Illustrations' section.

RULES FOR LESSON NOTE DEPTH (${noteLength}):
- **Concise**: A brief summary (approx. 200 words).
- **Standard**: A typical class note (approx. 500 words).
- **Extensive**: A comprehensive deep-dive (approx. 1000+ words).

RULES FOR ${targetClassLevel.toUpperCase()}:
${targetClassLevel === 'primary' ? `
- **Standard**: NERDC Primary Curriculum.
- **Lesson Note**: 
  - Structure: Introduction -> Core Concept -> Real World Example -> Summary.
  - Tone: Educational, Encouraging, Clear.
  - Use **Sensory Metaphors** to explain complex ideas, but ensure the scientific/academic definition is also provided simply.
- **Game**: Playful, emojis, simple matching.
- **Illustrations**: CRITICAL. Generate 4-6 detailed descriptions for pictographic cards.
` : `
- **Standard**: **NERDC / WAEC / JAMB Syllabus Precision**.
- **Tone**: **Professional, objective-driven, boardroom-ready.** Focus on building "Academic Muscle".
- **Lesson Note**: 
  - Structure: **Specific Objectives** -> **Definitions** -> **Theoretical Analysis** -> **Calculations/Derivations** -> **Exam-Style Application**.
  - **NO** playful slang. Use standard academic/exam terminology exclusively.
  - Prioritize precision and depth suitable for external examinations.
- **Game Assets**:
  - **Flashcards**: **HIGH PRIORITY**. Focus on precise definitions, formulas, and theorems.
  - **Logic Flowcharts**: Use the 'Matching' game to simulate logic flows (e.g., Left: "Step 1 of Analysis", Right: "Derive Hypothesis").
  - **BOSS LEVEL**: You **MUST** include a final, high-difficulty level called "Boss Level".
    - Type: Quiz or Fill-in-the-blanks.
    - Challenge: A complex, multi-stage logic puzzle or case study requiring synthesis of the entire lesson.
    - Content: "Syllabus Precision" - extremely accurate and challenging.
`}

RULES FOR ${category.toUpperCase()}:
${category === 'quantitative' ? `
- **MATH/SCIENCE**: You MUST use LaTeX format for ALL mathematical expressions.
- Format inline math as $...$ and block math as $$...$$
- Ensure formulas are correct.
` : `
- **QUALITATIVE**: Standard text.
`}
  `;

  const parts: any[] = [{ text: refineryPrompt }];
  
  if (textInput) {
      parts.push({ text: `Teacher Notes: ${textInput}` });
  }
  
  if (fileInput) {
      parts.push({
          inlineData: {
              mimeType: fileInput.mimeType,
              data: fileInput.data
          }
      });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: curriculumSchema,
      temperature: 0.3, // Lower temperature for more standard academic output
      thinkingConfig: { thinkingBudget: 2048 } // High thinking budget for curriculum alignment
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const data = JSON.parse(text);

  // Transform into GameModule Levels
  const levels: Level[] = [];
  let levelCounter = 1;

  // 1. Memory (Flashcards)
  if (data.flashcards?.length > 0) {
    levels.push({
      id: `lvl_${levelCounter++}`,
      title: targetClassLevel === 'primary' ? "Picture Cards" : "Core Definitions",
      type: "flashcards",
      points: 50,
      challenge: targetClassLevel === 'primary' ? "Match the pictures!" : "Rapid recall of key syllabus terms",
      flashcards: data.flashcards.map((f: any, i: number) => ({
        id: `fc_${i}`,
        front: f.front,
        back: f.back
      }))
    });
  }

  // 2. Association (Matching) - Can serve as Logic Flow for Secondary
  if (data.matching_pairs?.length > 0) {
    levels.push({
      id: `lvl_${levelCounter++}`,
      title: targetClassLevel === 'primary' ? "Connect It" : "Logic Flow & Relations",
      type: "matching",
      points: 100,
      challenge: targetClassLevel === 'primary' ? "Find the connections" : "Map the logical relationships",
      pairs: data.matching_pairs.map((p: any, i: number) => ({
        id: `pair_${i}`,
        left: p.left,
        right: p.right
      }))
    });
  }

  // 3. Application (Quiz) - Standard Levels
  if (data.quiz_questions?.length > 0) {
    // Take all but the last one if we want to save one for boss level, 
    // BUT the prompt asks for a specific boss level structure. 
    // We'll treat standard quiz questions as practice.
    data.quiz_questions.forEach((q: any, i: number) => {
      // Check if this looks like a boss level question based on length or complexity, 
      // or just add them as standard challenges.
      const isBossContext = q.context_scenario.toLowerCase().includes('boss') || q.context_scenario.toLowerCase().includes('mastery');
      
      levels.push({
        id: `lvl_${levelCounter++}`,
        title: isBossContext ? "BOSS LEVEL: Mastery" : `Application Phase ${i + 1}`,
        type: "quiz",
        points: isBossContext ? 150 : 20,
        challenge: q.context_scenario,
        question: q.question,
        options: q.options.map((opt: string, idx: number) => ({
          id: String.fromCharCode(97 + idx),
          text: opt,
          correct: (q.correct_option_letter || 'A').toLowerCase() === String.fromCharCode(97 + idx)
        }))
      });
    });
  }

  // 4. Mastery (Fill in Blanks)
  if (data.fill_in_blanks?.length > 0) {
    data.fill_in_blanks.forEach((fib: any, i: number) => {
      levels.push({
        id: `lvl_${levelCounter++}`,
        title: "Synthesis & Calculation",
        type: "fill_blank",
        points: 40,
        challenge: fib.context,
        sentence: fib.sentence,
        correctAnswer: fib.answer
      });
    });
  }
  
  // Force sort levels? Or rely on AI order? 
  // We'll trust the AI order but if we see a "Boss Level" in title, we might want to ensure it's last.
  // For now, simple array push preserves order generated by code logic.

  const effectiveTemplate: GameTemplate = customContext ? {
      ...template,
      id: 'custom',
      name: 'Custom Context',
      theme: customContext,
      bgColor: 'from-pink-600 to-rose-600'
  } : template;

  return {
    id: `gen_${Date.now()}`,
    title: data.lesson_note_title || `${subjectInput} Module`,
    template: effectiveTemplate,
    levels: levels,
    metadata: {
      createdAt: new Date().toISOString(),
      difficulty: data.difficulty_level || 'medium',
      estimatedTime: data.estimated_study_time || 15
    },
    subject: subjectInput,
    grade: targetClassLevel === 'primary' ? 'Primary' : 'Secondary',
    plays: 0,
    avgScore: 0,
    type: 'custom',
    status: 'draft',
    category: category,
    lessonNote: data.lesson_note_content,
    illustrations: data.illustrations,
    classLevel: targetClassLevel
  };
};

const generateMock = (content: string, template: GameTemplate, customContext?: string, targetClass?: ClassLevel, category?: ModuleCategory): Promise<GameModule> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const contextTheme = customContext || template.name;
      const gameModule: GameModule = {
        id: `gen_${Date.now()}`,
        title: `${contextTheme} Demo`,
        template: customContext ? { ...template, name: 'Custom', theme: customContext } : template,
        subject: 'Demo Subject',
        grade: targetClass === 'primary' ? 'Primary 3' : 'JSS 2',
        plays: 0,
        avgScore: 0,
        type: 'custom',
        status: 'draft',
        category: category || 'qualitative',
        lessonNote: `### Introduction to Photosynthesis
Photosynthesis is the process by which green plants make their own food.

### Key Concepts
* **Chlorophyll**: The green pigment.
* **Sunlight**: The energy source.

### The Formula
The chemical equation is:
$$ 6CO_2 + 6H_2O \\rightarrow C_6H_{12}O_6 + 6O_2 $$`,
        illustrations: targetClass === 'primary' ? [
            { description: "A happy sun smiling at a green leaf", caption: "Sunlight gives energy" },
            { description: "Roots drinking water from soil", caption: "Roots drink water" }
        ] : [],
        classLevel: targetClass || 'secondary',
        metadata: { createdAt: new Date().toISOString(), difficulty: 'medium', estimatedTime: 15 },
        levels: [
          {
            id: 'l1',
            title: 'Key Terms',
            type: 'flashcards',
            points: 50,
            challenge: 'Review these terms',
            flashcards: [
              { id: '1', front: 'Photosynthesis', back: 'Process by which plants make food' },
              { id: '2', front: 'Chlorophyll', back: 'Green pigment in plants' }
            ]
          },
          {
            id: 'l2',
            title: 'Connect Concepts',
            type: 'matching',
            points: 100,
            challenge: 'Match the term to its function',
            pairs: [
              { id: 'p1', left: 'Roots', right: 'Absorb water' },
              { id: 'p2', left: 'Leaves', right: 'Capture sunlight' }
            ]
          }
        ]
      };
      
      resolve(gameModule);
    }, 2000);
  });
};

export const generateGameContent = async (
    textInput: string, 
    fileInput: { mimeType: string, data: string } | null,
    template: GameTemplate, 
    customContext: string | undefined,
    targetClassLevel: ClassLevel,
    subjectInput: string,
    category: ModuleCategory = 'qualitative',
    noteLength: NoteLength = 'standard'
): Promise<GameModule> => {
  try {
    if (process.env.API_KEY) {
      return await generateWithGemini(textInput, fileInput, template, customContext, targetClassLevel, subjectInput, category, noteLength);
    }
    return await generateMock(textInput, template, customContext, targetClassLevel, category);
  } catch (error) {
    console.error("AI Generation failed, falling back to mock:", error);
    return await generateMock(textInput, template, customContext, targetClassLevel, category);
  }
};