import { describe, expect, it } from 'vitest';
import { Levenshtein } from 'autoevals';

// mock test
describe('Eval', () => {
  // A set of data to test
  const data = [{ input: 'Hello', expected: 'Hello I am an AI assistant!' }];

  // The task to perform, usually to call a LLM.
  const task = async (input: string) => {
    return input + ' I am an AI assistant!';
  };

  it.each(data)('$input', async ({ input, expected }) => {
    const output = await task(input);

    // Levenshtein distance measures the similarity between two strings
    const { score } = await Levenshtein({ output, expected });

    expect(score).toBeGreaterThanOrEqual(0.8);
  });
});
