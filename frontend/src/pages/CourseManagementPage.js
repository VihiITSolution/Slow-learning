import React from "react";
import { Link } from "react-router-dom";

export default function CourseManagementPage() {
  return (
    <div className="relative flex min-h-screen w-full font-display bg-background-light dark:bg-background-dark text-text-light dark:text-text-dark">
      {/* SideNavBar */}
      <aside className="flex w-64 flex-col bg-surface-light dark:bg-surface-dark p-4 border-r border-border-light dark:border-border-dark">
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              data-alt="Admin avatar"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA2NOAy_go_UCfgr0HDI72dYWiRCQoM-iCpRFgctp5nE0ooO53c2NcC26K8VON4OgTLSEMys8iQbU7N42GasPlomX_Qw0cYMjCXt2Sn1QOq-kO2VJ25y0jB4iNTULPM76Lrl3ZdUGozZT2OIe7mZ3zFKX6w5DFSbpcGBUXn7oKKDjOnX2VgpWQ4wzx6bx5KFfhdYtoSNhCeGOwet5qLbVW-cblp0biDaJJI-S-I_-P8YPW-mZXAnuI0F4vbE-jlduYVrG1El1ngBn3G")',
              }}
            />
            <div className="flex flex-col">
              <h1 className="text-text-light dark:text-text-dark text-base font-medium leading-normal">Admin</h1>
              <p className="text-subtle-light dark:text-subtle-dark text-sm font-normal leading-normal">Administrator</p>
            </div>
          </div>

          <nav className="flex flex-col gap-2">
            <Link className="flex items-center gap-3 px-3 py-2 rounded text-subtle-light dark:text-subtle-dark hover:bg-primary/10 hover:text-text-light dark:hover:text-text-dark" to="#">
              <span className="material-symbols-outlined">dashboard</span>
              <p className="text-sm font-medium leading-normal">Dashboard</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 text-text-light dark:text-text-dark" to="#">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1, 'wght' 400" }}>import_contacts</span>
              <p className="text-sm font-medium leading-normal">Course Management</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 rounded text-subtle-light dark:text-subtle-dark hover:bg-primary/10 hover:text-text-light dark:hover:text-text-dark" to="#">
              <span className="material-symbols-outlined">analytics</span>
              <p className="text-sm font-medium leading-normal">Learning Analytics</p>
            </Link>
          </nav>

          <div className="mt-auto flex flex-col gap-4">
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-text-dark text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90">
              <span className="truncate">+ Create Course</span>
            </button>
            <div className="flex flex-col gap-1 border-t border-border-light dark:border-border-dark pt-4">
              <Link className="flex items-center gap-3 px-3 py-2 rounded text-subtle-light dark:text-subtle-dark hover:bg-primary/10 hover:text-text-light dark:hover:text-text-dark" to="#">
                <span className="material-symbols-outlined">settings</span>
                <p className="text-sm font-medium leading-normal">Settings</p>
              </Link>
              <Link className="flex items-center gap-3 px-3 py-2 rounded text-subtle-light dark:text-subtle-dark hover:bg-primary/10 hover:text-text-light dark:hover:text-text-dark" to="#">
                <span className="material-symbols-outlined">logout</span>
                <p className="text-sm font-medium leading-normal">Logout</p>
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* PageHeading */}
          <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <p className="text-text-light dark:text-text-dark text-3xl font-black leading-tight tracking-tight">Course Management</p>
              <p className="text-subtle-light dark:text-subtle-dark text-base font-normal leading-normal">Create, edit, and organize all learning content.</p>
            </div>
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary/20 dark:bg-primary/30 text-text-light dark:text-text-dark text-sm font-bold leading-normal tracking-[0.015em] hover:bg-primary/30 dark:hover:bg-primary/40">
              <span className="truncate">+ Add New Lesson</span>
            </button>
          </div>

          {/* SearchBar and Filters */}
          <div className="bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <label className="flex flex-col w-full">
                  <div className="flex w-full flex-1 items-stretch rounded-lg h-12">
                    <div className="text-subtle-light dark:text-subtle-dark flex bg-background-light dark:bg-background-dark items-center justify-center pl-4 rounded-l-lg">
                      <span className="material-symbols-outlined">search</span>
                    </div>
                    <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-r-lg text-text-light dark:text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/50 border-none bg-background-light dark:bg-background-dark h-full placeholder:text-subtle-light dark:placeholder:text-subtle-dark px-4 pl-2 text-base font-normal leading-normal" placeholder="Search for courses..." defaultValue="" />
                  </div>
                </label>
              </div>
              <div className="md:col-span-2 flex items-center gap-3">
                <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-background-light dark:bg-background-dark px-4 w-full md:w-auto">
                  <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">Category</p>
                  <span className="material-symbols-outlined text-subtle-light dark:text-subtle-dark">expand_more</span>
                </button>
                <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-background-light dark:bg-background-dark px-4 w-full md:w-auto">
                  <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">Difficulty</p>
                  <span className="material-symbols-outlined text-subtle-light dark:text-subtle-dark">expand_more</span>
                </button>
                <button className="flex h-12 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-background-light dark:bg-background-dark px-4 w-full md:w-auto">
                  <p className="text-text-light dark:text-text-dark text-sm font-medium leading-normal">Status</p>
                  <span className="material-symbols-outlined text-subtle-light dark:text-subtle-dark">expand_more</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl bg-surface-light dark:bg-surface-dark shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1024px]">
                <thead className="bg-background-light dark:bg-background-dark">
                  <tr>
                    <th className="p-4 text-left w-12">
                      <input className="h-5 w-5 rounded border-border-light dark:border-border-dark border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:border-primary/50" type="checkbox" />
                    </th>
                    <th className="px-4 py-3 text-left text-text-light dark:text-text-dark text-sm font-medium leading-normal w-2/5">Course/Lesson Title</th>
                    <th className="px-4 py-3 text-left text-text-light dark:text-text-dark text-sm font-medium leading-normal">Category</th>
                    <th className="px-4 py-3 text-left text-text-light dark:text-text-dark text-sm font-medium leading-normal">Difficulty</th>
                    <th className="px-4 py-3 text-left text-text-light dark:text-text-dark text-sm font-medium leading-normal">Status</th>
                    <th className="px-4 py-3 text-left text-text-light dark:text-text-dark text-sm font-medium leading-normal">Date Created</th>
                    <th className="px-4 py-3 text-left text-text-light dark:text-text-dark text-sm font-medium leading-normal">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      title: "Introduction to Algebra",
                      category: "Math",
                      difficulty: "Easy",
                      status: "Published",
                      date: "Oct 26, 2023",
                    },
                    {
                      title: "Advanced Chemistry",
                      category: "Science",
                      difficulty: "Hard",
                      status: "Published",
                      date: "Oct 24, 2023",
                    },
                    {
                      title: "The Renaissance Period",
                      category: "History",
                      difficulty: "Medium",
                      status: "Draft",
                      date: "Oct 22, 2023",
                    },
                    {
                      title: "Creative Writing Basics",
                      category: "English",
                      difficulty: "Easy",
                      status: "Draft",
                      date: "Oct 20, 2023",
                    },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-t border-border-light dark:border-border-dark">
                      <td className="p-4">
                        <input className="h-5 w-5 rounded border-border-light dark:border-border-dark border-2 bg-transparent text-primary checked:bg-primary checked:border-primary focus:ring-0 focus:ring-offset-0 focus:border-primary/50" type="checkbox" />
                      </td>
                      <td className="px-4 py-3 text-sm font-normal leading-normal text-text-light dark:text-text-dark">{row.title}</td>
                      <td className="px-4 py-3 text-sm font-normal leading-normal">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${row.category === "Math" ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200" : row.category === "Science" ? "bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200" : row.category === "History" ? "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200" : "bg-pink-100 dark:bg-pink-900/50 text-pink-800 dark:text-pink-200"}`}>{row.category}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-normal leading-normal">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${row.difficulty === "Easy" ? "bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200" : row.difficulty === "Hard" ? "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200" : "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200"}`}>{row.difficulty}</span>
                      </td>
                      <td className="px-4 py-3 text-sm font-normal leading-normal">
                        <span className={`inline-flex items-center gap-1.5 ${row.status === "Draft" ? "text-subtle-light dark:text-subtle-dark" : ""}`}>
                          <span className={`w-2 h-2 rounded-full ${row.status === "Published" ? "bg-green-500" : "bg-gray-400"}`}></span>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-subtle-light dark:text-subtle-dark text-sm font-normal leading-normal">{row.date}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-subtle-light dark:text-subtle-dark">
                          <button className="p-2 rounded-md hover:bg-primary/10 hover:text-text-light dark:hover:text-text-dark"><span className="material-symbols-outlined text-base">edit</span></button>
                          <button className="p-2 rounded-md hover:bg-primary/10 hover:text-text-light dark:hover:text-text-dark"><span className="material-symbols-outlined text-base">visibility</span></button>
                          <button className="p-2 rounded-md hover:bg-primary/10 hover:text-text-light dark:hover:text-text-dark"><span className="material-symbols-outlined text-base">content_copy</span></button>
                          <button className="p-2 rounded-md hover:bg-red-500/10 text-red-500"><span className="material-symbols-outlined text-base">delete</span></button>
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
