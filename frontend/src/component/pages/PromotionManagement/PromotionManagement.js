import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Button,
  Modal,
  Form,
  Badge,
  Alert,
  Spinner,
  InputGroup,
  Pagination
} from 'react-bootstrap';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaSort,
  FaPercentage,
  FaDollarSign,
  FaGift
} from 'react-icons/fa';
import axios from 'axios';
import './css/PromotionManagement.css';

const PromotionManagement = () => {
  // State management
  const [promotions, setPromotions] = useState([]);
  const [filteredPromotions, setFilteredPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [deletingPromotion, setDeletingPromotion] = useState(null);

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Form data
  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discount_type: 'percentage',
    discount_value: '',
    points_required: 0,
    min_order_value: 0,
    start_date: '',
    end_date: '',
    promotion_type: 'general',
    usage_limit: 1,
    is_active: true
  });

  // Fetch promotions
  useEffect(() => {
    fetchPromotions();
  }, []);

  // Filter and search
  useEffect(() => {
    let filtered = promotions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(promo =>
        promo.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promo.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(promo => {
        const now = new Date();
        const startDate = new Date(promo.start_date);
        const endDate = new Date(promo.end_date);

        switch (filterStatus) {
          case 'active':
            return promo.is_active && startDate <= now && endDate >= now;
          case 'inactive':
            return !promo.is_active;
          case 'expired':
            return endDate < now;
          case 'upcoming':
            return startDate > now;
          default:
            return true;
        }
      });
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(promo => promo.discount_type === filterType);
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'createdAt' || sortBy === 'start_date' || sortBy === 'end_date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredPromotions(filtered);
    setCurrentPage(1);
  }, [promotions, searchTerm, filterStatus, filterType, sortBy, sortOrder]);

  const fetchPromotions = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/promotions');
      setPromotions(response.data);
      setError('');
    } catch (error) {
      console.error('Error fetching promotions:', error);
      setError('Không thể tải danh sách khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);

      if (editingPromotion) {
        await axios.put(`http://localhost:8080/api/promotions/update/${editingPromotion._id}`, formData);
        setSuccess('Cập nhật khuyến mãi thành công');
      } else {
        await axios.post('http://localhost:8080/api/promotions/create', formData);
        setSuccess('Tạo khuyến mãi thành công');
      }

      setShowModal(false);
      setEditingPromotion(null);
      resetForm();
      fetchPromotions();
    } catch (error) {
      console.error('Error saving promotion:', error);
      setError(error.response?.data?.message || 'Không thể lưu khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:8080/api/promotions/delete/${deletingPromotion._id}`);
      setSuccess('Xóa khuyến mãi thành công');
      setShowDeleteModal(false);
      setDeletingPromotion(null);
      fetchPromotions();
    } catch (error) {
      console.error('Error deleting promotion:', error);
      setError('Không thể xóa khuyến mãi');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      points_required: promotion.points_required || 0,
      min_order_value: promotion.min_order_value || 0,
      start_date: promotion.start_date ? new Date(promotion.start_date).toISOString().split('T')[0] : '',
      end_date: promotion.end_date ? new Date(promotion.end_date).toISOString().split('T')[0] : '',
      promotion_type: promotion.promotion_type || 'general',
      usage_limit: promotion.usage_limit || 1,
      is_active: promotion.is_active
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      points_required: 0,
      min_order_value: 0,
      start_date: '',
      end_date: '',
      promotion_type: 'general',
      usage_limit: 1,
      is_active: true
    });
  };

  const getStatusBadge = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.start_date);
    const endDate = new Date(promotion.end_date);

    if (!promotion.is_active) {
      return <Badge bg="secondary">Inactive</Badge>;
    } else if (endDate < now) {
      return <Badge bg="danger">Expired</Badge>;
    } else if (startDate > now) {
      return <Badge bg="warning">Upcoming</Badge>;
    } else {
      return <Badge bg="success">Active</Badge>;
    }
  };

  const getDiscountDisplay = (promotion) => {
    if (promotion.discount_type === 'percentage') {
      return (
        <span className="discount-value">
          <FaPercentage className="me-1" />
          {promotion.discount_value}%
        </span>
      );
    } else {
      return (
        <span className="discount-value">
          <FaDollarSign className="me-1" />
          {promotion.discount_value.toLocaleString('vi-VN')}₫
        </span>
      );
    }
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPromotions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);

  return (
    <div className="promotion-management-container">
      <Container fluid>
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <h1>
              <FaGift className="me-3" />
              Quản lý khuyến mãi
            </h1>
            <p>Quản lý giảm giá, phiếu giảm giá và chiến dịch khuyến mại</p>
            <div className="summary-info">
              <span className="total-count">
                Tổng số khuyến mãi: <strong>{promotions.length}</strong>
              </span>
              <span className="active-count">
                Đang hoạt động: <strong>{promotions.filter(p => {
                  const now = new Date();
                  const start = new Date(p.start_date);
                  const end = new Date(p.end_date);
                  return p.is_active && start <= now && end >= now;
                }).length}</strong>
              </span>
            </div>
          </div>
          <Button
            className="add-promotion-btn"
            onClick={() => {
              resetForm();
              setEditingPromotion(null);
              setShowModal(true);
            }}
          >
            <FaPlus className="me-2" />
            Thêm khuyến mãi mới
          </Button>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Search and Filter Section */}
        <Card className="search-filter-section">
          <Card.Body>
            <Row>
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="input"
                    placeholder="Tìm kiếm theo mã hoặc mô tả..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={2}>
                <Form.Select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang hoạt động</option>
                  <option value="inactive">Ngừng hoạt động</option>
                  <option value="expired">Hết hạn</option>
                  <option value="upcoming">Sắp diễn ra</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="all">Tất cả các loại</option>
                  <option value="percentage">Phần trăm</option>
                  <option value="fixed_amount">Số tiền cố định</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Form.Select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="createdAt">Ngày tạo</option>
                  <option value="start_date">Ngày bắt đầu</option>
                  <option value="end_date">Ngày kết thúc</option>
                  <option value="code">Mã</option>
                  <option value="discount_value">Giá trị giảm giá</option>
                </Form.Select>
              </Col>
              <Col md={2}>
                <Button
                  variant="outline-warning"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-100"
                >
                  <FaSort className="me-1" />
                  {sortOrder === 'asc' ? 'Tăng dần' : 'Giảm dần'}
                </Button>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        {/* Promotions Table */}
        <Card className="promotions-table">
          <Card.Body>
            {loading ? (
              <div className="loading-spinner">
                <Spinner animation="border" />
                <span className="ms-2">Đang tải khuyến mãi...</span>
              </div>
            ) : currentItems.length === 0 ? (
              <div className="empty-state">
                <FaGift size={48} className="text-muted mb-3" />
                <h3>Không tìm thấy khuyến mãi</h3>
                <p>Tạo khuyến mãi đầu tiên của bạn để bắt đầu</p>
              </div>
            ) : (
              <>
                <div className="table-responsive">
                  <Table hover className="promotion-table">
                    <thead>
                      <tr style={{ color: 'black' }}>
                        <th>Mã</th>
                        <th>Mô tả</th>
                        <th>Loại</th>
                        <th>Giảm giá</th>
                        <th>Thời gian</th>
                        <th>Trạng thái</th>
                        <th>Sử dụng</th>
                        <th>Hành động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentItems.map((promotion) => (
                        <tr key={promotion._id}>
                          <td>
                            <div className="promotion-code">
                              <strong>{promotion.code}</strong>
                              {promotion.promotion_type === 'points_based' && (
                                <Badge bg="info" size="sm" className="ms-2">
                                  Points
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="promotion-description">
                              {promotion.description}
                            </div>
                          </td>
                          <td>
                            <Badge bg={promotion.discount_type === 'percentage' ? 'primary' : 'success'}>
                              {promotion.discount_type === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                            </Badge>
                          </td>
                          <td>
                            <div className="discount-display" style={{color: 'white'}}>
                              {getDiscountDisplay(promotion)}
                            </div>
                          </td>
                          <td>
                            <div className="date-range">
                              <div className="start-date">
                                <small>Start:</small> {new Date(promotion.start_date).toLocaleDateString()}
                              </div>
                              <div className="end-date">
                                <small>End:</small> {new Date(promotion.end_date).toLocaleDateString()}
                              </div>
                            </div>
                          </td>
                          <td>
                            {getStatusBadge(promotion)}
                          </td>
                          <td>
                            <div className="usage-info">
                              <div className="usage-count">
                                {promotion.used_count || 0} / {promotion.usage_limit || '∞'}
                              </div>
                              <div className="usage-bar">
                                <div
                                  className="usage-fill"
                                  style={{
                                    width: `${promotion.usage_limit ? (promotion.used_count / promotion.usage_limit) * 100 : 0}%`
                                  }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <Button
                                variant="outline-info"
                                size="sm"
                                onClick={() => handleEdit(promotion)}
                              >
                                <FaEdit />
                              </Button>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => {
                                  setDeletingPromotion(promotion);
                                  setShowDeleteModal(true);
                                }}
                              >
                                <FaTrash />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-center mt-4">
                    <Pagination>
                      <Pagination.First
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                      />
                      <Pagination.Prev
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      />

                      {[...Array(totalPages)].map((_, index) => (
                        <Pagination.Item
                          key={index + 1}
                        active  ={index + 1 === currentPage}
                          onClick={() => setCurrentPage(index + 1)}
                        >
                          {index + 1}
                        </Pagination.Item>
                      ))}

                      <Pagination.Next
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      />
                      <Pagination.Last
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                      />
                    </Pagination>
                  </div>
                )}
              </>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Add/Edit Modal */}
      <Modal
        show={showModal}
        onHide={() => {
          setShowModal(false);
          setEditingPromotion(null);
          resetForm();
        }}
        size="lg"
        className="promotion-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {editingPromotion ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi mới'}
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit}>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mã khuyến mãi *</Form.Label>
                  <Form.Control
                    type="input"
                    placeholder="Nhập mã khuyến mãi"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại khuyến mãi</Form.Label>
                  <Form.Select
                    value={formData.promotion_type}
                    onChange={(e) => setFormData({ ...formData, promotion_type: e.target.value })}
                  >
                    <option value="general">Chung</option>
                    <option value="points_based">Dựa trên điểm</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả *</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Nhập mô tả khuyến mãi"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Loại giảm giá *</Form.Label>
                  <Form.Select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    required
                  >
                    <option value="percentage">Phần trăm</option>
                    <option value="fixed_amount">Số tiền cố định</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Giá trị giảm giá * {formData.discount_type === 'percentage' ? '(%)' : '(VND)'}
                  </Form.Label>
                  <Form.Control
                    type="number"
                    placeholder={formData.discount_type === 'percentage' ? 'Nhập phần trăm' : 'Nhập số tiền'}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : undefined}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Điểm yêu cầu</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Nhập điểm yêu cầu"
                    value={formData.points_required}
                    onChange={(e) => setFormData({ ...formData, points_required: e.target.value })}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá trị đơn hàng tối thiểu (VND)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Nhập giá trị tối thiểu"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    min="0"
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày bắt đầu *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ngày kết thúc *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giới hạn lượt sử dụng</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="Nhập giới hạn lượt (0 = không giới hạn)"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
                    min="0"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Trạng thái</Form.Label>
                  <Form.Check
                    type="switch"
                    id="is-active-switch"
                    label="Hoạt động"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="mt-2"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                setEditingPromotion(null);
                resetForm();
              }}
            >
              Hủy
            </Button>
            <Button
              variant="primary"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  {editingPromotion ? 'Đang cập nhật...' : 'Đang tạo...'}
                </>
              ) : (
                editingPromotion ? 'Cập nhật khuyến mãi' : 'Tạo khuyến mãi'
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={() => {
          setShowDeleteModal(false);
          setDeletingPromotion(null);
        }}
        className="delete-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận xóa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc muốn xóa khuyến mãi <strong>{deletingPromotion?.code}</strong>?</p>
          <p className="text-danger">Hành động này không thể hoàn tác.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => {
              setShowDeleteModal(false);
              setDeletingPromotion(null);
            }}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang xóa...
              </>
            ) : (
              'Xóa khuyến mãi'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default PromotionManagement;
