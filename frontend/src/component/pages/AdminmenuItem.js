import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AdminHeader from '../../Header/AdminHeader';
import { Container } from 'react-bootstrap';
import './AdminmenuItem.css';

const API_URL = 'http://localhost:8080/api/menu-items';

function AdminMenuItem() {
  const [errors, setErrors] = useState({});
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    image: '',
    price: '',
    isAvailable: true,
    category: '',
    needPreOrder: false
  });
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await axios.get(API_URL);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading items:', err);
      setItems([]);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/menu-categories');
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error loading categories:', err);
      setCategories([]);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const hasNewImage = form.image instanceof File;

      if (editingId) {
        if (hasNewImage) {
          const formData = new FormData();
          formData.append('name', form.name);
          formData.append('description', form.description);
          formData.append('price', form.price);
          formData.append('isAvailable', form.isAvailable);
          formData.append('needPreOrder', form.needPreOrder);
          formData.append('category', form.category);
          formData.append('image', form.image);

          await axios.put(`${API_URL}/${editingId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
        } else {
          const payload = {
            name: form.name,
            description: form.description,
            price: form.price,
            isAvailable: form.isAvailable,
            needPreOrder: form.needPreOrder,
            category: form.category,
          };

          await axios.put(`${API_URL}/${editingId}`, payload);
        }
      } else {
        const formData = new FormData();
        formData.append('name', form.name);
        formData.append('description', form.description);
        formData.append('price', form.price);
        formData.append('isAvailable', form.isAvailable);
        formData.append('needPreOrder', form.needPreOrder);
        formData.append('category', form.category);
        if (form.image instanceof File) {
          formData.append('image', form.image);
        }

        await axios.post(API_URL, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      setForm({ name: '', description: '', image: '', price: '', isAvailable: true, category: '', needPreOrder: false });
      setEditingId(null);
      setShowForm(false);
      fetchItems();
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (item) => {
    setForm({
      ...item,
      category: item.category?._id || ''
    });
    setEditingId(item._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        await axios.delete(`${API_URL}/${id}`);
        fetchItems();
      } catch (err) {
        console.error('Delete error:', err);
      }
    }
  };

  const handleCreateNew = () => {
    setForm({ name: '', description: '', image: '', price: '', isAvailable: true, category: '', needPreOrder: false });
    setEditingId(null);
    setShowForm(true);
  };

  // ✅ FIX LỖI "toLowerCase" AN TOÀN
  const filteredItems = items.filter((item) => {
    const name = (item?.name || '').toLowerCase();
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch = name.includes(term);

    const matchesCategory = selectedCategory
      ? item?.category?._id === selectedCategory
      : true;

    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <>
      <AdminHeader />
      <Container className="menu-page-container">
        <h2>Admin - Quản lý thực đơn</h2>

        <div className="admin-menu-wrapper">
          {/* LEFT SIDE */}
          <div className="menu-list">
            <button className="create-btn" onClick={handleCreateNew}>+ Thêm món ăn</button>

            <div className="filters">
              <input
                className="search-input"
                type="text"
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />

              <select
                className="category-filter"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <table className="menu-table">
              <thead>
                <tr>
                  <th>Ảnh</th>
                  <th>Tên</th>
                  <th>Phân loại</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => (
                  <tr key={item._id}>
                    <td><img src={item.image} alt={item.name} className="item-img" /></td>
                    <td>{item.name}</td>
                    <td>{item.category?.name || 'No Category'}</td>
                    <td>{Number(item.price).toLocaleString()}</td>
                    <td>{item.isAvailable ? 'Phục vụ' : 'Không phục vụ'}</td>
                    <td>
                      <button onClick={() => handleEdit(item)}>Sửa</button>
                      <button className='danger' onClick={() => handleDelete(item._id)}>Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="pagination">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={currentPage === i + 1 ? 'active' : ''}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {/* RIGHT SIDE */}
          {showForm && (
            <div className="menu-form">
              <h4>{editingId ? 'Sửa món ăn' : 'Tạo món ăn'}</h4>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="imageUpload" className="btn btn-primary">
                    <i className="" /> Đăng ảnh
                  </label>
                  <input
                    id="imageUpload"
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, image: e.target.files[0] })}
                  />
                  {form.image && form.image.name && (
                    <div className="mt-2">
                      <small>Đã tải lên: {form.image.name}</small>
                    </div>
                  )}
                </div>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Tên" required />
                <input name="description" value={form.description} onChange={handleChange} placeholder="Giới thiệu" />

                <input
                  name="price"
                  type="text"
                  value={(form.price ?? '').toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/,/g, '');
                    if (!isNaN(raw)) {
                      setForm({ ...form, price: raw });
                    }
                  }}
                  placeholder="Giá"
                />

                <select name="category" value={form.category} onChange={handleChange} required>
                  <option value="">-- Chọn loại --</option>
                  {categories.map((cat) => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>

                <div className="form-check d-flex align-items-center" style={{ marginLeft: '30px', maxWidth: '400px', margin: '10px auto' }}>
                  <input
                    style={{ width: '20px' }}
                    className="form-check-input"
                    type="checkbox"
                    id="isAvailable"
                    name="isAvailable"
                    checked={form.isAvailable}
                    onChange={handleChange}
                  />
                  <label className="form-check-label ms-2" htmlFor="isAvailable">
                    Đang còn
                  </label>
                </div>

                <div className="form-check d-flex align-items-center" style={{ marginLeft: '30px', maxWidth: '400px', margin: '10px auto' }}>
                  <input
                    style={{ width: '20px' }}
                    className="form-check-input"
                    type="checkbox"
                    id="needPreOrder"
                    name="needPreOrder"
                    checked={form.needPreOrder}
                    onChange={handleChange}
                  />
                  <label className="form-check-label ms-2" htmlFor="needPreOrder">
                    Món đặt trước
                  </label>
                </div>

                <button
                  className="submit-button"
                  type="submit"
                  disabled={loading}
                  style={{ backgroundColor: !loading ? '' : 'gray' }}
                >
                  {loading && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                  {editingId ? 'Cập nhật' : 'Tạo'}
                </button>

                <button
                  className="mx-2"
                  type="button"
                  style={{ backgroundColor: !loading ? '#ff6666' : 'gray' }}
                  disabled={loading}
                  onClick={() => setShowForm(false)}
                >
                  {loading && <span className="spinner-border spinner-border-sm me-2" role="status" />}
                  Hủy
                </button>
              </form>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}

export default AdminMenuItem;
