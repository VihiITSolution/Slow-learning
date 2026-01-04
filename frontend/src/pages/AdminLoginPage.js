import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add authentication logic here
    console.log("Admin login attempt:", { email, password });
  };

  return (
    <div className="font-display relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark overflow-x-hidden">
      <div className="flex h-full grow flex-col">
        <div className="px-4 flex flex-1 justify-center items-center py-10 md:py-20">
          <div className="flex flex-col w-full max-w-4xl flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 w-full bg-white dark:bg-slate-900/50 shadow-xl rounded-xl overflow-hidden">
              {/* Left side - Image */}
              <div className="hidden md:flex w-full h-full p-4">
                <div
                  className="w-full bg-center bg-no-repeat bg-cover rounded-lg"
                  data-alt="Abstract illustration with colorful geometric shapes representing learning and growth"
                  style={{
                    backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDmQbXvrOWONcC2fEuwkLcTpd-_sWO7IKT0jGPFdBDMordPgg4tBcob4eFbAejcD63w8mp4I4WMeRfw_FyFXQcSMED-og8HBxQzUPB4shJQFIUzpoK3Wt08gCaY1kmoZ6DaXCft86mOL_2vJILuucS3gel_iyplYYsw1mnMc_rmdYA0OFWDmBzZw4CA4lL5NbJRrXmwmRnGwJNv7IOBymFGXhn7o_6PX-myXTyHylCDcsTL2BkWOA28ZPjqbqJgzH2X6vUf8LVRC-Xy")',
                  }}
                />
              </div>

              {/* Right side - Login Form */}
              <div className="flex flex-col p-8 sm:p-12 justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary text-white flex items-center justify-center p-2 rounded-lg">
                    <span className="material-symbols-outlined !text-2xl">school</span>
                  </div>
                  <h2 className="text-xl font-bold text-text-light dark:text-text-dark">MicroLearn</h2>
                </div>

                <h1 className="text-text-light dark:text-text-dark tracking-tight text-[32px] font-bold leading-tight text-left pb-2">
                  Admin Portal
                </h1>
                <p className="text-text-light/70 dark:text-text-dark/70 text-base font-normal leading-normal pb-8">
                  Welcome back, please enter your details.
                </p>

                <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
                  <label className="flex flex-col w-full flex-1">
                    <p className="text-text-light dark:text-text-dark text-base font-medium leading-normal pb-2">
                      Email Address
                    </p>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 h-12 placeholder:text-text-light/50 dark:placeholder:text-text-dark/50 px-4 text-base font-normal leading-normal"
                      placeholder="Enter your email address"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </label>

                  <label className="flex flex-col w-full flex-1">
                    <p className="text-text-light dark:text-text-dark text-base font-medium leading-normal pb-2">
                      Password
                    </p>
                    <div className="flex w-full flex-1 items-stretch rounded-lg">
                      <input
                        className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 h-12 placeholder:text-text-light/50 dark:placeholder:text-text-dark/50 px-4 rounded-r-none border-r-0 pr-2 text-base font-normal leading-normal"
                        placeholder="Enter your password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-text-light/60 dark:text-text-dark/60 flex border border-border-light dark:border-border-dark bg-background-light dark:bg-slate-800 items-center justify-center px-4 rounded-r-lg border-l-0"
                      >
                        <span className="material-symbols-outlined">
                          {showPassword ? "visibility_off" : "visibility"}
                        </span>
                      </button>
                    </div>
                  </label>

                  <div className="flex w-full pt-6 justify-center">
                    <button
                      type="submit"
                      className="flex min-w-[84px] w-full cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-primary text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-primary/90 focus:ring-4 focus:ring-primary/30 transition-colors"
                    >
                      <span className="truncate">Admin Sign In</span>
                    </button>
                  </div>

                  <div className="flex py-4 justify-center">
                    <Link className="text-primary text-sm font-medium hover:underline" to="#">
                      Forgot Password?
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
