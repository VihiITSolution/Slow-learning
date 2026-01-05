import React, { useState } from "react";
import Layout from "../components/common/Layout";
import "../styles/MaterialsLibrary.css";

export default function MaterialsLibraryPage() {
  const [materials] = useState([
    { id: 1, title: "Introduction to Algebra", type: "PDF", date: "Oct 26, 2023", status: "Published" },
    { id: 2, title: "The Solar System", type: "Video", date: "Oct 22, 2023", status: "Published" },
    { id: 3, title: "Basic Grammar Quiz", type: "Quiz", date: "Oct 20, 2023", status: "Draft" },
    { id: 4, title: "Interactive History Timeline", type: "Interactive", date: "Oct 15, 2023", status: "Published" }
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || material.type === filterType;
    const matchesStatus = filterStatus === "all" || material.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const getTypeIcon = (type) => {
    switch(type) {
      case "PDF": return "📄";
      case "Video": return "🎥";
      case "Quiz": return "📝";
      case "Interactive": return "🎮";
      default: return "📁";
    }
  };

  return (
    <Layout>
      <div className="materials-library-page">
        <div className="page-header">
          <div className="header-content">
            <h1 className="page-title">📚 Materials Library</h1>
            <p className="page-subtitle">Manage all your learning materials in one place.</p>
          </div>
          <button className="btn btn-primary add-material-btn">
            ➕ Add New Material
          </button>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-buttons">
            <select 
              className="filter-select"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="PDF">PDF</option>
              <option value="Video">Video</option>
              <option value="Quiz">Quiz</option>
              <option value="Interactive">Interactive</option>
            </select>

            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
          </div>
        </div>

        <div className="materials-table-container">
          <table className="materials-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Content Type</th>
                <th>Date Uploaded</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMaterials.map((material) => (
                <tr key={material.id}>
                  <td className="title-cell">
                    <strong>{material.title}</strong>
                  </td>
                  <td>
                    <span className="type-badge">
                      {getTypeIcon(material.type)} {material.type}
                    </span>
                  </td>
                  <td className="date-cell">{material.date}</td>
                  <td>
                    {material.status === "Published" ? (
                      <span className="status-badge status-published">
                        ✓ Published
                      </span>
                    ) : (
                      <span className="status-badge status-draft">
                        ⏳ Draft
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn edit-btn" title="Edit">✏️</button>
                      <button className="action-btn view-btn" title="View">👁️</button>
                      <button className="action-btn delete-btn" title="Delete">🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredMaterials.length === 0 && (
            <div className="no-materials">
              <p className="empty-icon">📭</p>
              <p>No materials found</p>
            </div>
          )}
        </div>

        <div className="pagination">
          <p className="pagination-info">
            Showing <strong>1</strong> to <strong>{filteredMaterials.length}</strong> of <strong>{materials.length}</strong> results
          </p>
          <div className="pagination-controls">
            <button className="pagination-btn" disabled>◀</button>
            <button className="pagination-btn" disabled>▶</button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
