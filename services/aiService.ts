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

export const generateGameContent = async (
    lessonText: string,
    images: { mimeType: string, data: string }[],
    template: GameTemplate,
    customContext: string | undefined,
    classLevel: ClassLevel,
    subject: string,
    category: ModuleCategory,
    noteLength: NoteLength
): Promise<GameModule> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });

    const contextDesc = customContext || template.theme;
    
    const formattingInstructions = `
    HEURISTIC PARSING & FORMATTING RULES:
    1. Analyze the subject matter:
       - If QUANTITATIVE (Physics, Math, Chemistry, Accounting):
         * STRICTLY use LaTeX for ALL formulas, equations, and variables.
         * Inline math: $E=mc^2$
         * Block math: $$x = \\frac{-b}{2a}$$
       - If QUALITATIVE (History, Literature, Intro Biology):
         * Do NOT use LaTeX for standard text.
         * Use standard Markdown for emphasis (**bold**, *italic*).
    2. Headings:
       - Standardize section titles using #### (e.g. #### Introduction).
    3. Constraint:
       - Only apply LaTeX math-block rendering to segments containing mathematical symbols, variables, or chemical equations.
       - Do not attempt to "mathify" standard prose.
    `;

    const prompt = `
    Role: Curriculum Expert & Game Designer.
    Task: Create a learning module for ${classLevel} students in ${subject}.
    Category: ${category}.
    Note Detail: ${noteLength}.
    Theme: ${contextDesc}.
    
    Source Material:
    "${lessonText.substring(0, 10000)}"

    Instructions:
    Generate a JSON object containing:
    1. "title": An engaging title for the module.
    2. "lessonNote": A structured markdown lesson note following these rules:
       ${formattingInstructions}
    3. "metadata": { "difficulty": "easy"|"medium"|"hard", "estimatedTime": number (minutes) }
    4. "levels": An array of exactly 3 levels in this order:
       - Level 1: "flashcards" (Concept Deck). Array of {front, back}.
       - Level 2: "matching" (Logic Links). Array of {left, right}.
       - Level 3: "quiz" (Final Challenge). Array of {question, options:[{id, text, correct}], challenge}.
    
    For "quiz", provide 3 questions.
    For "flashcards", provide 5 cards.
    For "matching", provide 5 pairs.
    `;

    const parts: any[] = [{ text: prompt }];
    
    if (images && images.length > 0) {
        images.forEach(img => {
            parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview', 
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                temperature: 1.0, // High temperature for creative/varied generation
            }
        });

        const text = response.text;
        if(!text) throw new Error("No response");
        
        const data = JSON.parse(text);
        const moduleId = `mod_${Date.now()}`;
        const timestamp = Date.now();

        // Transform JSON to strict types
        const levels: Level[] = [];

        if (data.levels && Array.isArray(data.levels)) {
            data.levels.forEach((l: any, i: number) => {
                const levelId = `l_${moduleId}_${i}`;
                if (l.type === 'flashcards' || (!l.type && l.flashcards)) {
                    levels.push({
                        id: levelId,
                        title: l.title || "Concept Deck",
                        type: 'flashcards',
                        points: 50,
                        challenge: l.challenge || "Review the key concepts.",
                        flashcards: l.flashcards?.map((f: any, fi: number) => ({ id: `f_${timestamp}_${fi}`, front: f.front, back: f.back })) || []
                    });
                } else if (l.type === 'matching' || (!l.type && l.pairs)) {
                    levels.push({
                         id: levelId,
                         title: l.title || "Logic Links",
                         type: 'matching',
                         points: 100,
                         challenge: l.challenge || "Match the terms.",
                         pairs: (l.pairs || l.matching_pairs)?.map((p: any, pi: number) => ({ id: `p_${timestamp}_${pi}`, left: p.left, right: p.right })) || []
                    });
                } else if (l.type === 'quiz' || (!l.type && (l.questions || l.quiz_questions))) {
                    const questions = l.questions || l.quiz_questions || [];
                    if (Array.isArray(questions) && questions.length > 0) {
                         questions.forEach((q: any, qi: number) => {
                             levels.push({
                                 id: `${levelId}_${qi}`,
                                 title: l.title ? `${l.title} (${qi+1})` : `Quiz Challenge ${qi+1}`,
                                 type: 'quiz',
                                 points: 20,
                                 challenge: l.challenge || q.context_scenario || "Test your knowledge.",
                                 question: q.question,
                                 options: q.options?.map((opt: any, oi: number) => ({
                                     id: opt.id || String.fromCharCode(97 + oi),
                                     text: typeof opt === 'string' ? opt : opt.text,
                                     correct: typeof opt === 'object' ? opt.correct : (q.correct_answer === opt || q.correct_option_letter === String.fromCharCode(65+oi)) // Best guess fallback
                                 })) || []
                             });
                         });
                    } else if (l.question) {
                         levels.push({
                            id: levelId,
                            title: l.title || "Quiz Challenge",
                            type: 'quiz',
                            points: 20,
                            challenge: l.challenge,
                            question: l.question,
                            options: l.options?.map((opt: any, oi: number) => ({
                                id: opt.id || String.fromCharCode(97 + oi),
                                text: typeof opt === 'string' ? opt : opt.text,
                                correct: opt.correct || false
                            })) || []
                         });
                    }
                }
            });
        }

        return {
            id: moduleId,
            title: data.title || "Untitled Module",
            template: template,
            levels: levels,
            metadata: {
                createdAt: new Date().toISOString(),
                difficulty: data.metadata?.difficulty || 'medium',
                estimatedTime: data.metadata?.estimatedTime || 15
            },
            subject,
            grade: classLevel === 'primary' ? 'Grade 4-6' : 'JSS 1-3',
            lessonNote: data.lessonNote || "",
            category,
            classLevel,
            status: 'draft',
            questionBank: []
        };

    } catch (e) {
        console.error("Content Generation Failed", e);
        throw e;
    }
};

