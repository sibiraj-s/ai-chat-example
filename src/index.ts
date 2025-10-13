import fs from 'node:fs/promises';
import path from 'node:path';
import { Message, PrismaClient, Role } from '@prisma/client';
import { anthropic } from '@ai-sdk/anthropic';
import { ModelMessage, stepCountIs, streamText, tool } from 'ai';
import { question, required } from '@topcli/prompts';
import { z } from 'zod';

const db = new PrismaClient();
await db.$connect();

const rulesPath = path.join(import.meta.dirname, 'rules.txt');
const rules = await fs.readFile(rulesPath, 'utf-8');
const model = anthropic('claude-3-5-haiku-latest');

// create a new conversation every time the script is run
const conversation = await db.chat.create({ data: {} });
console.log('Starting new conversation:', conversation.id);

const conversationIdTool = tool({
  description: 'Get the id of the current conversation',
  inputSchema: z.object({}),
  execute: async () => {
    await new Promise((resolve) => setTimeout(resolve, 100)); // simulate some delay,
    // in practical scenarios, this can be an async api call
    return conversation.id;
  },
});

// convert a prisma message to a core message
const toModelMessages = (messages: Message[]): ModelMessage[] => {
  const coreMessages = messages.map((message) => {
    const coreMessage = {
      role: message.role,
      content: message.content,
    };

    return coreMessage as ModelMessage;
  });

  return coreMessages;
};

const askAi = async (question: string) => {
  const messages = await db.message.findMany({
    where: {
      chatId: conversation.id,
    },
  });

  const previousMessages = toModelMessages(messages);
  const newMessage: ModelMessage = {
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
    stopWhen: stepCountIs(10),
    tools: {
      conversationId: conversationIdTool,
    },
    system: rules,
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
