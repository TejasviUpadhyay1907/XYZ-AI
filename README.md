# XYZ AI School Assistant

An intelligent AI assistant for school communities supporting students, parents, teachers, and principals with multilingual capabilities, voice interaction, and secure access to school information.

## Features

- **Multi-role Support**: Tailored experiences for Students, Parents, Teachers, and Principals
- **Multilingual**: Supports 11 languages including English, Hindi, Tamil, Telugu, Marathi, Bengali, Gujarati, Punjabi, Kannada, Malayalam, and Urdu (with RTL support)
- **Voice Interaction**: Speech-to-Text input and Text-to-Speech responses
- **Persistent Conversations**: Remembers conversation history using SQLite storage
- **Secure Authentication**: JWT-based role-based access control
- **Mock School Services**: 
  - Attendance tracking and analytics
  - Student profile management
  - Teacher-to-parent escalation system
  - School-wide reporting
- **Enhanced UI**: Typing indicators and suggestion chips for better user experience
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Frontend
- React 18 + Vite + TypeScript
- Tailwind CSS for styling
- Zustand for state management
- Lucide React for icons
- Speech Recognition & Speech Synthesis APIs for voice features

### Backend
- Node.js + Express.js
- SQLite database with better-sqlite3
- JWT authentication
- Modular service architecture
- Mock data services for school information

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd xyz-ai/backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

### Environment Variables

Create a `.env` file in the backend directory:
```
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
```

### Running the Application

1. Start the backend server:
   ```bash
   cd xyz-ai/backend
   npm run dev
   ```

2. Start the frontend development server:
   ```bash
   cd xyz-ai/frontend
   npm run dev
   ```

3. Open your browser to `http://localhost:5173` (or the URL shown in the terminal)

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and receive JWT token
- `GET /api/auth/me` - Get current user profile

### Chat
- `POST /api/chat` - Send a message and get AI response
  - Requires authentication
  - Body: `{ sessionId, language, message }`
- `GET /api/chat/history` - Get conversation history for a session
- `GET /api/chat/sessions` - Get all sessions for current user

## Role-Based Access

Each role has access to specific functionalities:

### Student
- View personal attendance
- Get homework help
- Academic assistance

### Parent
- View children's attendance
- Communicate with teachers
- Escalate concerns to teachers
- Academic progress updates

### Teacher
- Mark student attendance
- View class attendance
- Lesson planning assistance
- Escalate to management
- Parent communication

### Principal
- School-wide analytics
- Attendance monitoring
- Teacher and staff management
- Generate reports

## Multilingual Support

The assistant supports 11 languages:
- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Marathi (mr)
- Bengali (bn)
- Gujarati (gu)
- Punjabi (pa)
- Kannada (kn)
- Malayalam (ml)
- Urdu (ur) - Right-to-left supported

Language can be changed via the dropdown in the header, and the preference is saved in localStorage.

## Voice Features

- **Speech-to-Text**: Click the microphone icon in the chat input to speak your message
- **Text-to-Speech**: Assistant responses are automatically spoken in the selected language
- Requires HTTPS or localhost for browser permissions

## Database Schema

The SQLite database includes:
- `users` table: Stores user information and hashed passwords
- `sessions` table: Conversation sessions with metadata
- `messages` table: Individual messages in conversations
- Mock data tables for attendance, students, etc.

## Security

- JWT authentication for all API routes
- Passwords hashed with bcrypt
- Role-based authorization middleware
- Input validation and sanitization
- Session persistence with automatic cleanup

## Development

### Backend
- `npm run dev` - Start server with nodemon
- `npm test` - Run tests (to be implemented)

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Deployment

For production deployment:
1. Build frontend: `npm run build` in frontend directory
2. Serve static files from backend (already configured in server.js)
3. Set environment variables appropriately
4. Use a process manager like PM2 or Docker

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a pull request

## License

MIT

## Acknowledgments

- Inspired by educational AI assistants
- Built with modern web technologies
- Thanks to the open-source community