// --- Specialized Generators ---

export const getAiCodeHelp = async (context: string, code: string, error: string | null): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "AI Help Unavailable (No API Key)";

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
        You are a friendly Python tutor for students.
        Goal: Provide a short, helpful hint to fix the code. DO NOT give the full solution.
        
        Challenge Context: "${context}"
        Student's Current Code:
        \`\`\`python
        ${code}
        \`\`\`
        Error Message (if any): "${error || "None, but the output is incorrect"}"

        Output: A 2-3 sentence hint explaining what might be wrong or what to try next.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { temperature: 0.7 }
        });
        return response.text || "Try checking your syntax and logic again.";
    } catch (e) {
        return "Could not generate hint.";
    }
};

export const extendLessonNote = async (currentNote: string, subject: string, classLevel: ClassLevel, instruction?: string): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return "\n\n**Extension Failed:** No API Key available.";

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `
        You are an expert curriculum developer for ${classLevel} school ${subject}.
        
        TASK: Write an ADDENDUM or CONTINUATION to the existing lesson note based on the specific instruction below.
        
        TEACHER INSTRUCTION: "${instruction || "Add more real-world examples and advanced analysis."}"
        
        RULES:
        - Output ONLY the new additional content.
        - Do NOT repeat the existing note content provided below.
        - Start with a clear Markdown Header (#### Title of Extension).
        - HEURISTIC FORMATTING:
          * If content is math/science: Use LaTeX for variables ($x$) and equations ($$y=mx+b$$).
          * If content is qualitative: Use standard markdown.
        - Maintain the same markdown formatting style.
        - Provide high-quality, rigorous academic content.
        
        CONTEXT (Existing Note End):
        "${currentNote.substring(Math.max(0, currentNote.length - 2000))}"
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                thinkingConfig: { thinkingBudget: 1024 },
                temperature: 1.0, 
            }
        });
        return response.text || "";
    } catch (e) {
        console.error("Extension failed", e);
        return "\n\n**System Error:** Could not generate extension.";
    }
};

