// ======= Module imports ======= // 
const geminiService = require('../services/geminiService');

////////////////////////////////////////////////////////////////////////
// ========================= CHAT CONTROLLER ======================== //
////////////////////////////////////////////////////////////////////////


const handleChatMessage = async (req, res) => {
    req.session.chatHistory = req.session.chatHistory || []; // Use session history
    const { message, jobTitle, startInterview } = req.body;

    if (startInterview) {
        req.session.chatHistory = []; // Clear session history for new interview
    }

    if (startInterview && jobTitle) { // Store jobTitle in the session
        req.session.jobTitle = jobTitle;
        req.session.chatHistory = []; // Clear history for new interview
    }

    console.log(`Received request: message="${message}", history_length=${req.session.chatHistory.length}, jobTitle="${jobTitle || ''}"`); // Use session history
    
    try {
        // ============== GEMINI SERVICE CALL ============== //
        const reply = await geminiService.generateChatResponse(message, req.session.chatHistory, req.session.jobTitle);

        req.session.chatHistory.push({ role: "user", parts: [{ text: message }] });
        req.session.chatHistory.push({ role: "model", parts: [{ text: reply }] });
        
        res.json({ reply }); // Send the AI's reply back
    } catch (error) {
        console.error("Error in chat controller:", error);
        res.status(500).json({ error: 'Failed to get response from AI service' });
    }
};

module.exports = {
    handleChatMessage,
};