/* ========== Component & Images Import ========== */

import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import turnersCars from './assets/turnerscars.png';
import ReactMarkdown from 'react-markdown';

// ====================== API URL ===================== //
const API_URL = 'http://localhost:4000/api/chat';

////////////////////////////////////////////////////////////////////////
// ========================== APP COMPONENT ========================= //
////////////////////////////////////////////////////////////////////////

function App() {

  // ========================= State Variables ======================== //
  const [jobTitle, setJobTitle] = useState('');
  const [conversation, setConversation] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);

  // Ref for scrolling to the bottom of the chat
  const conversationEndRef = useRef(null);

  ////////////////////////////////////////////////////////////////////////
  // ========================= HELPER FUNCTIONS ======================= //
  ////////////////////////////////////////////////////////////////////////

  // ======================== SCROLL TO BOTTOM ========================= //
  const scrollToBottom = () => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ========================= USE EFFECT HOOK ======================== //
  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

  ////////////////////////////////////////////////////////////////////////
  // ========================= START INTERVIEW ======================== //
  ////////////////////////////////////////////////////////////////////////
  // Function to start the interview
  // It sends a request to the backend with the job title and handles the response

  const startInterview = async () => {
    if (isInterviewStarted || isLoading || !jobTitle.trim()) {
      if (!jobTitle.trim()) {
        setError("Please enter a job title to start the interview.");
      }
      return;
    } 

    setIsLoading(true);
    setError(null);
    setConversation([]);
    console.log(`Attempting to start interview for Job Title: "${jobTitle}"`);

    // ================== API CALL TO START INTERVIEW ================== //
    // Send a request to the backend to start the interview with the job title

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: "Start the interview.", jobTitle: jobTitle }),
        credentials: 'include',
      });

      console.log("Initial request response status:", response.status);

      // ================== ERROR HANDLING ================== //

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
        console.error("Initial request failed:", errorData);
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      // ================== SUCCESS HANDLING ================== //

      const data = await response.json();
      console.log("Initial AI response received:", data);

      if (data.reply) {
        setConversation([{ speaker: 'Interviewer', text: data.reply }]);
        setIsInterviewStarted(true);
      } else {
        throw new Error("Received empty reply from AI to start interview.");
      }
    } catch (err) {
      console.error('Failed to start interview:', err);
      setError(`Failed to start interview: ${err.message}. Check backend & API key.`);
      setIsInterviewStarted(false);
    } finally {
      setIsLoading(false);
    }
  };


  ///////////////////////////////////////////////////////////////////////
  // ========================= EVENT HANDLERS ======================== //
  ///////////////////////////////////////////////////////////////////////

  // ================== Handle Input Change ================== //
  const handleInputChange = (event) => {
    setUserInput(event.target.value);
  };

  // ================ Handle Job Title Change ================ //
  const handleJobTitleChange = (event) => {
    if (!isInterviewStarted) {
      setJobTitle(event.target.value);
      setError(null);
    }
  };

  // ================== Handle Submit ======================== //  
  const handleSubmit = async () => {
    const trimmedInput = userInput.trim();

    if (trimmedInput === '' || isLoading || !isInterviewStarted) return; // Prevent empty submission

    const userMessage = { speaker: 'Me', text: trimmedInput }; // Wrap user message in an object

    setConversation(prev => [...prev, userMessage]);
    setUserInput('');
    setIsLoading(true);
    setError(null);

    try {
      console.log("Sending to backend:", { message: trimmedInput });

      // ================== API CALL TO SEND MESSAGE ================== //

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedInput, jobTitle: jobTitle }),
        credentials: 'include', 
      });

      console.log("Backend response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error! Status: ${response.status}` }));
        console.error("Backend request failed:", errorData);
        setConversation(prev => prev.slice(0, -1)); // Rollback
        throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Backend response data:", data);

      // =================== VALIDATE AI RESPONSE =================== //

      if (data.reply) { // Check if reply is present
        setConversation(prev => [...prev, { speaker: 'Interviewer', text: data.reply }]); // Append the AI's reply

        if (data.reply.trim() === '') { // Check if the reply is empty
          setError("Received an empty reply from the interviewer.");
          setConversation(prev => prev.slice(0, -1)); // Rollback
        } else { // Check if the reply is valid
          setError(null);
        }
      } else { // Check if reply is empty
        setError("Received an empty reply from the interviewer.");
        setConversation(prev => prev.slice(0, -1)); // Rollback
      }
    } catch (err) {
      console.error('Failed to send message or get response:', err);
      setError(`Failed to get response: ${err.message}. Please try again.`);
      if (conversation[conversation.length - 1]?.speaker === 'Me' && conversation[conversation.length - 1]?.text === trimmedInput) {
        setConversation(prev => prev.slice(0, -1)); // Rollback
      }
    } finally {
      setIsLoading(false);
    }
  };

///////////////////////////////////////////////////////////////////////
// ========================= JSX BELOW ============================= //
///////////////////////////////////////////////////////////////////////

  return (
    <div className="app-container">

      {/* Logo and Header Section */}
      <img src={turnersCars} alt="Turners Cars" className="logo" />
      <h1>AI Mock Interviewer</h1>

      {/* Job Title Section - Now interactive before start */}
      <div className="job-title-container">
        <label htmlFor="jobTitle">Job Title:</label>
        <input
          type="text"
          id="jobTitle"
          value={jobTitle}
          placeholder="e.g., Technical Sales Assessor"
          onChange={handleJobTitleChange}
          // Disable input once interview starts
          disabled={isInterviewStarted || isLoading}
          aria-label="Job Title for Interview"
        />
         {/* Button to Start the Interview */}
         {!isInterviewStarted && (
             <button
                onClick={startInterview}
                // Disable button if loading or no title entered
                disabled={isLoading || !jobTitle.trim()}
                className="start-button" // Add class for styling if needed
             >
                {isLoading ? 'Starting...' : 'Start Interview'}
             </button>
         )}
      </div>

      {/* Conversation Section */}
      <div className="conversation-container">
        {/* Conditionally render conversation only after start */}
        {isInterviewStarted && conversation.length === 0 && !isLoading && (
             <div className="message system">Waiting for the first question...</div>
        )}
        {conversation.map((message, index) => (
          <div key={index} className={`message ${message.speaker.toLowerCase()}`}>
            <strong>{message.speaker}:</strong> {/* Keep the speaker label */}
            {/* Conditionally render content based on speaker */}
            {message.speaker === 'Interviewer' ? (
              // Use ReactMarkdown for the AI's response
              <ReactMarkdown>{message.text}</ReactMarkdown>
            ) : ( message.text)} 
            {/* Render user's message as plain text */}
          </div>
        ))}
        {/* Loading indicator during conversation turns */}
        {isLoading && isInterviewStarted && (
          <div className="message interviewer">
            <strong>Interviewer:</strong> Typing...
          </div>
        )}
        <div ref={conversationEndRef} /> {/* Scroll target */}
      </div>

      {/* Error Display Section */}
      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      {/* Input Section - Enabled only after interview starts */}
      <div className="input-container">
        <input
          type="text"
          placeholder={
            !isInterviewStarted ? "Enter job title and click 'Start Interview'" : "Type your response..."
          }
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !isLoading && isInterviewStarted) {
              handleSubmit();
            }
          }}
          // Disable if loading or interview hasn't started
          disabled={isLoading || !isInterviewStarted}
          aria-label="Your response to the interviewer"
        />
        <button
          onClick={handleSubmit}
          // Disable if loading, interview not started, or input is empty
          disabled={isLoading || !isInterviewStarted || userInput.trim() === ''}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

export default App;