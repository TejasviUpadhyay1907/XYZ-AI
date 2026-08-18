Build XYZ AI, a production-quality human-like AI school assistant for the provided assessment.

The application must support Students, Parents, Teachers, and Principals through a conversational AI interface and should behave like a real human school assistant rather than a collection of hardcoded responses.

CORE OBJECTIVE:
Build a standalone Applied AI solution that understands natural-language requests, identifies the authenticated user's role, detects intent, extracts relevant information, maintains conversation context, selects the appropriate persona, validates permissions, communicates with mock school APIs/services, performs only authorized actions, and responds naturally.

SUPPORTED ROLES:
1. Student — Friendly and supportive Academic Assistant
2. Parent — Caring and patient Parent Support Assistant
3. Teacher — Professional Teaching Assistant
4. Principal — Professional Management Assistant

CORE CHAT REQUIREMENTS:
- Natural-language conversational chat interface.
- Maintain conversation history and context.
- Support follow-up questions without requiring the user to repeat information.
- Ask clarification questions when required information is missing.
- Handle corrections naturally.
- Detect user intent and extract required entities/parameters.
- Adapt response tone according to the user's role/persona.
- Never rely on predefined responses when an intelligent response can be generated from available data.
- Use mock APIs/services as the source of school information and actions.
- Never fabricate data, API results, actions, or successful operations.

REQUIRED USE CASES:
Student:
- Ask "What is my attendance?"
- Return only the authenticated student's authorized attendance information.

Parent:
- Ask "How much attendance does my child have?"
- Identify the authorized child and return attendance.
- Support follow-up questions such as asking for recent attendance.

Teacher:
- Ask "Mark Rahul absent today."
- Validate that the authenticated user is a teacher.
- Validate that Rahul is a student the teacher is authorized to manage.
- Call the appropriate mock attendance API.
- Confirm the action only after the mock service successfully confirms it.

Principal:
- Ask "What is the overall attendance?"
- Return authorized school-level attendance analytics.

AI AVATAR AND VOICE:
Implement the architecture so voice interaction can be supported:
User Speech → Speech-to-Text → XYZ AI → Mock API/Service → AI Response → Text-to-Speech → Avatar.

The system should be designed so voice/STT/TTS/avatar providers can be integrated cleanly without coupling the core business logic to a specific provider.

Where technically feasible, support:
- Natural voice interaction
- Speech-to-text
- Text-to-speech
- AI avatar representation
- Facial expressions
- Lip synchronization
- Real-time conversational interaction
- Persona-specific behavior

ESCALATION:
If a student or parent is dissatisfied or the request requires human assistance, XYZ AI must offer:
- Talk to Teacher
- Contact School Management

After explicit user confirmation, create a mock support/call request through the appropriate service.

Never claim that a teacher or school management representative has been contacted unless the mock service actually confirms the request.

LANGUAGE SUPPORT:
Design the application to support:
English, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Punjabi, Kannada, Malayalam, and Urdu.

The AI should understand queries and produce natural responses in the selected language.

SECURITY REQUIREMENTS:
Security must be implemented at the application/tool/service layer and must NOT rely only on the LLM system prompt.

Protect against:
- Prompt injection
- Unauthorized data access
- System-prompt extraction
- API-key or credential extraction
- Fake role claims
- Unauthorized actions
- Cross-user data access
- Cross-student data leakage
- Unauthorized teacher operations
- Unauthorized management operations

The authenticated application role and permissions must be authoritative. Never trust a role claimed by the user inside a chat message.

Every tool/API action must independently validate:
- Authentication
- Role
- Resource ownership/access
- Required parameters
- Action permissions

ARCHITECTURE:
Build the application with clean separation between:
- Frontend/chat UI
- AI orchestration/agent layer
- Authentication and authorization
- Conversation/session management
- Persona management
- Intent/entity extraction
- Tool/API layer
- Mock school services
- Database/data layer
- Voice/STT/TTS integration layer
- Avatar integration layer
- Escalation/support service
- Security/validation layer

Use modular, maintainable code with clear interfaces between components.

