import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Bot, GraduationCap, User, Users, Briefcase } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { label: 'Rahul (Student)', email: 'rahul.student@xyz.edu', role: 'student', icon: GraduationCap, color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { label: 'Mr. Sharma (Parent)', email: 'parent1@xyz.edu', role: 'parent', icon: User, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Ms. Desai (Teacher)', email: 'priya.teacher@xyz.edu', role: 'teacher', icon: Users, color: 'bg-green-50 text-green-700 border-green-200' },
  { label: 'Principal', email: 'principal@xyz.edu', role: 'principal', icon: Briefcase, color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login: loginUser } = useAuthStore();
  const { setRole, clearMessages } = useChatStore();

  // Already logged in → go to my day
  if (user) return <Navigate to="/myday" replace />;

  const doLogin = async (emailVal: string, passVal: string) => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailVal, password: passVal }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Login failed');

      loginUser(data.token);

      // Sync chat store role
      const decoded = useAuthStore.getState().user;
      if (decoded?.role) setRole(decoded.role as any);
      clearMessages();

      // Redirect to My Day after login
      navigate('/myday');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const quickLogin = (account: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(account.email);
    setPassword('demo123');
    doLogin(account.email, 'demo123');
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 min-h-0 overflow-y-auto">
      <div className="w-full max-w-md space-y-5 py-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Bot className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Welcome to XYZ AI</h2>
          <p className="text-sm text-gray-500 mt-1">Intelligent School Operating System</p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Quick Login */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 text-center">Quick Demo Login</p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map(account => {
              const Icon = account.icon;
              return (
                <button
                  key={account.email}
                  onClick={() => quickLogin(account)}
                  disabled={loading}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all hover:shadow-sm disabled:opacity-50 ${account.color}`}
                >
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{account.label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">All demo accounts use password: <span className="font-mono">demo123</span></p>
        </div>

        <p className="text-center text-xs text-gray-500">
          Don't have an account?{' '}
          <a href="/register" className="text-indigo-600 hover:underline font-medium">Sign up</a>
        </p>
      </div>
    </div>
  );
}
