import { evalite } from 'evalite';
import { Levenshtein } from 'autoevals';

// mock test
evalite('Eval', {
  // A set of data to test
  data: async () => {
    return [{ input: 'Hello', expected: 'Hello I am an AI assistant!' }];
  },
  // The task to perform, usually to call a LLM.
  task: async (input) => {
    return input + ' I am an AI assistant!';
  },
  // Some methods to score the eval
  scorers: [
    // For instance, Levenshtein distance measures
    // the similarity between two strings
    Levenshtein,
  ],
});
