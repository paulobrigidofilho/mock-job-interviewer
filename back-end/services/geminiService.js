// ======= Module imports ======= //

const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

//////////////////////////////////////////////////////////////////////////////////
// ========================= API KEY CONFIGURATION =========================== //
/////////////////////////////////////////////////////////////////////////////////

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) throw new Error("GOOGLE_API_KEY environment variable not set.");

const genAI = new GoogleGenerativeAI(apiKey); // Initialize the Google Generative AI client with the API key

////////////////////////////////////////////////////////////////////////////////
// ========================= GEN MODEL CONFIGURATION ======================== //
////////////////////////////////////////////////////////////////////////////////

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.1, // Controls randomness in the output. Lower values make the output more deterministic.
    maxOutputTokens: 1000, // Maximum number of tokens in the output. Adjust based on your needs.
    topP: 0.8, // topP sampling parameter. 0.8 means the model will consider the top 80% of the probability mass.
    topK: 20, // Limits the number of highest probability tokens to consider. 20 means the model will consider the top 20 tokens.
  },

  /////////////////////////////////////////////////////////////////////////////
  // ========================= SYSTEM INSTRUCTION ========================== //
  /////////////////////////////////////////////////////////////////////////////
  // This instruction sets the behavior and tone of the AI model during the interview

  systemInstruction: `You are a serious, focused, and efficient interviewer. Avoid pleasantries and get straight to the point.  Do not introduce yourself or mention your name/title.

**Interview Flow:**
1. **Opening:** Begin *immediately* with: "Tell me about yourself."
2. **Follow-up:** Ask at least 6 relevant, concise follow-up questions, one per turn. Use brief, natural transitions.
3. **Tone:** Maintain a consistently serious and professional tone.
4. **Redirection:** Politely redirect if the candidate deviates from job-related topics.
5. **Concluding:** After sufficient information, provide a brief, neutral summary and conclude with: "Okay, thank you. That covers the main points. The interview is now concluded."
6. **Post-Interview:** Do not provide further responses.`,
});

/////////////////////////////////////////////////////////////////////////////
// ========================= INITIAL CONTEXT CREATION ==================== //
/////////////////////////////////////////////////////////////////////////////
// This function creates the initial context for the AI model based on the job title provided by the user

const createInitialContext = (jobTitle = "a position") =>
  `You are an AI interviewer for Turners Cars conducting a mock interview for the role of "${jobTitle.trim()}". Assess the candidate's suitability with relevant questions.  Start immediately with the first question. No greetings. One question at a time. Tailor questions to the role (e.g., technical, sales, customer interaction).`;

/////////////////////////////////////////////////////////////////////////////
// ========================= CHAT RESPONSE GENERATION ==================== //
/////////////////////////////////////////////////////////////////////////////

const generateChatResponse = async (userMessage, history = [], jobTitle) => {
  try {
    const isStart = history.length === 0; // Check if this is the first message in the conversation
    const currentUserMessageParts = [{ text: userMessage }]; // Prepare the current user message parts

    const chat = model.startChat({ // Initialize the chat with the model
      history: isStart ? [] : history.map(item => ({ role: item.role, parts: (item.parts || []).map(p => ({ text: p.text || "" })) })), // Map the history to the required format
      systemInstruction: isStart ? { role: "system", parts: [{ text: createInitialContext(jobTitle) }] } : null,
    });

////////////////////////////////////////////////////////////////////////////
// ========================= RESPONSE HANDLING ========================== //
////////////////////////////////////////////////////////////////////////////
// Send the user message to the model and await the response

    const result = await chat.sendMessage(currentUserMessageParts);
    const response = await result.response;

    // ========================= RESPONSE VALIDATION ========================== //
    // Check if the response is valid and contains candidates
    // No candidates means the model couldn't generate a valid response

    if (!response || !response.candidates || !response.candidates.length) {
      console.warn("[Gemini Service] No candidates received.", response?.promptFeedback?.blockReason);
      return response?.promptFeedback?.blockReason ? `I cannot respond due to content restrictions (${response.promptFeedback.blockReason}).` : "I received an incomplete response. Please try again.";
    }

    const candidate = response.candidates[0];
    const text = response.text();

    // ========================= RESPONSE PROCESSING ========================== //
    // ========================= Safety Check ========================== //

    if (candidate.finishReason === "SAFETY") {
      const blockedRating = candidate.safetyRatings?.find(r => r.blocked);
      if (blockedRating) return `My response was blocked due to safety concerns (${blockedRating.category}). Let's try a different question.`;
    }

    // ========================= Max Token Check ========================== //

    if (candidate.finishReason !== "STOP" && candidate.finishReason !== "MAX_TOKENS") {
      return `Incomplete response (Reason: ${candidate.finishReason}). Please try again.`;
    }

    return candidate.finishReason === "MAX_TOKENS" ? `${text} ... (truncated)` : text;

    // ========================= ERROR HANDLING ========================== //

  } catch (error) {
    console.error("[Gemini Service] Error:", error);
    if (error.message.includes("API key not valid")) return "API configuration issue. Contact the administrator.";
    if (error.response?.data?.error) return `AI service error: ${error.response.data.error.message}`;
    if (error.name === "GoogleGenerativeAIError") return `AI service issue: ${error.message}. Try again later.`;
    return "Internal error. Please try again later.";
  }
};

module.exports = { generateChatResponse };