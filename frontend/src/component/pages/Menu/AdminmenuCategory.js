import React, { useEffect, useState } from "react";
import axios from "axios";
import AdminHeader from "../../Header/AdminHeader";
import "./AdminmenuCategory.css";

const API_URL = "http://localhost:8080/api/menu-categories";

function AdminMenuCategory() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");

  // New state for search and pagination
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await axios.get(API_URL);
      // Đảm bảo dữ liệu hợp lệ, tránh lỗi undefined
      const validCategories = Array.isArray(res.data)
        ? res.data.filter((cat) => cat && cat.name)
        : [];
      setCategories(validCategories);
      setError("");
    } catch (err) {
      setError("Failed to fetch categories");
      setCategories([]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}/${editingId}`, form);
      } else {
        await axios.post(API_URL, form);
      }
      setForm({ name: "", description: "" });
      setEditingId(null);
      fetchCategories();
      setError("");
    } catch (err) {
      setError(err.response?.data?.error || "Operation failed");
    }
  };

  const handleEdit = (cat) => {
    setForm({
      name: cat?.name || "",
      description: cat?.description || "",
    });
    setEditingId(cat._id);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa danh mục này không?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchCategories();
      setError("");
    } catch (err) {
      setError("Delete failed");
    }
  };

  const handleCancel = () => {
    setForm({ name: "", description: "" });
    setEditingId(null);
    setError("");
  };

  // ✅ Filtered and paginated data (đã fix lỗi .toLowerCase)
  const filteredCategories = categories.filter((cat) => {
    const name = (cat?.name || "").toLowerCase();
    const term = (searchTerm || "").toLowerCase();
    return name.includes(term);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);

  return (
    <>
      <AdminHeader />
      <div className="admin-category-container">
        <h2>Quản lý danh mục</h2>
        {error && <div className="error-message">{error}</div>}

        {/* Search bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="search-input"
          />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="category-form">
          <input
            name="name"
            placeholder="Tên danh mục"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            name="description"
            placeholder="Mô tả"
            value={form.description}
            onChange={handleChange}
          />
          <button type="submit">{editingId ? "Cập nhật" : "Thêm"}</button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="cancel-btn"
            >
              Hủy
            </button>
          )}
        </form>

        {/* Category Table */}
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((cat, idx) => (
                <tr key={cat._id} className={idx % 2 === 0 ? "even" : "odd"}>
                  <td>{cat.name}</td>
                  <td>{cat.description}</td>
                  <td>
                    <button
                      onClick={() => handleEdit(cat)}
                      className="edit-btn"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(cat._id)}
                      className="delete-btn"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
              {currentItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="no-data">
                    Không tìm thấy danh mục nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="pagination">
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={currentPage === i + 1 ? "active" : ""}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

export default AdminMenuCategory;
