export const runChat = async (prompt: string): Promise<string> => {
  try {
    const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
    });

    const data = await response.json();

    if (response.ok) {
        return data.text;
    } else {
        console.error("API proxy call failed:", data.message);
        return data.message || "An error occurred while contacting the AI assistant.";
    }
  } catch (error) {
    console.error("Failed to connect to the backend AI service:", error);
    if (error instanceof Error) {
        return `Failed to connect to the AI assistant: ${error.message}`;
    }
    return "Failed to connect to the AI assistant due to an unknown network error.";
  }
};