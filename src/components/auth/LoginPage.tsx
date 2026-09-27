import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Construct a synthetic email from the username
    const email = `${username}@your-app.local`;
    
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0f0f12]">
      <form onSubmit={handleLogin} className="p-8 bg-[#1e1e24] rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-2xl font-bold text-white mb-6">Login</h2>
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full p-3 mb-4 rounded bg-[#0f0f12] text-white border border-white/10"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 mb-6 rounded bg-[#0f0f12] text-white border border-white/10"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Logging in...' : 'Sign In'}
        </button>
      </form>
    </div>
  );
};