export const processDocumentToNote = async (file: { mimeType: string, data: string }, subject: string, classLevel: ClassLevel): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });

    const formattingInstructions = `
    HEURISTIC PARSING & FORMATTING RULES:
    1. Analyze the subject matter:
       - If QUANTITATIVE (Physics, Math, Chemistry, Accounting):
         * STRICTLY use LaTeX for ALL formulas, equations, and variables.
         * Inline math: $E=mc^2$
         * Block math: $$x = \\frac{-b}{2a}$$
       - If QUALITATIVE (History, Literature, Intro Biology):
         * Do NOT use LaTeX for standard text.
         * Use standard Markdown for emphasis (**bold**, *italic*).
    2. Headings:
       - Standardize section titles using #### (e.g. #### Introduction).
    `;

    const prompt = `
        Role: Educational Content Converter.
        Context: ${classLevel} ${subject}.
        Task: Convert the attached document into a structured, clean Markdown lesson note.
        
        Instructions:
        1. Extract the educational content.
        2. Format it using the following rules:
           ${formattingInstructions}
        3. Do NOT include preamble or conversational filler. Output ONLY the markdown note.
    `;

    const parts = [
        { text: prompt },
        { inlineData: { mimeType: file.mimeType, data: file.data } }
    ];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts },
            config: {
                temperature: 0.5,
            }
        });
        return response.text || "Failed to convert document.";
    } catch (e) {
        console.error("Document conversion failed", e);
        return "Error: Could not process document.";
    }
};

export const generateSpecificLevel = async (
    activityType: ActivityType | 'boss_level' | 'question_bank',
    lessonNote: string,
    subject: string,
    classLevel: ClassLevel
): Promise<Level[]> => {
    // This function is kept for backward compatibility for 'Add AI Level', 
    // but the specialized question bank logic will handle 'question_bank' better below.
    // For now, if type is 'question_bank', we just redirect to a simple quiz gen or use the existing logic.
    // The existing logic already handles 'question_bank' by generating quiz questions.
    return generateGameContentLogic(activityType, lessonNote, subject, classLevel);
};

