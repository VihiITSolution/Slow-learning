import React from "react";
import { Link } from "react-router-dom";

export default function UserManagementPage() {
  const users = [
    {
      id: 1,
      name: "Olivia Martin",
      email: "olivia.m@email.com",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDTkQncAphsGld6HWt16kAuRLpqiHt8oZL954g8pVFEm0CkW2GZs-C0snBr43icAgIVeJDDc1QqDNOUsovHWPxfwSmTV5468j_j4JF28kFz4801TIKTrwDDSc9qJLqYRdkKcifG7SYXNucS8_MIY3fsd3NLqknumM6cZZkC8kXwVQe51Q4EgBE4mJbDauzgGlO0BMV6q6RK09f4UfxK4Cwxy8w7Jyivbdt4bn65Jc3faR-WPLeehWLnf7k1k1K2M5L_0dhjTr1VFYrD",
      lastActive: "2 days ago",
      progress: 75,
      engagement: { level: "High", color: "green", icon: "local_fire_department" },
      status: "Active"
    },
    {
      id: 2,
      name: "Liam Harris",
      email: "liam.h@email.com",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_FRIeL8Hf3j6nZIzuqLfTxbIfJdrf63DUS4lBDaUfnaMpCRXHZSFu5NCqq6b1PG1Rgup7Rf9NGGLesgT7M0jLzRvg9C_Wtobsw8yUuubUztLbetjc82BNduwOgDMj_bakTa_l4LY35QcTD-N1LYaRsMCFin_T6gONU3lun-HTllhvndVqmstRpflrH7MjyuGk5MBnVl3ELYXsZCFe3jSN5iG2gjZvHm3Inc-noqQtBE7VTpjTfI3EDxVXOlyc-cVARWsy4y17VQAH",
      lastActive: "1 week ago",
      progress: 40,
      engagement: { level: "Medium", color: "yellow", icon: "local_fire_department" },
      status: "Active"
    },
    {
      id: 3,
      name: "Sophia Chen",
      email: "sophia.c@email.com",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAufZJPHE6g7wrAgA1oBjeXgC1RACJs_Ur9oGEC9WenBczaQji6p5xTFfhpXImG6Dqx7AiyVZPAFoN1qHBOf7709wI1mgz0zX2PTBTbYKP8QiLaFS43lUsihizuaa019dS92-Jnr2gqLMtt6M2I9oE1LNCFTRLs5HOBAM1KTbofHO8NN5nUdLO3sMTtpqEjPxXqulQamNQXNvmZJJ_DSJBsVLVIDcCxLTlfIUY4ZZxcN_ru-h5mH5piPSMEeBYbLMFcgVJak8OgpV14",
      lastActive: "3 weeks ago",
      progress: 15,
      engagement: { level: "Low", color: "red", icon: "whatshot" },
      status: "Active"
    },
    {
      id: 4,
      name: "Noah Taylor",
      email: "noah.t@email.com",
      avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFfRC1hZeJZoeqsiNf_IjnpV_bu_Y8dItL-TArcgY5h761IDupzy-RR19Z-xhKpx49BeUjrgZAX6qU1xZZJMFUs0vrllfz-ReYoL8Wm8Un64t4CrUf2x7hnJPIldrsH57nUAE7lldeavw66fGbH6BGetV2TVkJhQSkxPGStUmMyGNLhmCnsjK6viVq4_6T293ARU3QnkmOwr5y2Gz2LICarHRthTajdZLo-FLtHx7bN62LiiB8n3ypIXGXiFEcpfEC6Mq0xUEoc7x0",
      lastActive: "1 month ago",
      progress: 95,
      engagement: { level: "High", color: "green", icon: "local_fire_department" },
      status: "Inactive"
    }
  ];

  return (
    <div className="font-display bg-background-light dark:bg-background-dark relative flex min-h-screen w-full flex-row">
      {/* SideNavBar */}
      <aside className="flex h-screen min-h-screen w-64 flex-col border-r border-gray-200/50 bg-white p-4 dark:border-gray-800 dark:bg-background-dark">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBPmCso4QNBdcAGIyG5S8n9xfUufR-sLzFGqt4KminP7MNPIkttx--lav_OOroqKF_dXeU8JBz9cIcGRQSKXnhh6aJRsuDwsq4M3o70RaUabNjBIl2nGQWJxQvuoUrbDqaZEWTDEt3FVdhh1961zyx8XgA5mGrRmVqcK6eza3-al2r5wq3ajjDrd1EebHrPo1ZhcY2RIar92I_V25nnNaHYJfAzwasY0ATGrcojERtm7Txilm9-T0_UaB9r--OglUltdXFUug4wLLrK")'}} />
            <div className="flex flex-col">
              <h1 className="text-[#0d191c] dark:text-gray-100 text-base font-bold leading-normal">Admin Panel</h1>
              <p className="text-[#498e9c] dark:text-gray-400 text-sm font-normal leading-normal">Micro-Learning Platform</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2 mt-4">
            <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
              <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-200">dashboard</span>
              <p className="text-sm font-medium">Dashboard</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
              <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-200">book</span>
              <p className="text-sm font-medium">Courses</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 dark:bg-primary/30" to="#">
              <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>group</span>
              <p className="text-sm font-bold text-primary">User Management</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
              <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-200">analytics</span>
              <p className="text-sm font-medium">Analytics</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
              <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-200">settings</span>
              <p className="text-sm font-medium">Settings</p>
            </Link>
          </nav>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
            <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-200">help</span>
            <p className="text-sm font-medium">Support</p>
          </Link>
          <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
            <span className="material-symbols-outlined text-red-500">logout</span>
            <p className="text-sm font-medium text-red-500">Logout</p>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        <div className="w-full max-w-7xl mx-auto">
          {/* Page Heading */}
          <header className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-[#0d191c] dark:text-white text-3xl font-black tracking-tight">User Management</h1>
              <p className="text-[#498e9c] dark:text-gray-400 text-base font-normal">View, manage, and track student progress and engagement.</p>
            </div>
            <button className="flex h-10 items-center justify-center gap-x-2 rounded-lg bg-primary px-4 shadow-sm hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-white text-lg">add</span>
              <p className="text-white text-sm font-medium leading-normal">Add New Student</p>
            </button>
          </header>

          {/* Search and Filters */}
          <div className="mb-4 rounded-xl bg-white dark:bg-gray-900/50 p-4 shadow-sm border border-gray-200/50 dark:border-gray-800">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* SearchBar */}
              <div className="md:col-span-1">
                <label className="flex flex-col h-12 w-full">
                  <div className="flex w-full flex-1 items-stretch rounded-lg h-full">
                    <div className="text-[#498e9c] dark:text-gray-400 flex border-r-0 bg-gray-100 dark:bg-gray-800 items-center justify-center pl-4 rounded-l-lg">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input
                      className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#0d191c] dark:text-white focus:outline-0 focus:ring-2 focus:ring-primary/50 border-none bg-gray-100 dark:bg-gray-800 h-full placeholder:text-[#498e9c] dark:placeholder-gray-500 px-4 rounded-l-none border-l-0 pl-2 text-sm"
                      placeholder="Search by name or email..."
                    />
                  </div>
                </label>
              </div>

              {/* Chips / Filters */}
              <div className="md:col-span-2 flex items-center gap-3">
                <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 pl-4 pr-3 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors">
                  <p className="text-[#0d191c] dark:text-gray-200 text-sm font-medium">Status</p>
                  <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-300 text-lg">arrow_drop_down</span>
                </button>
                <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 pl-4 pr-3 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors">
                  <p className="text-[#0d191c] dark:text-gray-200 text-sm font-medium">Progress Level</p>
                  <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-300 text-lg">arrow_drop_down</span>
                </button>
                <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 pl-4 pr-3 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors">
                  <p className="text-[#0d191c] dark:text-gray-200 text-sm font-medium">Engagement</p>
                  <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-300 text-lg">arrow_drop_down</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-800 bg-white dark:bg-gray-900/50 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="p-4 w-12">
                      <input className="form-checkbox rounded border-gray-300 dark:border-gray-600 bg-transparent text-primary focus:ring-primary/50" type="checkbox" />
                    </th>
                    <th className="px-4 py-3 text-left text-[#0d191c] dark:text-gray-300 w-2/6 font-semibold">Student Name</th>
                    <th className="px-4 py-3 text-left text-[#0d191c] dark:text-gray-300 w-1/6 font-semibold">Last Active</th>
                    <th className="px-4 py-3 text-left text-[#0d191c] dark:text-gray-300 w-1/6 font-semibold">Course Progress</th>
                    <th className="px-4 py-3 text-left text-[#0d191c] dark:text-gray-300 font-semibold">Engagement</th>
                    <th className="px-4 py-3 text-left text-[#0d191c] dark:text-gray-300 font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-[#0d191c] dark:text-gray-300 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.id} className="group hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                      <td className="p-4">
                        <input className="form-checkbox rounded border-gray-300 dark:border-gray-600 bg-transparent text-primary focus:ring-primary/50" type="checkbox" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img alt={`Avatar for ${user.name}`} className="h-10 w-10 rounded-full" src={user.avatar} />
                          <div>
                            <p className="font-medium text-[#0d191c] dark:text-white">{user.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[#498e9c] dark:text-gray-400">{user.lastActive}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-24 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                            <div className="h-1.5 rounded-full bg-primary" style={{width: `${user.progress}%`}} />
                          </div>
                          <p className="text-[#0d191c] dark:text-gray-200 font-medium">{user.progress}%</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className={`inline-flex items-center gap-1.5 rounded-full bg-${user.engagement.color}-100 dark:bg-${user.engagement.color}-900/50 px-2.5 py-1`}>
                          <span className={`material-symbols-outlined text-${user.engagement.color}-600 dark:text-${user.engagement.color}-400 text-base`} style={{fontVariationSettings: "'FILL' 1"}}>
                            {user.engagement.icon}
                          </span>
                          <p className={`text-xs font-semibold text-${user.engagement.color}-700 dark:text-${user.engagement.color}-300`}>{user.engagement.level}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {user.status === "Active" ? (
                          <div className="inline-flex items-center rounded-full bg-green-100 dark:bg-green-900/50 px-3 py-1">
                            <p className="text-xs font-semibold text-green-700 dark:text-green-300">Active</p>
                          </div>
                        ) : (
                          <div className="inline-flex items-center rounded-full bg-red-100 dark:bg-red-900/50 px-3 py-1">
                            <p className="text-xs font-semibold text-red-700 dark:text-red-300">Inactive</p>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title={user.status === "Active" ? "Deactivate User" : "Activate User"}>
                            <span className={`material-symbols-outlined ${user.status === "Active" ? "text-red-500" : "text-green-500"} text-lg`}>
                              {user.status === "Active" ? "toggle_off" : "toggle_on"}
                            </span>
                          </button>
                          <button className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="Reset Progress">
                            <span className="material-symbols-outlined text-blue-500 text-lg">restart_alt</span>
                          </button>
                          <button className="p-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700" title="View Details">
                            <span className="material-symbols-outlined text-gray-600 dark:text-gray-300 text-lg">visibility</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-gray-800 px-4 py-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showing <span className="font-semibold text-gray-800 dark:text-white">1</span> to <span className="font-semibold text-gray-800 dark:text-white">4</span> of <span className="font-semibold text-gray-800 dark:text-white">57</span> results
              </p>
              <div className="flex items-center gap-2">
                <button className="flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" disabled>
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <button className="flex items-center justify-center h-8 w-8 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <span className="material-symbols-outlined text-base">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
