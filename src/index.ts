import { Message, PrismaClient, Role } from '@prisma/client';
import { anthropic } from '@ai-sdk/anthropic';
import { CoreMessage, streamText, tool } from 'ai';
import { question, required } from '@topcli/prompts';
import { z } from 'zod';

const db = new PrismaClient();
await db.$connect();

const model = anthropic('claude-3-5-haiku-latest');

// create a new conversation every time the script is run
const conversation = await db.chat.create({ data: {} });
console.log('Starting new conversation:', conversation.id);

const conversationIdTool = tool({
  description: 'Get the id of the current conversation',
  parameters: z.object({}),
  execute: async () => {
    // in practical scenarios, this can be an async api call
    return conversation.id;
  },
});

// convert a prisma message to a core message
const toCoreMessages = (messages: Message[]): CoreMessage[] => {
  const coreMessages = messages.map((message) => {
    const coreMessage = {
      role: message.role,
      content: message.content,
    };

    return coreMessage as CoreMessage;
  });

  return coreMessages;
};

const askAi = async (question: string) => {
  const messages = await db.message.findMany({
    where: {
      chatId: conversation.id,
    },
  });

  const previousMessages = toCoreMessages(messages);
  const newMessage: CoreMessage = {
    role: 'user',
    content: question,
  };

  await db.message.create({
    data: {
      chatId: conversation.id,
      role: Role.user,
      content: question,
    },
  });

  const { textStream } = streamText({
    model,
    messages: [...previousMessages, newMessage],
    maxSteps: 10,
    tools: {
      conversationId: conversationIdTool,
    },
    system:
      `You are a helpful assistant.` +
      `You need to answer the question in a concise and to the point manner.` +
      `You need to answer the question in a way that is easy to understand.` +
      'You need to handle only text messages and return only text messages.' +
      'You can use only the tools provided to you.',
  });

  let answer = '';
  for await (const chunk of textStream) {
    process.stdout.write(chunk);
    answer += chunk;
  }

  await db.message.create({
    data: {
      chatId: conversation.id,
      role: Role.assistant,
      content: answer,
    },
  });

  return answer;
};

for (;;) {
  console.log('\n');
  const prompt = await question('>>', {
    validators: [required()],
  });

  await askAi(prompt);
}
