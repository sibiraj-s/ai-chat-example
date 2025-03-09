# AI Chat Demo

This is a simple AI-powered chat application that runs in the command line interface (CLI). It's built using Vercel's AI SDK and Anthropic's Claude models, providing an interactive conversational experience directly in the terminal.

The conversations are stored in a local postgres database.

## Requirements

- Node.js 18+
- npm
- docker
- Anthropic API key

## Setup

Clone the repo

```bash
git clone https://github.com/sibiraj-s/ai-chat
```

Install dependencies

```bash
npm install
```

Copy the `.env.example` file to `.env` and add your Anthropic API key

```bash
cp .env.example .env
```

Start the docker container

```bash
make db
```

Run the app

```bash
npx tsx src/index.ts
```
