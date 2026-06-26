import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

function AdminLogin({ onLogin, isDark }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': password
        }
      });

      if (response.ok) {
        // Store the token securely in session storage (not localStorage for security)
        sessionStorage.setItem('adminToken', password);
        onLogin(true);
      } else {
        const data = await response.json();
        setError(data.detail || 'Invalid credentials');
      }
    } catch {
      setError('Connection failed. Please check if the server is running');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="bg-card border border-border rounded-2xl p-8 shadow-xl max-w-md w-full mx-4 relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-brand-500/10 blur-[60px] rounded-full mix-blend-multiply dark:mix-blend-screen opacity-50 dark:opacity-40" />
        
        <div className="text-center mb-8 relative z-10">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Admin Access</h1>
          <p className="text-foreground/60 mt-2 font-medium">Enter administrator password to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10">
          <div className="mb-6">
            <label className="block text-sm font-bold text-foreground/80 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border-2 rounded-xl text-base bg-background border-border text-foreground placeholder-foreground/40 focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition-all font-medium"
              placeholder="Enter admin password"
              autoFocus
              required
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 font-medium text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3 px-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-500 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Verifying...
              </span>
            ) : (
              'Access Dashboard'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium relative z-10">
          <a href="/" className="text-foreground/40 hover:text-brand-500 transition-colors">← Back to Assessment</a>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
