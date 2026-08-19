import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useChatStore } from '../store/chatStore';
import { Bot, GraduationCap, User, Users, Briefcase } from 'lucide-react';

export function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, login: loginUser } = useAuthStore();
  const { setRole: setChatRole, clearMessages } = useChatStore();

  // Already logged in → go to dashboard
  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Registration failed');

      loginUser(data.token);

      // Sync chat store role
      const decoded = useAuthStore.getState().user;
      if (decoded?.role) setChatRole(decoded.role as any);
      clearMessages();

      // Redirect to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'student', label: 'Student', icon: GraduationCap, color: 'border-indigo-300 bg-indigo-50 text-indigo-700' },
    { value: 'parent', label: 'Parent', icon: User, color: 'border-blue-300 bg-blue-50 text-blue-700' },
    { value: 'teacher', label: 'Teacher', icon: Users, color: 'border-green-300 bg-green-50 text-green-700' },
    { value: 'principal', label: 'Principal', icon: Briefcase, color: 'border-purple-300 bg-purple-50 text-purple-700' },
  ];

  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4 min-h-0 overflow-y-auto">
      <div className="w-full max-w-md space-y-5 py-6">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Bot className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800">Create your account</h2>
          <p className="text-sm text-gray-500 mt-1">Join XYZ AI School Operating System</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your full name"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
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
              placeholder="Create a password"
              disabled={loading}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
            />
          </div>

          {/* Role selector — visual tiles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
            <div className="grid grid-cols-2 gap-2">
              {roles.map(r => {
                const Icon = r.icon;
                const isSelected = role === r.value;
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                      isSelected
                        ? r.color + ' border-current shadow-sm'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {r.label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password || !name}
            className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="text-indigo-600 hover:underline font-medium">Sign in</a>
        </p>
      </div>
    </div>
  );
}
