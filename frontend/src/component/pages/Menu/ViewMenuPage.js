import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../../Header/Header';
import './MenuPage.css';
import './MenuItemCard.css';

const ViewMenuPage = () => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory]);

  const fetchData = async () => {
    try {
      const [categoriesRes, menuRes] = await Promise.all([
        axios.get('http://localhost:8080/api/menu-categories'),
        axios.get('http://localhost:8080/api/menu-items')
      ]);

      setCategories(categoriesRes.data || []);
      const validMenuItems = (menuRes.data || []).filter(item => item && item.name);
      setMenuItems(validMenuItems);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    try {
      const url = selectedCategory
        ? `http://localhost:8080/api/menu-items?category=${selectedCategory}`
        : 'http://localhost:8080/api/menu-items';
      
      const res = await axios.get(url);
      const validMenuItems = (res.data || []).filter(item => item && item.name);
      setMenuItems(validMenuItems);
    } catch (err) {
      console.error('Error fetching menu items:', err);
    }
  };

  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = !selectedCategory || item.category?._id === selectedCategory;
    const matchesSearch = !searchTerm || 
      (item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN').format(price || 0);
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="view-menu-container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Đang tải menu...</p>
          </div>
        </div>
      </>
    );
  }

  // Phân trang
  const itemsPerPage = 12;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredMenuItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredMenuItems.length / itemsPerPage);

  return (
    <>
      <Header />
      <div className="menu-page-container">
        <h2>Menu</h2>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Tìm món ăn..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: "300px",
            height: "40px",
            fontSize: "16px",
            margin: "20px auto",
            display: "block",
            border: "2px solid blue",
            zIndex: 1000,
            position: "relative",
            backgroundColor: "#fff",
            color: "#000",
          }}
        />

        {/* Category Filter */}
        <div className="category-list">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setCurrentPage(1);
            }}
            className={!selectedCategory ? "active" : ""}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category._id}
              onClick={() => {
                setSelectedCategory(category._id);
                setCurrentPage(1);
              }}
              className={selectedCategory === category._id ? "active" : ""}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="menu-grid">
          {currentItems.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: '#ccc', padding: '40px' }}>
              Không tìm thấy món ăn nào
            </div>
          ) : (
            currentItems.map(item => {
              const imageUrl = item.image?.startsWith("http")
                ? item.image
                : item.image
                ? `http://localhost:8080/uploads/${item.image}`
                : "https://via.placeholder.com/300x200?text=No+Image";

              return (
                <div key={item._id} className="menu-card">
                  <img src={imageUrl} alt={item.name} className="menu-card-img" />
                  <div className="menu-card-body">
                    <div className="menu-card-header">
                      <h5 className="menu-card-title">{item.name}</h5>
                      <p className="menu-card-desc">{item.description || ''}</p>
                    </div>
                    <div className="menu-card-footer">
                      <div className="menu-card-price">{formatPrice(item.price)}₫</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
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
        )}
      </div>
    </>
  );
};

export default ViewMenuPage;

