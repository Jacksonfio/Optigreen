import React, { useState } from 'react';
import { Leaf, ArrowRight, Cloud, Terminal, Lock, Mail } from 'lucide-react';
import Galaxy from './Galaxy';

interface LoginViewProps {
  onLoginSuccess: (email: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('sarah.chen@company.com');
  const [password, setPassword] = useState('••••••••••••');
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLoginSuccess(email);
  };

  return (
    <div className="bg-[#0A0A0A] text-[#E0E0E0] min-h-screen flex flex-col font-body relative overflow-hidden justify-center items-center p-6">
      {/* Soft Background Illustration & Gradient Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-80 z-0">
        <Galaxy
          mouseRepulsion={true}
          mouseInteraction={true}
          density={1.2}
          glowIntensity={0.6}
          saturation={0.8}
          hueShift={135}
          starSpeed={0.6}
          twinkleIntensity={0.4}
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#00FF41]/10 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-[#0A0A0A] to-transparent"></div>
      </div>

      <div className="w-full max-w-[480px] relative z-10">
        {/* Brand Logo Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-10 h-10 bg-[#00FF41] text-black rounded-xl flex items-center justify-center shadow-md">
              <Leaf className="w-6 h-6 fill-current" />
            </div>
            <h1 className="font-headline text-3xl font-bold text-white tracking-tight">
              OptiGreen
            </h1>
          </div>
          <p className="font-body text-sm text-[#A1A1AA] text-center">
            Accelerate your code, not the climate.
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-[#141414]/90 backdrop-blur-md rounded-2xl border border-[#2A2A2A] p-8 shadow-xl">
          <div className="mb-6">
            <h2 className="font-headline text-2xl font-bold text-white mb-1">Welcome back</h2>
            <p className="font-body text-xs text-[#A1A1AA]">
              Log in to manage your sustainable cloud workloads.
            </p>
          </div>

          {/* SSO Options */}
          <div className="grid grid-cols-1 gap-3 mb-6">
            <button
              onClick={() => onLoginSuccess('sarah.chen@google.com')}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 border border-[#4285F4]/40 rounded-xl bg-[#1A1A1A] hover:bg-[#252525] transition-all font-code text-xs font-semibold text-white shadow-xs group hover:border-[#4285F4]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => onLoginSuccess('sso.aws@company.com')}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 border border-[#2A2A2A] rounded-xl bg-[#1A1A1A] hover:bg-[#252525] transition-colors font-code text-xs font-semibold text-white shadow-xs"
            >
              <span className="material-symbols-outlined text-lg text-[#00FF41]">cloud_sync</span>
              <span>Continue with AWS SSO</span>
            </button>

            <button
              onClick={() => onLoginSuccess('github.devops@company.com')}
              className="flex items-center justify-center gap-2.5 w-full py-3 px-4 border border-[#2A2A2A] rounded-xl bg-[#1A1A1A] hover:bg-[#252525] transition-colors font-code text-xs font-semibold text-white shadow-xs"
            >
              <span className="material-symbols-outlined text-lg text-[#00FF41]">terminal</span>
              <span>Continue with GitHub</span>
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-grow bg-[#2A2A2A]"></div>
            <span className="font-code text-[10px] text-[#A1A1AA] uppercase tracking-widest">
              OR USE EMAIL
            </span>
            <div className="h-px flex-grow bg-[#2A2A2A]"></div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-code text-xs font-medium text-[#A1A1AA] mb-1.5" htmlFor="email">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] text-white focus:border-[#00FF41] outline-none transition-all font-body text-xs"
                placeholder="name@company.com"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="font-code text-xs font-medium text-[#A1A1AA]" htmlFor="password">
                  Password
                </label>
                <a href="#" className="font-code text-xs text-[#3B82F6] hover:underline">
                  Forgot password?
                </a>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] text-white focus:border-[#00FF41] outline-none transition-all font-body text-xs"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-[#2A2A2A] bg-[#1A1A1A] text-[#00FF41] focus:ring-[#00FF41]"
              />
              <label htmlFor="remember" className="font-body text-xs text-[#A1A1AA]">
                Remember this device for 30 days
              </label>
            </div>

            <div className="p-3 bg-[#00FF41]/10 border border-[#00FF41]/20 rounded-xl my-4 text-center">
              <span className="font-code text-[11px] text-[#00FF41] font-semibold">
                🌿 Hackathon Judge Access: Demo credentials pre-filled.
              </span>
            </div>

            <button
              type="submit"
              className="w-full bg-[#00FF41] text-black py-3.5 px-4 rounded-xl font-code text-xs font-bold hover:bg-[#00e038] transition-all flex items-center justify-center gap-2 shadow-xs mt-2"
            >
              <span>Enter Live Operations Dashboard (1-Click Access)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="font-body text-xs text-[#A1A1AA]">
              New to OptiGreen?{' '}
              <a href="#" className="text-[#00FF41] font-bold hover:underline">
                Create an organization
              </a>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <footer className="mt-8 flex justify-center gap-6 font-code text-xs text-[#A1A1AA]">
          <a href="#" className="hover:text-[#00FF41] transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-[#00FF41] transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-[#00FF41] transition-colors">
            Trust Center
          </a>
        </footer>
      </div>
    </div>
  );
};