// Internal reusable logic
const generateGameContentLogic = async (activityType: string, lessonNote: string, subject: string, classLevel: string): Promise<Level[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });

    let prompt = `
        You are a game level designer for ${classLevel} school ${subject}.
        Base your content STRICTLY on this Lesson Note:
        "${lessonNote.substring(0, 5000)}..."
        
        CRITICAL FORMATTING RULES:
        1. Ensure any math or physics formulas use correct LaTeX format ($...$).
        2. NEVER write 'x-bar' or 'alpha' as text next to the symbol. Just use the symbol $\\bar{x}$.
        3. Do not write raw LaTeX commands without dollar signs.
        4. If content is purely text-based (History, English), do not force LaTeX.
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
    } else if (activityType === 'arrange') {
        prompt += `\nGenerate exactly 4 distinct, chronological or logical steps based on a process in the text. (e.g., Steps of Photosynthesis, Timeline of an Event, Order of Operations). Return them in the CORRECT order.`;
        schema = {
            type: Type.OBJECT,
            properties: {
                sequence_title: { type: Type.STRING },
                sequence_context: { type: Type.STRING },
                steps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exactly 4 steps in the correct order"
                }
            },
            required: ["sequence_title", "steps"]
        };
    } else if (activityType === 'lab') {
        prompt += `\nGenerate a Python Coding Challenge (Lab).
        1. Create a scenario involving data analysis, plotting, or a simple algorithm based on the topic.
        2. Provide 'starterCode': runnable Python code with a missing part or a TODO comment for the student to fill.
        3. Provide 'targetOutput': a unique string or number that MUST appear in the stdout for success.
        4. Provide 'hints': 2 helpful hints.
        `;
        schema = {
            type: Type.OBJECT,
            properties: {
                lab_title: { type: Type.STRING },
                lab_challenge: { type: Type.STRING },
                starterCode: { type: Type.STRING },
                targetOutput: { type: Type.STRING },
                hints: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["lab_title", "lab_challenge", "starterCode", "targetOutput", "hints"]
        };
    } else if (activityType === 'quiz' || activityType === 'question_bank') {
        const count = activityType === 'question_bank' ? 5 : 3; 
        prompt += `\nGenerate ${count} distinct multiple choice questions. ${activityType === 'question_bank' ? 'Create a question bank covering different aspects of the note.' : 'Create a short assessment quiz.'}`;
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
            responseSchema: schema,
            temperature: 1.0 // High temp
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
    if (data.steps && Array.isArray(data.steps)) {
        levels.push({
            id: `lvl_arr_${timestamp}`,
            title: data.sequence_title || "Arrange the Blocks",
            type: "arrange",
            points: 75,
            challenge: data.sequence_context || "Order the steps correctly.",
            steps: data.steps
        });
    }
    if (data.starterCode) {
        levels.push({
            id: `lvl_lab_${timestamp}`,
            title: data.lab_title || "Code Lab Challenge",
            type: "lab",
            points: 150,
            challenge: data.lab_challenge || "Write the code to solve the problem.",
            starterCode: data.starterCode,
            targetOutput: data.targetOutput,
            hints: data.hints
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
                title: isBoss ? "BOSS LEVEL: Final Challenge" : (activityType === 'question_bank' ? `Question Bank ${i+1}` : `Quiz Challenge`),
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

// New function specifically for Question Bank generation
export const generateQuestionBankContent = async (
    count: number,
    types: ('quiz' | 'theory' | 'fill_blank')[],
    contextText: string, // Current note
    files: { mimeType: string, data: string }[], // New uploaded material
    subject: string,
    level: string
): Promise<Level[]> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("No API Key");

    const ai = new GoogleGenAI({ apiKey });

    const instructions = `
        You are an assessment expert for ${level} ${subject}.
        Generate a Question Bank of ${count} questions based on the provided material.
        
        Rules:
        1. Generate ONLY the requested types: ${types.join(', ')}.
        2. Ensure variety and academic rigor.
        3. For 'quiz' (Objective), provide 4 options.
        4. For 'theory', provide a 'key_points' or model answer.
        5. For 'fill_blank', provide the sentence with '___' and the answer.
    `;

    const prompt = `
        Task: Create a Question Bank.
        Material: "${contextText.substring(0, 5000)}" (and attached files if any).
        
        Output JSON Schema:
        {
            "questions": [
                {
                    "type": "quiz" | "theory" | "fill_blank",
                    "question": "string",
                    "options": ["string"] (only for quiz),
                    "correct_option_letter": "A|B|C|D" (only for quiz),
                    "answer": "string" (for theory/fill_blank model answer)
                }
            ]
        }
    `;

    const parts: any[] = [{ text: instructions + "\n" + prompt }];
    
    if (files && files.length > 0) {
        files.forEach(f => {
            parts.push({ inlineData: { mimeType: f.mimeType, data: f.data } });
        });
    }

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts },
            config: {
                responseMimeType: "application/json",
                temperature: 0.8,
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response");
        const data = JSON.parse(text);
        const questions: Level[] = [];
        const timestamp = Date.now();

        if (data.questions && Array.isArray(data.questions)) {
            data.questions.forEach((q: any, i: number) => {
                // Determine title based on type
                const title = q.type === 'quiz' ? `Objective Q${i+1}` : q.type === 'theory' ? `Theory Q${i+1}` : `Gap Fill Q${i+1}`;
                
                if (q.type === 'quiz') {
                    questions.push({
                        id: `qb_${timestamp}_${i}`,
                        title: title,
                        type: 'quiz',
                        points: 10,
                        challenge: "Select the correct option.",
                        question: q.question,
                        options: q.options?.map((opt: string, idx: number) => ({
                            id: String.fromCharCode(97 + idx),
                            text: opt,
                            correct: (q.correct_option_letter || 'A').toLowerCase() === String.fromCharCode(97 + idx)
                        }))
                    });
                } else if (q.type === 'fill_blank') {
                    questions.push({
                        id: `qb_${timestamp}_${i}`,
                        title: title,
                        type: 'fill_blank',
                        points: 10,
                        challenge: "Complete the sentence.",
                        sentence: q.question, // API might return sentence in 'question' field
                        correctAnswer: q.answer
                    });
                } else if (q.type === 'theory') {
                    questions.push({
                        id: `qb_${timestamp}_${i}`,
                        title: title,
                        type: 'theory',
                        points: 20,
                        challenge: "Provide a detailed answer.",
                        question: q.question,
                        correctAnswer: q.answer // Model answer
                    });
                }
            });
        }
        return questions;

    } catch (e) {
        console.error("QB Gen Error", e);
        throw e;
    }
};
