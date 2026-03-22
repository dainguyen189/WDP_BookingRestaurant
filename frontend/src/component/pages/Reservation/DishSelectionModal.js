import React, { useState, useMemo } from 'react';
import { Modal, Button, Form, Pagination } from 'react-bootstrap';
import { HiChevronDown, HiChevronUp, HiTrash } from 'react-icons/hi';

const ITEMS_PER_PAGE = 8;

const DishSelectionModal = ({ show, onHide, menuItems, selectedDishes, setSelectedDishes }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [showSidebar, setShowSidebar] = useState(false); // false on mobile, toggles view

  const filteredItems = useMemo(() => {
    return menuItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, menuItems]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, page]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);

  const handleAmountChange = (itemId, amount) => {
    const amt = parseInt(amount);
    if (!amt || amt < 1) {
      setSelectedDishes(prev => prev.filter(d => d.itemId !== itemId));
      return;
    }

    setSelectedDishes(prev => {
      const exists = prev.find(d => d.itemId === itemId);
      if (exists) {
        return prev.map(d => d.itemId === itemId ? { ...d, amount: amt } : d);
      } else {
        return [...prev, { itemId, amount: amt }];
      }
    });
  };

  const removeDish = (itemId) => {
    setSelectedDishes(prev => prev.filter(d => d.itemId !== itemId));
  };

  const getAmount = (itemId) => {
    const found = selectedDishes.find(d => d.itemId === itemId);
    return found ? found.amount : '';
  };

  const renderPagination = () => {
    let items = [];
    for (let p = 1; p <= totalPages; p++) {
      items.push(
        <Pagination.Item key={p} active={p === page} onClick={() => setPage(p)}>
          {p}
        </Pagination.Item>
      );
    }
    return <Pagination>{items}</Pagination>;
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered scrollable>
      <Modal.Header closeButton>
        <Modal.Title>Chọn món trước</Modal.Title>
        <Button
          variant="outline-primary"
          size="sm"
          className="d-md-none ms-auto"
          onClick={() => setShowSidebar(prev => !prev)}
        >
          {showSidebar ? 'Danh sách món' : 'Đã chọn'} {showSidebar ? <HiChevronUp /> : <HiChevronDown />}
        </Button>
      </Modal.Header>

      <Modal.Body>
        <div className="container-fluid">
          <div className="row">
            {/* Sidebar (d-md-block or replaces content on small screens) */}
            {showSidebar || window.innerWidth >= 860 ? (
              <div className="col-md-3 mb-3">
                <h6 className="d-flex justify-content-between align-items-center">
                  Món đã chọn <span className="badge bg-secondary">{selectedDishes.length}</span>
                </h6>
                <hr className="mt-2" />
                <ul className="list-group">
                  {selectedDishes.map(dish => {
                    const item = menuItems.find(m => m._id === dish.itemId);
                    return (
                      <li key={dish.itemId} className="list-group-item">
                        <div>
                          <strong className="d-block text-truncate mb-2">{item?.name || '...'}</strong>
                          <div className="d-flex align-items-center gap-2 flex-wrap">
                            <Form.Control
                              type="number"
                              min="1"
                              value={dish.amount}
                              onChange={(e) => handleAmountChange(dish.itemId, e.target.value)}
                              style={{ maxWidth: '80px' }}
                              size="sm"
                            />
                            <Button variant="danger" size="sm" onClick={() => removeDish(dish.itemId)}>
                              <HiTrash />
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                  {selectedDishes.length === 0 && (
                    <li className="list-group-item text-muted text-center">Chưa chọn món nào</li>
                  )}
                </ul>
              </div>
            ) : null}

            {/* Main content - dish selector */}
            {!showSidebar || window.innerWidth >= 860 ? (
              <div className="col-md-9">
                <Form.Control
                  type="text"
                  placeholder="Tìm món..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setPage(1);
                  }}
                  className="mb-3"
                />
                <div className="row g-3">
                  {paginatedItems.map(item => (
                    <div key={item._id} className="col-6 col-md-4">
                      <div className="card h-100 text-center">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="card-img-top"
                          style={{ height: '120px', objectFit: 'cover' }}
                        />
                        <div className="card-body" style={{ color: 'white' }}>
                          <strong>{item.name}</strong>
                          <p className="mb-1">{item.price.toLocaleString()}₫</p>
                          <Form.Control
                            type="number"
                            min="0"
                            value={getAmount(item._id)}
                            onChange={(e) => handleAmountChange(item._id, e.target.value)}
                            placeholder="Số lượng"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="mt-3 d-flex justify-content-center">
                    {renderPagination()}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>Đóng</Button>
      </Modal.Footer>
    </Modal>
  );
};

export default DishSelectionModal;
