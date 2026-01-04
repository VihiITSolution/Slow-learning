import React from "react";
import { Link } from "react-router-dom";

export default function AdminDashboardPage() {
  return (
    <div className="font-display relative flex h-auto min-h-screen w-full flex-col bg-background-light dark:bg-background-dark">
      <div className="flex h-full w-full flex-1">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 flex flex-col p-4 bg-[#1E2A3A] border-r border-gray-800">
          <div className="flex items-center gap-3 p-3 mb-6">
            <div className="bg-primary flex items-center justify-center p-2 rounded-full">
              <span className="material-symbols-outlined text-white text-xl">school</span>
            </div>
            <h2 className="text-white text-base font-bold">EduGame</h2>
          </div>

          <nav className="flex flex-col gap-2 flex-1">
            <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors" to="#">
              <span className="material-symbols-outlined">dashboard</span>
              <p className="text-sm font-medium">Course Management</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors" to="#">
              <span className="material-symbols-outlined">folder</span>
              <p className="text-sm font-medium">Material Library</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors" to="#">
              <span className="material-symbols-outlined">group</span>
              <p className="text-sm font-medium">User Management</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary text-white" to="#">
              <span className="material-symbols-outlined fill" style={{fontVariationSettings: "'FILL' 1"}}>analytics</span>
              <p className="text-sm font-bold">Analytics</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors" to="#">
              <span className="material-symbols-outlined">leaderboard</span>
              <p className="text-sm font-medium">Leaderboard</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors" to="#">
              <span className="material-symbols-outlined">sports_esports</span>
              <p className="text-sm font-medium">Gamification</p>
            </Link>
          </nav>

          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg text-gray-300 hover:bg-gray-700/50 transition-colors mt-auto" to="#">
            <span className="material-symbols-outlined">settings</span>
            <p className="text-sm font-medium">Settings</p>
          </Link>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {/* Header */}
          <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <h1 className="text-2xl font-bold text-text-light dark:text-white">Welcome, Admin!</h1>
            <div className="flex items-center gap-4">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">search</span>
                <input
                  className="h-10 w-64 pl-10 pr-4 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-text-light dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Search..."
                  type="text"
                />
              </div>
              <div className="size-10 rounded-full bg-center bg-cover" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAufZJPHE6g7wrAgA1oBjeXgC1RACJs_Ur9oGEC9WenBczaQji6p5xTFfhpXImG6Dqx7AiyVZPAFoN1qHBOf7709wI1mgz0zX2PTBTbYKP8QiLaFS43lUsihizuaa019dS92-Jnr2gqLMtt6M2I9oE1LNCFTRLs5HOBAM1KTbofHO8NN5nUdLO3sMTtpqEjPxXqulQamNQXNvmZJJ_DSJBsVLVIDcCxLTlfIUY4ZZxcN_ru-h5mH5piPSMEeBYbLMFcgVJak8OgpV14")'}} />
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="flex-1 p-8 overflow-y-auto bg-background-light dark:bg-background-dark">
            {/* Stats */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <p className="text-[#333333] dark:text-gray-200 text-base font-medium">Total Learners</p>
                  <div className="size-8 rounded-lg flex items-center justify-center bg-teal-100 dark:bg-teal-900/50">
                    <span className="material-symbols-outlined text-teal-500 dark:text-teal-400 text-base">school</span>
                  </div>
                </div>
                <p className="text-[#333333] dark:text-white text-3xl font-bold">1,245</p>
                <p className="text-green-600 dark:text-green-500 text-sm font-medium">+5% this month</p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <p className="text-[#333333] dark:text-gray-200 text-base font-medium">Active Users Today</p>
                  <div className="size-8 rounded-lg flex items-center justify-center bg-orange-100 dark:bg-orange-900/50">
                    <span className="material-symbols-outlined text-orange-500 dark:text-orange-400 text-base">person</span>
                  </div>
                </div>
                <p className="text-[#333333] dark:text-white text-3xl font-bold">312</p>
                <p className="text-green-600 dark:text-green-500 text-sm font-medium">+12%</p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <p className="text-[#333333] dark:text-gray-200 text-base font-medium">Total Courses</p>
                  <div className="size-8 rounded-lg flex items-center justify-center bg-purple-100 dark:bg-purple-900/50">
                    <span className="material-symbols-outlined text-purple-500 dark:text-purple-400 text-base">book</span>
                  </div>
                </div>
                <p className="text-[#333333] dark:text-white text-3xl font-bold">89</p>
                <p className="text-green-600 dark:text-green-500 text-sm font-medium">+2 new</p>
              </div>

              <div className="flex flex-col gap-2 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center">
                  <p className="text-[#333333] dark:text-gray-200 text-base font-medium">Engagement Rate</p>
                  <div className="size-8 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/50">
                    <span className="material-symbols-outlined text-blue-500 dark:text-blue-400 text-base">trending_up</span>
                  </div>
                </div>
                <p className="text-[#333333] dark:text-white text-3xl font-bold">78%</p>
                <p className="text-red-500 text-sm font-medium">-1%</p>
              </div>
            </section>

            {/* Charts and Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Engagement Trend Chart */}
              <div className="lg:col-span-2 flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-[#333333] dark:text-white text-lg font-semibold">Engagement Trend</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Last 30 Days</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <p className="text-green-600 dark:text-green-500 text-sm font-medium">+3.2%</p>
                    <span className="material-symbols-outlined text-green-600 dark:text-green-500 text-base">arrow_upward</span>
                  </div>
                </div>
                <div className="h-64">
                  <svg className="w-full h-full" fill="none" preserveAspectRatio="none" viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 130 C31.25 130, 31.25 40, 62.5 40 C93.75 40, 93.75 80, 125 80 C156.25 80, 156.25 150, 187.5 150 C218.75 150, 218.75 60, 250 60 C281.25 60, 281.25 90, 312.5 90 C343.75 90, 343.75 170, 375 170 C406.25 170, 406.25 20, 437.5 20 C468.75 20, 468.75 100, 500 100" stroke="#4A90E2" strokeLinecap="round" strokeWidth="3" />
                    <path d="M0 130 C31.25 130, 31.25 40, 62.5 40 C93.75 40, 93.75 80, 125 80 C156.25 80, 156.25 150, 187.5 150 C218.75 150, 218.75 60, 250 60 C281.25 60, 281.25 90, 312.5 90 C343.75 90, 343.75 170, 375 170 C406.25 170, 406.25 20, 437.5 20 C468.75 20, 468.75 100, 500 100 V 200 H 0 Z" fill="url(#trendGradient)" />
                    <defs>
                      <linearGradient gradientUnits="userSpaceOnUse" id="trendGradient" x1="250" x2="250" y1="20" y2="200">
                        <stop stopColor="#4A90E2" stopOpacity="0.2" />
                        <stop offset="1" stopColor="#4A90E2" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* ML Insights Card */}
              <div className="flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg flex items-center justify-center bg-yellow-100 dark:bg-yellow-900/50">
                    <span className="material-symbols-outlined text-yellow-500 dark:text-yellow-400 text-base">model_training</span>
                  </div>
                  <p className="text-[#333333] dark:text-white text-lg font-semibold">ML-Based Insights</p>
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Our AI has identified a trend. Video-based materials have a 25% higher completion rate this quarter.</p>
                <Link className="mt-auto text-primary dark:text-blue-400 text-sm font-semibold hover:underline" to="#">View Full Report</Link>
              </div>

              {/* At-Risk Learners Table */}
              <div className="lg:col-span-3 flex flex-col gap-4 rounded-xl p-6 bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
                <p className="text-[#333333] dark:text-white text-lg font-semibold">At-Risk Learners</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">User Name</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Risk Level</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Last Active</th>
                        <th className="py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4 px-4 text-sm text-[#333333] dark:text-gray-200">Alex Morgan</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300">High</span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">12 days ago</td>
                        <td className="py-4 px-4 text-sm font-semibold text-primary dark:text-blue-400"><Link className="hover:underline" to="#">View Profile</Link></td>
                      </tr>
                      <tr className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-4 px-4 text-sm text-[#333333] dark:text-gray-200">Ben Carter</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300">Medium</span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">7 days ago</td>
                        <td className="py-4 px-4 text-sm font-semibold text-primary dark:text-blue-400"><Link className="hover:underline" to="#">View Profile</Link></td>
                      </tr>
                      <tr>
                        <td className="py-4 px-4 text-sm text-[#333333] dark:text-gray-200">Chloe Davis</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-300">Medium</span>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-500 dark:text-gray-400">6 days ago</td>
                        <td className="py-4 px-4 text-sm font-semibold text-primary dark:text-blue-400"><Link className="hover:underline" to="#">View Profile</Link></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
