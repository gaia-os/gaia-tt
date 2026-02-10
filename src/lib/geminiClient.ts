import { GoogleGenerativeAI, Part, Content } from '@google/generative-ai';
import { TechTree, ChatMessage } from './types';
import { TOPICS, TopicKey } from './topicConfig';

// Helper function to convert a File to a base64 string for Gemini API
const fileToGenerativePart = async (file: File): Promise<Part> => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: {
      data: await base64EncodedDataPromise,
      mimeType: file.type,
    },
  };
};

export class GeminiChatClient {
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async sendMessage(
    message: string,
    context: TechTree,
    chatHistory: ChatMessage[] = [],
    topic: TopicKey, // NEW: Accept topic parameter
    file?: File,
  ): Promise<string> {
    if (!message?.trim() && !file) {
      throw new Error('Message or file is required');
    }

    // Get topic-specific configuration
    const topicConfig = TOPICS[topic];
    if (!topicConfig) {
      throw new Error(`Invalid topic: ${topic}`);
    }

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
    });

    // Build the user's prompt parts, starting with the text message
    const userParts: Part[] = [{ text: message }];

    // If a file is provided, convert it to a generative part and add to the prompt
    if (file) {
      try {
        console.log('Processing file...');
        const filePart = await fileToGenerativePart(file);
        userParts.push(filePart);
        console.log('File processed successfully.');
      } catch (error) {
        console.error('Error processing file:', error);
        throw new Error('Failed to read the PDF file.');
      }
    }

    // Build context string from nodes and edges
    const nodesContext = context.nodes
      .map((node) => {
        const references = Array.isArray(node.data.references)
          ? node.data.references
          : [];
        const referencesBlock =
          references.length > 0
            ? `\n      - References:\n${references
                .map((ref, i) => `        ${i + 1}. ${ref}`)
                .join('\n')}`
            : '';
        return `Node: ${node.data.label} (${node.data.nodeLabel})
      - ID: ${node.id}
      - Category: ${node.data.category || 'N/A'}
      - TRL Current: ${node.data.trl_current || 'N/A'}
      - Description: ${
        node.data.detailedDescription ||
        node.data.description ||
        'No description available'
      }${referencesBlock}`;
      })
      .join('\n\n');

    const edgesContext = context.edges
      .map((edge) => {
        return `Edge: ${edge.source} → ${edge.target}`;
      })
      .join('\n');

    // Use topic-specific system prompt from config
    const systemPrompt = `${topicConfig.systemPrompt}

Here is the current Tech Tree context for ${topicConfig.label}:

NODES:
${nodesContext}

EDGES (Dependencies):
${edgesContext}

PRESENT YOUR OUTPUT SUGGESTIONS IN THE FOLLOWING FORMAT:

<h2 class="text-xl font-semibold mb-4 text-gray-900">Analysis Results</h2>
<p class="mb-4 text-gray-700 leading-relaxed">Your introduction paragraph here...</p>

<h3 class="text-lg font-medium mb-3 mt-6 text-gray-800">Suggested Additions</h3>
<ul class="list-disc list-inside mb-4 space-y-3 text-gray-700">
  <li class="mb-2">
    <strong>Technology Name:</strong>
    <p class="ml-6 mt-1">Description of the technology...</p>
    <p class="ml-6 mt-1"><strong>TRL Current:</strong> 3-4</p>
    <p class="ml-6 mt-1"><strong>Dependencies:</strong> node_id_1, node_id_2</p>
  </li>
</ul>

<h3 class="text-lg font-medium mb-3 mt-6 text-gray-800">Technical Explanations</h3>
<ul class="list-disc list-inside mb-4 space-y-2 text-gray-700">
  <li><strong>Term:</strong> Definition and explanation...</li>
</ul>

Remember: Format everything as HTML with proper tags and spacing. No plain text or markdown formatting.`;

    // Build conversation history for context
    const conversationHistory: Content[] = chatHistory.map((msg) => ({
      role: msg.type === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    try {
      // Create the content array with system prompt, conversation history, and current message
      const contents: Content[] = [
        {
          role: 'user',
          parts: [{ text: systemPrompt }],
        },
        ...conversationHistory,
        {
          role: 'user',
          parts: userParts,
        },
      ];

      const result = await model.generateContent({
        contents,
        generationConfig: {
          maxOutputTokens: 2000,
          temperature: 0.3,
        },
      });

      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate response from Gemini');
    }
  }
}