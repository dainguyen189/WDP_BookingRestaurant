import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChefHeader from '../../Header/ChefHeader';
import { Container } from 'react-bootstrap';
import './ChefmenuItem.css';

const API_URL = 'http://localhost:8080/api/menu-items';

function ChefMenuItem() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
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
      setItems(res.data);
    } catch (err) {
      console.error('Error loading items:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/menu-categories');
      setCategories(res.data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  // Chỉ cập nhật trạng thái isAvailable
  const toggleAvailability = async (item) => {
    try {
      const updatedItem = {
        ...item,
        isAvailable: !item.isAvailable,
        category: item.category?._id || ''
      };
      await axios.put(`${API_URL}/${item._id}`, updatedItem);
      fetchItems();
    } catch (err) {
      console.error('Update availability error:', err);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory ? item.category?._id === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <>
      <ChefHeader />
      <Container className="menu-page-container">
        <h2>Chef – Quản lý trạng thái món</h2>

        <div className="admin-menu-wrapper">
          <div className="menu-list">
            <div className="filters">
              <input
                className="search-input"
                type="text"
                placeholder="Tìm kiếm món ăn..."
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
                  <th>Hình ảnh</th>
                  <th>Tên món</th>
                  <th>Danh mục</th>
                  <th>Giá</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item) => (
                  <tr key={item._id}>
                    <td><img src={item.image} alt={item.name} className="item-img" /></td>
                    <td>{item.name}</td>
                    <td>{item.category?.name || 'Không có danh mục'}</td>
                    <td>{item.price.toLocaleString()} VNĐ</td>
                    <td>
                      <span className={`status ${item.isAvailable ? 'available' : 'unavailable'}`}>
                        {item.isAvailable ? 'Còn món' : 'Hết món'}
                      </span>
                    </td>
                    <td>
                      <button 
                        onClick={() => toggleAvailability(item)}
                        className={`toggle-btn ${item.isAvailable ? 'hide-btn' : 'show-btn'}`}
                      >
                        {item.isAvailable ? 'Ẩn món' : 'Hiện món'}
                      </button>
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
        </div>
      </Container>
    </>
  );
}

export default ChefMenuItem;