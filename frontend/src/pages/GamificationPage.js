import React from "react";
import { Link } from "react-router-dom";

export default function GamificationPage() {
  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark min-h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="sticky top-0 z-50 w-full border-b border-border-light dark:border-border-dark bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="text-primary size-7">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M39.475 21.6262C40.358 21.4363 40.6863 21.5589 40.7581 21.5934C40.7876 21.655 40.8547 21.857 40.8082 22.3336C40.7408 23.0255 40.4502 24.0046 39.8572 25.2301C38.6799 27.6631 36.5085 30.6631 33.5858 33.5858C30.6631 36.5085 27.6632 38.6799 25.2301 39.8572C24.0046 40.4502 23.0255 40.7407 22.3336 40.8082C21.8571 40.8547 21.6551 40.7875 21.5934 40.7581C21.5589 40.6863 21.4363 40.358 21.6262 39.475C21.8562 38.4054 22.4689 36.9657 23.5038 35.2817C24.7575 33.2417 26.5497 30.9744 28.7621 28.762C30.9744 26.5497 33.2417 24.7574 35.2817 23.5037C36.9657 22.4689 38.4054 21.8562 39.475 21.6262ZM4.41189 29.2403L18.7597 43.5881C19.8813 44.7097 21.4027 44.9179 22.7217 44.7893C24.0585 44.659 25.5148 44.1631 26.9723 43.4579C29.9052 42.0387 33.2618 39.5667 36.4142 36.4142C39.5667 33.2618 42.0387 29.9052 43.4579 26.9723C44.1631 25.5148 44.659 24.0585 44.7893 22.7217C44.9179 21.4027 44.7097 19.8813 43.5881 18.7597L29.2403 4.41187C27.8527 3.02428 25.8765 3.02573 24.2861 3.36776C22.6081 3.72863 20.7334 4.58419 18.8396 5.74801C16.4978 7.18716 13.9881 9.18353 11.5858 11.5858C9.18354 13.988 7.18717 16.4978 5.74802 18.8396C4.58421 20.7334 3.72865 22.6081 3.36778 24.2861C3.02574 25.8765 3.02429 27.8527 4.41189 29.2403Z" fillRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg font-bold">LearnSphere</h2>
            </div>

            <div className="hidden md:flex items-center gap-9">
              <Link className="text-sm font-medium hover:text-primary transition-colors" to="#">Dashboard</Link>
              <Link className="text-sm font-medium text-primary border-b-2 border-primary" to="#">Adventure</Link>
              <Link className="text-sm font-medium hover:text-primary transition-colors" to="#">Profile</Link>
            </div>

            <div className="flex items-center gap-4">
              <button className="flex cursor-pointer items-center justify-center rounded-xl h-10 w-10 bg-primary/20 dark:bg-primary/30 text-text-light dark:text-text-dark hover:bg-primary/40 transition-colors">
                <span className="material-symbols-outlined">notifications</span>
              </button>
              <div
                className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
                data-alt="User avatar image"
                style={{
                  backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuDD5vbfMY0aeUJ9WL7E9UiJgI1_Vd0ki6JQfTKHtHK0JMLCIUW2g0-6R37WrYgcsNYs6wPkUDpK1cw8mlw_2C3rpeH6tgYV1iSJAtXhsOhNEy7PKLekgRe46DTOjPAzGl97JEJepfmvBN7uY3pufIEAjtuuJlypdwQhYLy6Gn_jowIhl6Ypln5nHG6lE_qnZRX7sfqHUfX5JYX7zUSLNs5mIILRdB_jhZL07-hE9AV6IDtwZv8WoMeO6wATb0c-dhkBFjkzHyLnf5Ze")',
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          {/* PageHeading */}
          <div className="mb-8">
            <h1 className="text-4xl font-black tracking-tighter">Your Adventure</h1>
            <p className="text-text-muted-light dark:text-text-muted-dark text-lg mt-1">
              Welcome back! Check out your amazing progress.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* XP Progression Timeline Card */}
              <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm">
                <h2 className="text-xl font-bold mb-4">Level Progression</h2>
                <div className="flex flex-col gap-3">
                  <div className="flex gap-6 justify-between items-center">
                    <p className="text-base font-bold text-accent">Level 5</p>
                    <p className="text-sm font-medium">65%</p>
                  </div>
                  <div className="rounded-full bg-primary/20">
                    <div className="h-3 rounded-full bg-primary" style={{ width: "65%" }} />
                  </div>
                  <p className="text-sm text-text-muted-light dark:text-text-muted-dark">350 XP to Level 6</p>
                </div>
              </div>

              {/* Badge Collection Grid */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">Badge Collection</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Earned Badge */}
                  <div className="flex flex-col items-center p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-white text-4xl">local_fire_department</span>
                    </div>
                    <h3 className="font-bold text-sm">Daily Learner</h3>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">5-Day Streak</p>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-secondary to-primary flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-white text-4xl">star</span>
                    </div>
                    <h3 className="font-bold text-sm">Topic Master</h3>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Completed 'Algebra'</p>
                  </div>

                  {/* Unearned Badge */}
                  <div className="flex flex-col items-center p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm text-center opacity-50">
                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-4xl">psychology</span>
                    </div>
                    <h3 className="font-bold text-sm">Curious Mind</h3>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Ask 10 questions</p>
                  </div>

                  <div className="flex flex-col items-center p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm text-center opacity-50">
                    <div className="w-20 h-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center mb-2">
                      <span className="material-symbols-outlined text-gray-500 dark:text-gray-400 text-4xl">rocket_launch</span>
                    </div>
                    <h3 className="font-bold text-sm">Quick Starter</h3>
                    <p className="text-xs text-text-muted-light dark:text-text-muted-dark">Finish first lesson</p>
                  </div>
                </div>
              </div>

              {/* Achievement Feed */}
              <div>
                <h2 className="text-2xl font-bold tracking-tight mb-4">Recent Achievements</h2>
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-secondary">task_alt</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">You completed 10 lessons!</p>
                      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">2 days ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 bg-card-light dark:bg-card-dark rounded-xl shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">emoji_events</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Unlocked the 'Topic Master' badge.</p>
                      <p className="text-sm text-text-muted-light dark:text-text-muted-dark">4 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-1 space-y-8">
              {/* Avatar Customization Card */}
              <div className="bg-card-light dark:bg-card-dark p-4 rounded-xl shadow-sm">
                <div className="flex flex-col items-stretch justify-start">
                  <div
                    className="w-full bg-center bg-no-repeat aspect-square bg-cover rounded-xl mb-4"
                    data-alt="User's customizable avatar on a colorful background"
                    style={{
                      backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCgwsh4GAAKe9LThO4kfyUvv-x5zwqLfupekZf8yPCBSk5dpxS2N5VwWekqEo1JnLi2JGVc8n0dagIFDJXKOzWD93aDVuoRxOn6C6QKcuBMQha6mu1LQQs-CJj5ykOCC2IbxbHRc_9y-0yw8fOgVp8iHED3Rw0ENUGiQEvp_RPHR27c1QC3uRqW36DJDM6adnd7-qmViLj_8o62bFtGrTs-sifkG0eZQIYARr2rE1jP5fu89pNxtebYY-ZDhBw8SLaXu2DrKSYqjCvP")',
                    }}
                  />
                  <div className="flex w-full flex-col items-stretch justify-center gap-1">
                    <p className="text-lg font-bold">Alex</p>
                    <div className="flex items-end gap-3 justify-between">
                      <div className="flex flex-col gap-1">
                        <p className="text-text-muted-light dark:text-text-muted-dark text-base">Level 5 Adventurer</p>
                        <p className="text-text-muted-light dark:text-text-muted-dark text-base">Looking sharp!</p>
                      </div>
                      <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-text-light text-sm font-bold shadow-sm hover:bg-opacity-90 transition-all">
                        <span>Customize</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Streak Calendar Card */}
              <div className="bg-card-light dark:bg-card-dark p-6 rounded-xl shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Streak Calendar</h2>
                  <p className="font-bold text-accent">15-Day Streak!</p>
                </div>
                <div className="grid grid-cols-7 gap-2 text-center text-sm">
                  <div className="font-medium text-text-muted-light dark:text-text-muted-dark">Su</div>
                  <div className="font-medium text-text-muted-light dark:text-text-muted-dark">Mo</div>
                  <div className="font-medium text-text-muted-light dark:text-text-muted-dark">Tu</div>
                  <div className="font-medium text-text-muted-light dark:text-text-muted-dark">We</div>
                  <div className="font-medium text-text-muted-light dark:text-text-muted-dark">Th</div>
                  <div className="font-medium text-text-muted-light dark:text-text-muted-dark">Fr</div>
                  <div className="font-medium text-text-muted-light dark:text-text-muted-dark">Sa</div>
                  {[
                    { day: "28", active: false, current: false },
                    { day: "29", active: false, current: false },
                    { day: "30", active: false, current: false },
                    { day: "31", active: false, current: false },
                    { day: "1", active: true, current: false },
                    { day: "2", active: true, current: false },
                    { day: "3", active: true, current: false },
                    { day: "4", active: false, current: false },
                    { day: "5", active: true, current: false },
                    { day: "6", active: true, current: false },
                    { day: "7", active: true, current: false },
                    { day: "8", active: true, current: false },
                    { day: "9", active: true, current: false },
                    { day: "10", active: true, current: false },
                    { day: "11", active: true, current: false },
                    { day: "12", active: true, current: false },
                    { day: "13", active: true, current: false },
                    { day: "14", active: true, current: false },
                    { day: "15", active: true, current: false },
                    { day: "16", active: true, current: true },
                    { day: "17", active: false, current: false },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className={`${
                        item.current
                          ? "w-8 h-8 rounded-full flex items-center justify-center text-white bg-primary ring-2 ring-offset-2 ring-offset-card-light dark:ring-offset-card-dark ring-primary"
                          : item.active
                          ? "w-8 h-8 rounded-full flex items-center justify-center bg-primary/20 text-primary"
                          : item.day === "28" || item.day === "29" || item.day === "30" || item.day === "31"
                          ? "text-text-muted-light dark:text-text-muted-dark opacity-50"
                          : "w-8 h-8 rounded-full flex items-center justify-center"
                      }`}
                    >
                      {item.day}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
