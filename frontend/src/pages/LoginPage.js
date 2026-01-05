import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(username, password);
      toast.success('Login successful!');
      navigate('/app/dashboard');
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#f5f8f8] dark:bg-[#101f22] overflow-hidden">
      <div className="layout-container flex h-full grow flex-col">
        <main className="flex-1">
          <div className="flex min-h-screen">
            {/* Left Panel with Illustration */}
            <div className="hidden lg:flex w-1/2 items-center justify-center p-12 bg-[#25d1f4]/20 dark:bg-[#25d1f4]/10">
              <div className="w-full max-w-md">
                <div className="w-full bg-center bg-no-repeat bg-contain aspect-square rounded-none" style={{backgroundImage: 'url("https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=600")'}}></div>
              </div>
            </div>

            {/* Right Panel with Login Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
              <div className="flex flex-col max-w-md w-full gap-8">
                {/* Header */}
                <div className="text-center">
                  <h1 className="text-[#0d191c] dark:text-white tracking-tight text-3xl sm:text-4xl font-bold leading-tight">Welcome Back, Learner!</h1>
                  <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal pt-2">Your next learning adventure awaits.</p>
                </div>

                {/* Login Form Card */}
                <div className="bg-white dark:bg-[#101f22]/50 p-8 sm:p-10 rounded-xl shadow-lg dark:shadow-2xl dark:shadow-[#25d1f4]/10">
                  <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
                    <div className="flex flex-col">
                      <label className="flex flex-col">
                        <p className="text-[#0d191c] dark:text-slate-200 text-base font-medium leading-normal pb-2">Username</p>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xl">
                            👤
                          </span>
                          <input
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d191c] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#25d1f4]/50 border border-slate-200 dark:border-slate-700 bg-[#f5f8f8] dark:bg-slate-800 focus:border-[#25d1f4] h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-12 pr-4 py-3 text-base font-normal leading-normal"
                            placeholder="Enter your username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                          />
                        </div>
                      </label>
                    </div>

                    <div className="flex flex-col">
                      <label className="flex flex-col">
                        <p className="text-[#0d191c] dark:text-slate-200 text-base font-medium leading-normal pb-2">Password</p>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xl">
                            🔒
                          </span>
                          <input
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d191c] dark:text-white focus:outline-0 focus:ring-2 focus:ring-[#25d1f4]/50 border border-slate-200 dark:border-slate-700 bg-[#f5f8f8] dark:bg-slate-800 focus:border-[#25d1f4] h-14 placeholder:text-slate-400 dark:placeholder:text-slate-500 pl-12 pr-12 py-3 text-base font-normal leading-normal"
                            placeholder="Enter your password"
                            type={showPassword ? 'text' : 'password'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                          <button
                            aria-label="Show password"
                            className="text-slate-400 dark:text-slate-500 absolute right-4 top-1/2 -translate-y-1/2"
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            <span className="text-xl">{showPassword ? '👁️' : '👁️‍🗨️'}</span>
                          </button>
                        </div>
                      </label>
                      <Link className="text-sm text-[#25d1f4] hover:underline text-right mt-2 font-medium" to="/forgot-password">Forgot Password?</Link>
                    </div>

                    <button
                      className="flex items-center justify-center text-center font-bold text-white bg-[#25d1f4] hover:bg-[#25d1f4]/90 rounded-lg h-14 w-full transition-all duration-300 transform hover:scale-105"
                      type="submit"
                      disabled={loading}
                    >
                      {loading ? 'Signing In...' : "Let's Go!"}
                    </button>
                  </form>
                </div>

                {/* Divider & Socials */}
                <div className="flex flex-col gap-4">
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                    <span className="flex-shrink mx-4 text-sm text-slate-500 dark:text-slate-400">Or continue with</span>
                    <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button
                      aria-label="Continue with Google"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_102_1343)">
                          <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.45H18.05C17.78 15.93 16.91 17.21 15.54 18.1V20.72H19.25C21.36 18.84 22.56 15.83 22.56 12.25Z" fill="#4285F4"></path>
                          <path d="M12 23C14.97 23 17.45 22.04 19.25 20.72L15.54 18.1C14.52 18.77 13.31 19.14 12 19.14C9.11 19.14 6.64 17.28 5.76 14.77H1.94V17.39C3.72 20.71 7.55 23 12 23Z" fill="#34A853"></path>
                          <path d="M5.76 14.77C5.55 14.15 5.43 13.48 5.43 12.77C5.43 12.06 5.55 11.39 5.76 10.77V8.15H1.94C1.19 9.61 0.75 11.15 0.75 12.77C0.75 14.39 1.19 15.93 1.94 17.39L5.76 14.77Z" fill="#FBBC05"></path>
                          <path d="M12 6.38C13.44 6.38 14.81 6.89 15.83 7.86L19.33 4.35C17.45 2.61 14.97 1.54 12 1.54C7.55 1.54 3.72 3.83 1.94 7.15L5.76 9.77C6.64 7.26 9.11 5.38 12 5.38Z" fill="#EA4335"></path>
                        </g>
                        <defs>
                          <clipPath id="clip0_102_1343">
                            <rect fill="white" height="24" width="24"></rect>
                          </clipPath>
                        </defs>
                      </svg>
                    </button>
                    <button
                      aria-label="Continue with Apple"
                      className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <svg className="h-6 w-6 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15.228 9.944c.918-.016 2.063-1.42 2.11-2.475.034-1.04-.766-1.74-1.7-1.81-.95-.075-2.025 1.3-2.145 2.37-.112 1.054.766 1.915 1.735 1.915zm-2.28 10.022c.855 0 1.17-.51 2.22-.51.983 0 1.282.51 2.205.51.95 0 1.95-.945 2.595-2.61.832-2.144.18-4.32-.983-5.647-1.012-1.125-2.43-1.29-3.3-1.29-.983 0-2.078.21-3.21.21-1.117 0-2.325-.24-3.525-.24-.917 0-2.58.555-3.825 2.925-1.7 3.255-.333 7.95.967 10.335 1.117 2.01 2.445 3.09 4.095 3.045 1.5-.045 2.04-1.005 3.195-1.005.067-.015.067-.015.133-.015zM12.013 7.822c-.066-2.52-2.016-3.84-3.799-3.84-2.217 0-4.101 1.62-4.101 4.545 0 2.595 1.583 4.77 3.833 4.77.3 0 1.25-.33 1.983-1.2 1.084-1.305.95-3.27.084-4.275z"></path>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Sign Up Link */}
                <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                  Don't have an account? <Link className="font-semibold text-[#25d1f4] hover:underline" to="/register">Sign Up</Link>
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
