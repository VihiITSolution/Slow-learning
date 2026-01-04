import React from "react";
import { Link } from "react-router-dom";

export default function AdminAnalyticsPage() {
  const atRiskLearners = [
    { name: "Alex Johnson", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA-UTVXRRvaXo_mzr8XvFAh4vNB1Emzx3r68AYdHEbZT-YB83-LDIsMB0l0h8i_5xqk8dty7k5--Dr9VmBzSlSiEwXBZKM4jVWBgNVnGUTpD8SdN8quWeamOXo46v7zcHMNrJ5CL9YDFmFCu82I5WYXv_aBpftScZON81_BP35ykKFOLHIBj0k6WdBRz3ZQ7z83PEPze1RqTSJxp42ehlSvheVRnWpXETawy1h35E8TyS1afcktrNCenyUbsqOKscopGHsBjmMXiCmm", riskLevel: "High", lastActive: "8 days ago", action: "Send motivational nudge" },
    { name: "Maria Garcia", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCgjhcJMNbTj2--zkLkwBF48H0mmgQVePCaVD_WZR8TEfYfKsCnHbZdzbIMRbXGWZUYj_yiTZjua-ITk7sV-qbbDUYciiAfQMgsZTXXs4GNYx3VfjFhKoarQqfMUdVhRodtCSrpItepDM4u_yf7hwxIA6Ir2wNkr8xpDiFtiPacyvevQQkXQ-8U7CFBNHIsI_YvPsXgbCME2vtdXiDuMu9ofD-TbIqqUS5szR4-thp-vIk9_6pE14MVxdCEHdN4H-YEBvn6TNbsi-Ks", riskLevel: "High", lastActive: "6 days ago", action: 'Enroll in "Study Habits" course' },
    { name: "David Smith", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDwrqIPRDFmV3rvoNHahcyq2owMFAl9rx1YuYXefIHdhjZZAnchFFbHZjub-ytGsdMjLbHvsa8iEn076eQGsp460D2qhYYMIETYJsFxWVTuMb0WICuT7DLT2Z4kcfoUFINNC2NnLGjsyhNarRcLBIpG1qX8_ikkyc65pt7XAxjKXy0MiLMwGR2UOwKtlFnm9iT0h-HuJlYLOFtcsRovv1WQs4iW28XMIL2Js2CLc0BcJL5063GI6yqlbY1_fCBlAX_byoxykKe0ZgZQ", riskLevel: "Medium", lastActive: "3 days ago", action: "Award bonus XP" },
    { name: "Emily White", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCaa0wpPgOqx-NCNrfTEu-6t9L0HgXXhvCJeHMeo2R8lpl4MRvPkQ7c_BT8BwRyXuWPDkDXbsc9NJuTx8JC-URNEuRL_OqPICiXjrRDiQOOsyHS1nr3alzTLki6Ca3t5yslZk-qT6TPbwixzmK-CRVG7SRmfLb6pjjzQMO8w9DxTtN_75jNGFnn1HwenH6z_wuFcz4wpiQLXc7hovrfd3K-bzJcvMgmHOyirbh7L8DepNuYrANIo9saN9P1ZbLdNuLN5aAmjg_-9VSN", riskLevel: "Low", lastActive: "1 day ago", action: "Monitor progress" }
  ];

  return (
    <div className="font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark flex min-h-screen">
      {/* SideNavBar */}
      <aside className="w-64 flex-shrink-0 bg-card-light dark:bg-card-dark border-r border-border-light dark:border-border-dark flex flex-col p-4">
        <div className="flex items-center gap-3 p-3 mb-4">
          <div className="bg-primary/20 text-primary p-2 rounded-lg">
            <span className="material-symbols-outlined text-2xl">school</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-text-light dark:text-text-dark text-base font-bold">MicroLearn</h1>
            <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Admin Panel</p>
          </div>
        </div>

        <nav className="flex flex-col gap-2 flex-grow">
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/10 text-primary" to="#">
            <span className="material-symbols-outlined">dashboard</span>
            <p className="text-sm font-semibold">Dashboard</p>
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/5" to="#">
            <span className="material-symbols-outlined">group</span>
            <p className="text-sm font-medium">User Management</p>
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/5" to="#">
            <span className="material-symbols-outlined">play_lesson</span>
            <p className="text-sm font-medium">Course Management</p>
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/5" to="#">
            <span className="material-symbols-outlined">assessment</span>
            <p className="text-sm font-medium">Reports</p>
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-primary/5" to="#">
            <span className="material-symbols-outlined">settings</span>
            <p className="text-sm font-medium">Settings</p>
          </Link>
        </nav>

        <div className="mt-auto">
          <Link className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-danger/10 text-danger" to="#">
            <span className="material-symbols-outlined">logout</span>
            <p className="text-sm font-medium">Log Out</p>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* TopNavBar */}
        <header className="flex items-center justify-between whitespace-nowrap border-b border-border-light dark:border-border-dark px-8 py-4 bg-card-light dark:bg-card-dark sticky top-0 z-10">
          <div className="flex items-center gap-8">
            <h2 className="text-text-light dark:text-text-dark text-xl font-bold">Analytics Dashboard</h2>
          </div>
          <div className="flex items-center gap-4">
            <label className="relative flex items-center min-w-40 max-w-64">
              <span className="material-symbols-outlined absolute left-3 text-text-secondary-light dark:text-text-secondary-dark">search</span>
              <input
                className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-text-light dark:text-text-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark h-10 placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark px-4 pl-10 text-sm font-normal"
                placeholder="Search..."
              />
            </label>
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors">
              <span className="truncate">Create New Course</span>
            </button>
            <div className="flex gap-2">
              <button className="flex cursor-pointer items-center justify-center rounded-lg h-10 w-10 bg-background-light dark:bg-background-dark text-text-secondary-light dark:text-text-secondary-dark hover:bg-primary/10 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-xl">notifications</span>
              </button>
              <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA_4XM88s7mzzb3jM5-ovZfOhJAwo9wT_aJJlryQUqpbtgovPztBEKCc7qmLFMBUChQVnw6AQl6MfDB6tuEJgsTb26dgyitsHp8ubbdOqIrx8-T-vJdL4vFeLf_ggidimzuSLnwivPtFE0QDbYO_B5--VFrw-AyH3G7mgq8vNwvu05H_NUJEqf0ArYgUrtB9qF7fvUcN8wQemO81lUBAgckKt7cOlBdg6b0__n9NbtgIfy7Y5ROaJQhFKAV5g5jMW-cKt75sIzeqQNk")'}} />
            </div>
          </div>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          {/* Date Filters */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Platform Overview</h3>
            <div className="flex gap-2">
              <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark px-3 hover:bg-primary/5 shadow-soft">
                <p className="text-text-light dark:text-text-dark text-sm font-medium">Last 7 Days</p>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
              <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark px-3 hover:bg-primary/5 shadow-soft">
                <p className="text-text-light dark:text-text-dark text-sm font-medium">Last 30 Days</p>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
              <button className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark px-3 hover:bg-primary/5 shadow-soft">
                <p className="text-text-light dark:text-text-dark text-sm font-medium">Custom Range</p>
                <span className="material-symbols-outlined text-sm">expand_more</span>
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-soft">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Total Active Learners</p>
              <p className="text-text-light dark:text-text-dark text-2xl font-bold">1,482</p>
              <p className="text-success text-sm font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-base">arrow_upward</span>+5.2%
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-soft">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Course Completion Rate</p>
              <p className="text-text-light dark:text-text-dark text-2xl font-bold">76%</p>
              <p className="text-danger text-sm font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-base">arrow_downward</span>-1.5%
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-soft">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">Total XP Earned</p>
              <p className="text-text-light dark:text-text-dark text-2xl font-bold">2,540,300</p>
              <p className="text-success text-sm font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-base">arrow_upward</span>+12.0%
              </p>
            </div>

            <div className="flex flex-col gap-2 rounded-xl p-6 bg-card-light dark:bg-card-dark border border-border-light dark:border-border-dark shadow-soft">
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm font-medium">New Users (This Period)</p>
              <p className="text-text-light dark:text-text-dark text-2xl font-bold">121</p>
              <p className="text-success text-sm font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-base">arrow_upward</span>+8.9%
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
            <div className="lg:col-span-3 flex flex-col gap-2 rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-soft p-6">
              <p className="text-text-light dark:text-text-dark text-base font-semibold">Overall Engagement</p>
              <div className="flex gap-1 items-baseline">
                <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm">Last 30 Days</p>
                <p className="text-success text-sm font-medium flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">arrow_upward</span>+15.3%
                </p>
              </div>
              <div className="flex min-h-[250px] flex-1 flex-col gap-8 py-4">
                <svg fill="none" height="100%" preserveAspectRatio="none" viewBox="-3 0 478 150" width="100%" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25V149H0V109Z" fill="url(#paint0_linear_1131_5935_light)" />
                  <path d="M0 109C18.1538 109 18.1538 21 36.3077 21C54.4615 21 54.4615 41 72.6154 41C90.7692 41 90.7692 93 108.923 93C127.077 93 127.077 33 145.231 33C163.385 33 163.385 101 181.538 101C199.692 101 199.692 61 217.846 61C236 61 236 45 254.154 45C272.308 45 272.308 121 290.462 121C308.615 121 308.615 149 326.769 149C344.923 149 344.923 1 363.077 1C381.231 1 381.231 81 399.385 81C417.538 81 417.538 129 435.692 129C453.846 129 453.846 25 472 25" stroke="#4A6CFA" strokeLinecap="round" strokeWidth="3" />
                  <defs>
                    <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1131_5935_light" x1="236" x2="236" y1="1" y2="149">
                      <stop stopColor="#4A6CFA" stopOpacity="0.2" />
                      <stop offset="1" stopColor="#4A6CFA" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            <div className="lg:col-span-2 flex flex-col gap-2 rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-soft p-6">
              <p className="text-text-light dark:text-text-dark text-base font-semibold">Course Completion</p>
              <div className="flex min-h-[250px] flex-1 flex-col items-center justify-center py-4 relative">
                <svg className="size-48" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#F85D5D" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#FFAB3E" strokeDasharray="80, 20" strokeDashoffset="-15" strokeWidth="3" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831" fill="none" stroke="#20D489" strokeDasharray="60, 40" strokeWidth="3" />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold">1,200</span>
                  <span className="text-sm text-text-secondary-light dark:text-text-secondary-dark">Courses</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-success" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-warning" />
                  <span>In Progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="size-3 rounded-full bg-danger" />
                  <span>Not Started</span>
                </div>
              </div>
            </div>
          </div>

          {/* Disengagement Alerts Table */}
          <div className="rounded-xl border border-border-light dark:border-border-dark bg-card-light dark:bg-card-dark shadow-soft">
            <div className="p-6">
              <h3 className="text-text-light dark:text-text-dark text-base font-semibold">Learners at Risk of Disengagement</h3>
              <p className="text-text-secondary-light dark:text-text-secondary-dark text-sm mt-1">AI-powered alerts for learners who need a little nudge.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-text-secondary-light dark:text-text-secondary-dark uppercase bg-background-light dark:bg-background-dark">
                  <tr>
                    <th className="px-6 py-3 font-medium" scope="col">Learner Name</th>
                    <th className="px-6 py-3 font-medium" scope="col">Risk Level</th>
                    <th className="px-6 py-3 font-medium" scope="col">Last Active</th>
                    <th className="px-6 py-3 font-medium" scope="col">Suggested Action</th>
                    <th className="px-6 py-3 font-medium text-center" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {atRiskLearners.map((learner, index) => (
                    <tr key={index} className={index < atRiskLearners.length - 1 ? "border-b border-border-light dark:border-border-dark" : ""}>
                      <td className="px-6 py-4 font-medium flex items-center gap-3">
                        <img className="size-8 rounded-full" alt={`Avatar for ${learner.name}`} src={learner.avatar} />
                        {learner.name}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          learner.riskLevel === "High" ? "bg-danger/10 text-danger" :
                          learner.riskLevel === "Medium" ? "bg-warning/10 text-warning" :
                          "bg-success/10 text-success"
                        }`}>
                          {learner.riskLevel}
                        </span>
                      </td>
                      <td className="px-6 py-4">{learner.lastActive}</td>
                      <td className="px-6 py-4">{learner.action}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button className="p-1.5 rounded-md hover:bg-primary/10 text-text-secondary-light dark:text-text-secondary-dark">
                            <span className="material-symbols-outlined text-lg">send</span>
                          </button>
                          <button className="p-1.5 rounded-md hover:bg-primary/10 text-text-secondary-light dark:text-text-secondary-dark">
                            <span className="material-symbols-outlined text-lg">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
