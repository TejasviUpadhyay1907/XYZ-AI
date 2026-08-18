# Implementation Plan: NLU & Tool Contract System

## Context
The current XYZ AI School Assistant relies on brittle keyword-based intent detection, which severely limits its scalability, accuracy, and support for complex, nuanced queries. We need a structured NLU pipeline with formal entity extraction and strict function calling/tool contract patterns to enable reliable tool-based actions for attendance, escalations, and other school operations.

## Proposed Approach
1. **Define NLU System Architecture**: Introduce an `NLUService` to handle intent classification (e.g., using a lightweight ML model or structured prompt-based extraction) and entity extraction (NER).
2. **Implement Tool Registry & Contracts**: Create a registry of tools, each with a rigid JSON Schema interface.
3. **Orchestrator Refactor**: Update `orchestrator.js` to first pass the user message to the `NLUService`, which returns an intent + extracted entities.
4. **Tool Router**: Implement a router that matches the intent to a registered tool, maps entities to tool arguments, validates inputs against the schema, and executes the tool.

## Critical Files to Modify
- `backend/src/services/ai/NLUService.js` (NEW) - Handles intent & entity extraction
- `backend/src/services/ai/ToolRegistry.js` (NEW) - Manages tools and JSON schemas
- `backend/src/services/ai/orchestrator.js` - Refactor to use the new NLU/Router flow
- `backend/src/mockServices/*` - Potentially update to match new tool contract expectations

## Verification
- Create unit tests for `NLUService` with various test cases (attendance query, escalation request, homework query).
- Execute end-to-end tests: "Mark Rahul absent today" (Intent: `mark_attendance`, Entities: `rahul`, `absent`, `today`).
- Verify tool validation error handling (e.g., missing required argument).
