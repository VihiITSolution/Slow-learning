import React from "react";

export default function QuizPage() {
  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-800 dark:text-slate-200 min-h-screen flex items-center justify-center p-4 md:p-8">
      {/* Header Section */}
      <div className="w-full max-w-4xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl">calculate</span>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Basic Algebra</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex cursor-pointer items-center justify-center rounded-lg h-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 gap-2 text-sm font-bold min-w-0 px-3">
              <span className="material-symbols-outlined text-yellow-400">star</span>
              <span>1,250 XP</span>
            </div>
          </div>
        </div>

        <main className="flex w-full max-w-2xl flex-1 flex-col items-center justify-center py-8 mx-auto">
          {/* Progress Bar */}
          <div className="w-full px-4 mb-6">
            <div className="flex justify-between mb-1">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Progress</p>
              <p className="text-sm font-bold text-primary">60%</p>
            </div>
            <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700">
              <div className="h-2.5 rounded-full bg-primary" style={{ width: "60%" }} />
            </div>
          </div>

          {/* Question Card */}
          <div className="relative w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 pt-12 text-center shadow-lg">
            {/* Timer */}
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex h-16 w-16 items-center justify-center rounded-full border-4 border-white dark:border-slate-900 bg-primary">
              <span className="text-white text-xl font-bold">25</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">What is the value of X in the equation 2X = 10?</h2>
          </div>

          {/* Answer Options */}
          <div className="mt-8 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition-all hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-lg group-hover:bg-primary/20 group-hover:text-primary transition-colors">A</div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">3</h3>
            </div>

            <div className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-correct bg-correct/10 p-4 shadow-lg ring-4 ring-correct/20 transition-all">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-correct text-white font-bold text-lg">B</div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">5</h3>
              <div className="ml-auto text-correct">
                <span className="material-symbols-outlined text-3xl">check_circle</span>
              </div>
              <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-correct px-2 py-0.5 text-xs font-bold text-white">
                <span className="material-symbols-outlined text-sm">star</span>
                <span>+10 XP</span>
              </div>
            </div>

            <div className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-incorrect bg-incorrect/10 p-4 shadow-sm transition-all">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-incorrect text-white font-bold text-lg">C</div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">8</h3>
              <div className="ml-auto text-incorrect">
                <span className="material-symbols-outlined text-3xl">cancel</span>
              </div>
            </div>

            <div className="group flex cursor-pointer items-center gap-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm transition-all hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-lg group-hover:bg-primary/20 group-hover:text-primary transition-colors">D</div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">10</h3>
            </div>
          </div>

          {/* Feedback and CTA */}
          <div className="mt-8 w-full flex flex-col items-center gap-4">
            <div className="flex flex-col items-center justify-center rounded-lg bg-correct/10 p-4 text-center text-correct">
              <p className="font-bold">Great job!</p>
              <p className="text-sm">You've earned 10 XP.</p>
            </div>
            <button className="flex w-full max-w-xs cursor-pointer items-center justify-center rounded-xl bg-primary h-12 px-6 text-base font-bold text-white shadow-lg shadow-primary/30 transition-transform hover:scale-105">Continue</button>
          </div>
        </main>
      </div>
    </div>
  );
}
