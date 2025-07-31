#!/usr/bin/env node

import { readFileSync } from 'fs';

// Read the tool call JSON from stdin
const input = readFileSync(0, 'utf-8');
const toolCall = JSON.parse(input);

// Check if this is a Write or Edit tool
if (toolCall.tool.name !== 'Write' && toolCall.tool.name !== 'Edit' && toolCall.tool.name !== 'MultiEdit') {
  process.exit(0);
}

// Get the content that will be written
let content = '';
if (toolCall.tool.name === 'Write') {
  content = toolCall.tool.args?.content ?? '';
} else if (toolCall.tool.name === 'Edit') {
  content = toolCall.tool.args?.new_string ?? '';
} else if (toolCall.tool.name === 'MultiEdit') {
  // For MultiEdit, check all edits
  const edits = toolCall.tool.args?.edits ?? [];
  content = edits.map(edit => edit.new_string).join('\n');
}

// Check for forbidden patterns
const forbidden = /\/api\/|pages\/api|fetch\([`'"]\/api|getServerSideProps|app\/router/gi;

if (forbidden.test(content)) {
  console.error(JSON.stringify({
    error: '🚫 Detected /api‑style route or Next.js API usage. Rewrite with RedwoodSDK "use server" functions under /src/app/actions/.'
  }));
  process.exit(2); // Exit code 2 indicates a blocking error
}

// All good - allow the tool to proceed
process.exit(0);