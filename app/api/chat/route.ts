
import { openai } from '@ai-sdk/openai';
import { streamText, convertToCoreMessages } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
    const { messages, context } = await req.json();

    const systemPrompt = `You are an expert AI coding assistant integrated into a modern IDE.
  
  CONTEXT:
  The user is currently editing a file.
  ${context ? `Active File Context:\n${context}` : 'No active file selected.'}
  
  GUIDELINES:
  - Be concise and direct.
  - Provide code snippets in markdown blocks.
  - Focus on the user's current context and questions.
  - If asked to modify code, provide the specific changes needed.
  `;

    const result = await streamText({
        model: openai('gpt-4o'),
        system: systemPrompt,
        messages: convertToCoreMessages(messages),
    });

    return result.toDataStreamResponse();
}
