import React from "react";
import { Link } from "react-router-dom";

export default function MaterialsLibraryPage() {
  const materials = [
    { id: 1, title: "Introduction to Algebra", type: "PDF", date: "Oct 26, 2023", status: "Published", typeColor: "purple" },
    { id: 2, title: "The Solar System", type: "Video", date: "Oct 22, 2023", status: "Published", typeColor: "red" },
    { id: 3, title: "Basic Grammar Quiz", type: "Quiz", date: "Oct 20, 2023", status: "Draft", typeColor: "orange" },
    { id: 4, title: "Interactive History Timeline", type: "Interactive", date: "Oct 15, 2023", status: "Published", typeColor: "blue" }
  ];

  return (
    <div className="font-display relative flex h-auto min-h-screen w-full flex-row bg-background-light dark:bg-background-dark">
      {/* Sidebar */}
      <aside className="flex h-screen w-64 flex-col border-r border-gray-200/50 bg-white p-4 dark:border-gray-800 dark:bg-background-dark">
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
            <Link className="flex items-center gap-3 px-3 py-2 rounded-lg bg-primary/20 dark:bg-primary/30" to="#">
              <span className="material-symbols-outlined text-primary" style={{fontVariationSettings: "'FILL' 1"}}>folder</span>
              <p className="text-sm font-bold text-primary">Materials Library</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
              <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-200">group</span>
              <p className="text-sm font-medium">Users</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
              <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-200">analytics</span>
              <p className="text-sm font-medium">Analytics</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
              <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-200">book</span>
              <p className="text-sm font-medium">Courses</p>
            </Link>
            <Link className="flex items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50" to="#">
              <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-200">settings</span>
              <p className="text-sm font-medium">Settings</p>
            </Link>
          </nav>
        </div>

        <div className="mt-auto">
          <button className="flex w-full items-center gap-3 px-3 py-2 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800/50">
            <span className="material-symbols-outlined text-red-500">logout</span>
            <p className="text-sm font-medium text-red-500">Logout</p>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        <div className="flex-1 p-8">
          {/* Page Heading */}
          <header className="flex flex-wrap justify-between items-center gap-4 mb-6">
            <div className="flex flex-col gap-1">
              <h1 className="text-[#0d191c] dark:text-white text-3xl font-black tracking-tight">Materials Library</h1>
              <p className="text-[#498e9c] dark:text-gray-400 text-base font-normal">Manage all your learning materials in one place.</p>
            </div>
            <button className="flex min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-lg h-11 px-5 bg-primary text-white text-sm font-bold leading-normal tracking-[0.015em] hover:opacity-90">
              <span className="material-symbols-outlined">add_circle</span>
              <span className="truncate">Add New Material</span>
            </button>
          </header>

          {/* Toolbar & Filters */}
          <div className="mb-4 p-4 bg-white dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-800">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="relative flex-1 min-w-[250px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#498e9c] dark:text-gray-400">search</span>
                <input
                  className="w-full h-10 pl-10 pr-4 rounded-lg bg-gray-100 dark:bg-gray-800 border-transparent focus:border-primary focus:ring-primary text-[#0d191c] dark:text-white placeholder:text-[#498e9c] dark:placeholder:text-gray-400"
                  placeholder="Search by title..."
                  type="text"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-4">
                  <p className="text-[#0d191c] dark:text-gray-200 text-sm font-medium">Content Type</p>
                  <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-300">arrow_drop_down</span>
                </button>
                <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-4">
                  <p className="text-[#0d191c] dark:text-gray-200 text-sm font-medium">Status</p>
                  <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-300">arrow_drop_down</span>
                </button>
                <button className="flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-lg bg-gray-100 dark:bg-gray-800 px-4">
                  <p className="text-[#0d191c] dark:text-gray-200 text-sm font-medium">Sort By</p>
                  <span className="material-symbols-outlined text-[#0d191c] dark:text-gray-300">arrow_drop_down</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-800 bg-white dark:bg-gray-900/50">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-100 dark:bg-gray-900">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#498e9c] dark:text-gray-400 uppercase tracking-wider">Title</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#498e9c] dark:text-gray-400 uppercase tracking-wider">Content Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#498e9c] dark:text-gray-400 uppercase tracking-wider">Date Uploaded</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#498e9c] dark:text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-[#498e9c] dark:text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/50 dark:divide-gray-800">
                  {materials.map((material) => (
                    <tr key={material.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#0d191c] dark:text-white">{material.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-${material.typeColor}-100 text-${material.typeColor}-800 dark:bg-${material.typeColor}-900 dark:text-${material.typeColor}-200`}>
                          {material.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#498e9c] dark:text-gray-400">{material.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {material.status === "Published" ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-green-800 dark:text-green-200">
                            <span className="size-2 rounded-full bg-green-500" />
                            Published
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium text-gray-800 dark:text-gray-200">
                            <span className="size-2 rounded-full bg-gray-500" />
                            Draft
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-4">
                          <button className="text-[#498e9c] dark:text-gray-400 hover:text-primary">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button className="text-[#498e9c] dark:text-gray-400 hover:text-primary">
                            <span className="material-symbols-outlined">visibility</span>
                          </button>
                          <button className="text-[#498e9c] dark:text-gray-400 hover:text-red-500">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200/50 dark:border-gray-800 px-6 py-3">
              <p className="text-sm text-[#498e9c] dark:text-gray-400">
                Showing <span className="font-medium text-[#0d191c] dark:text-white">1</span> to <span className="font-medium text-[#0d191c] dark:text-white">4</span> of <span className="font-medium text-[#0d191c] dark:text-white">25</span> results
              </p>
              <div className="flex items-center gap-2">
                <button className="flex items-center justify-center size-8 rounded-lg border border-gray-200/50 dark:border-gray-800 bg-white dark:bg-gray-900 text-[#498e9c] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
                  <span className="material-symbols-outlined text-base">chevron_left</span>
                </button>
                <button className="flex items-center justify-center size-8 rounded-lg border border-gray-200/50 dark:border-gray-800 bg-white dark:bg-gray-900 text-[#498e9c] dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800">
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
