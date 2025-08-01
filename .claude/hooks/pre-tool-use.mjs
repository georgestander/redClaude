#!/usr/bin/env node

import { readFileSync } from 'fs';

// Read the tool call JSON from stdin
const input = readFileSync(0, 'utf-8');
const toolCall = JSON.parse(input);

// Check if the tool call has the expected structure
if (!toolCall) {
  process.exit(0);
}

// The structure might be different - check both possible formats
const toolName = toolCall.tool?.name || toolCall.name;
if (!toolName) {
  process.exit(0);
}

// Check if this is a Write or Edit tool
if (toolName !== 'Write' && toolName !== 'Edit' && toolName !== 'MultiEdit') {
  process.exit(0);
}

// Get the content that will be written
let content = '';
const args = toolCall.tool?.args || toolCall.parameters || toolCall.args;

if (toolName === 'Write') {
  content = args?.content ?? '';
} else if (toolName === 'Edit') {
  content = args?.new_string ?? '';
} else if (toolName === 'MultiEdit') {
  // For MultiEdit, check all edits
  const edits = args?.edits ?? [];
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