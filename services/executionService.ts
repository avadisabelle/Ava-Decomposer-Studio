/**
 * Executes an individual task via the server-side Gemini API route
 */
export const executeTask = async (
  taskTitle: string,
  taskDescription: string,
  context: string = ""
): Promise<string> => {
  try {
    const response = await fetch('/api/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        taskTitle,
        taskDescription,
        context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Execution failed for task: ${taskTitle}`);
    }

    const data = await response.json();
    return data.output || "No output generated.";
  } catch (error: any) {
    console.error("Task execution failed:", error);
    throw new Error(error.message || `Execution failed for task: ${taskTitle}`);
  }
};