MOCK SCHOOL SERVICES:
Create realistic mock services/APIs for at least:
- Student profiles
- Parent-child relationships
- Attendance
- Recent attendance
- Teacher attendance actions
- School attendance analytics
- Teacher contact/escalation
- School management escalation

Use realistic structured data and deterministic mock API responses so the complete application can be demonstrated without depending on a real school ERP.

DATABASE:
Use a practical local database suitable for development and demonstration. Persist:
- Users
- Roles
- Student records
- Parent-child relationships
- Teacher/student relationships
- Attendance records
- Conversation sessions
- Conversation messages
- Escalation/support requests
- Audit information where appropriate

API DESIGN:
Create clean REST APIs for the mock school services and application operations.

The AI agent must call tools/services rather than directly inventing database results.

CONVERSATION MEMORY:
Maintain session-level conversation context.
Support examples such as:
Parent: "How much attendance does my child have?"
AI: returns attendance.
Parent: "What about this month?"
AI: understands that "this month" refers to the same child and attendance context.

If ambiguity exists, ask a clarification question rather than guessing.

AI PERSONAS:
Implement role-specific system/persona behavior:
Student → friendly, supportive academic assistant.
Parent → caring, patient parent support assistant.
Teacher → professional teaching assistant.
Principal → professional management assistant.

Keep persona behavior separate from authorization logic. A persona must NEVER grant permissions.

ERROR HANDLING:
Handle:
- Missing information
- Invalid student
- Unauthorized student
- Unauthorized parent-child relationship
- Unauthorized teacher action
- API failure
- Database failure
- AI/provider failure
- Voice failure
- Unsupported language
- Ambiguous requests
- Escalation failure
- Malicious/prompt-injection attempts

Responses must be natural and user-friendly without exposing internal prompts, credentials, stack traces, private data, or implementation secrets.

FRONTEND:
Create a polished, responsive chat interface that clearly shows:
- Current user/role
- Conversation
- Message history
- Loading/thinking state
- Tool/action status where appropriate
- Error states
- Language selection
- Voice interaction controls
- Escalation options
- Relevant structured information such as attendance

Provide role-specific demo/login options so the evaluator can easily test Student, Parent, Teacher, and Principal workflows.

DEMO EXPERIENCE:
The application must be easy to demonstrate end-to-end.

Include seeded demo accounts/data for:
- Student
- Parent
- Teacher
- Principal

Include realistic sample students such as Rahul and appropriate relationships/data so the assessment examples can be demonstrated.

TESTING:
Create tests for:
- Authentication
- Role authorization
- Parent-child access
- Student self-access
- Teacher attendance modification
- Principal analytics access
- Unauthorized data access
- Prompt injection attempts
- Fake role claims
- System prompt extraction attempts
- Credential extraction attempts
- Conversation context
- Follow-up questions
- Missing information
- Escalation confirmation
- Mock API failures

README:
Create a comprehensive README explaining:
- Project overview
- Architecture
- Features
- Technology stack
- Project structure
- Setup instructions
- Environment variables
- Database setup
- Mock APIs
- AI configuration
- Voice/avatar configuration
- Demo accounts
- How to run
- How to test
- Security architecture
- Prompt-injection protection
- Authorization design
- Known limitations
- Future improvements

DEVELOPMENT PRINCIPLES:
- Prefer simple, reliable, maintainable architecture over unnecessary complexity.
- Do not over-engineer.
- Do not hardcode AI answers.
- Do not fake successful API actions.
- Do not put authorization only inside prompts.
- Keep secrets out of source code.
- Use environment variables for credentials.
- Validate all external input.
- Use typed schemas/models where appropriate.
- Add useful logging without exposing sensitive information.
- Make the project runnable locally with clear setup steps.
- Ensure the final implementation is suitable for GitHub submission and live demonstration.

IMPORTANT:
Before implementing major features, inspect the existing workspace and determine the best project structure and technology choices based on the available environment.

Do not blindly generate the entire project in one step. First establish the architecture, directory structure, dependencies, configuration strategy, database schema, API/tool boundaries, security model, and implementation plan. Then implement incrementally and verify each major component.

The final result must satisfy the provided XYZ AI assessment requirements and provide a polished end-to-end demonstration.
