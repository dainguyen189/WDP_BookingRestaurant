import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import QRCodeComponent from './QRCodeGenerator';
import AdminHeader from '../../Header/AdminHeader';
import './css/AdminTableQRPage.css';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { toast } from "react-toastify";

function AdminTableQRPage() {
  const [tables, setTables] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loadingTableId, setLoadingTableId] = useState(null);
  const [activeSessions, setActiveSessions] = useState({});
  const navigate = useNavigate();
  const [showAddTableModal, setShowAddTableModal] = useState(false);
  const [newTable, setNewTable] = useState({ tableNumber: '', capacity: '' });

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/tables');
      setTables(res.data);
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  };

  useEffect(() => {
    const fetchActiveSessions = async () => {
      const sessionMap = {};
      for (let table of tables) {
        try {
          const res = await axios.get(`http://localhost:8080/api/dining-sessions/table/${table._id}`);
          if (res.data && res.data._id) {
            sessionMap[table._id] = res.data._id;
          }
        } catch { }
      }
      setActiveSessions(sessionMap);
    };

    if (tables.length) fetchActiveSessions();
  }, [tables]);

  const createSessionForTable = async (tableId) => {
    try {
      setLoadingTableId(tableId);
      const res = await axios.post('http://localhost:8080/api/dining-sessions', {
        tableId: tableId
      });
      setSelectedSessionId(res.data._id);
      await fetchTables();
    } catch (err) {
      console.error('Error creating session:', err);
      alert('Failed to create new session');
    } finally {
      setLoadingTableId(null);
    }
  };

  const closeQRModal = () => setSelectedSessionId(null);

  const statusLabel = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'available') return 'Trống';
    if (s === 'occupied' || s === 'busy') return 'Đang dùng';
    return status || '—';
  };

  const statusBadgeClass = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'available') return 'table-status-badge table-status-available';
    if (s === 'occupied' || s === 'busy') return 'table-status-badge table-status-busy';
    return 'table-status-badge table-status-default';
  };

  return (
    <>
      <AdminHeader />

      <div className="admin-table-page">
        <Container className="py-4 pb-5">
          <Row className="align-items-center mb-4 table-management-header">
            <Col xs={12} md={6}>
              <h1 className="table-management-title">Quản lý bàn</h1>
              <p className="table-management-subtitle">Danh sách bàn nhà hàng — chỉnh sửa nhanh, giao diện sáng</p>
            </Col>
            <Col xs={12} md={6} className="text-md-end mt-3 mt-md-0">
              <Button
                className="btn-create-table"
                onClick={() => setShowAddTableModal(true)}
              >
                + Tạo bàn
              </Button>
            </Col>
          </Row>

          <Row xs={1} sm={2} md={3} lg={4} className="g-4">
            {tables.map(table => {
              const currentSessionId = activeSessions[table._id];
              return (
                <Col key={table._id}>
                  <Card className="table-management-card h-100">
                    <Card.Body className="d-flex flex-column">
                      <div className="table-card-accent" aria-hidden />
                      <Card.Title as="div" className="table-card-title">
                        Bàn {table.tableNumber}
                      </Card.Title>
                      <div className="table-card-meta">
                        <span className="table-card-meta-row">
                          <span className="table-card-meta-label">Số ghế</span>
                          <span className="table-card-meta-value">{table.capacity}</span>
                        </span>
                        <span className="table-card-meta-row">
                          <span className="table-card-meta-label">Trạng thái</span>
                          <span className={statusBadgeClass(table.status)}>
                            {statusLabel(table.status)}
                          </span>
                        </span>
                      </div>
                      <div className="mt-auto pt-3">
                        {currentSessionId ? (
                          <Button
                            variant="outline-secondary"
                            className="btn-table-delete"
                            disabled
                          >
                            {loadingTableId === table._id ? 'Đang tải...' : 'Không thể xóa'}
                          </Button>
                        ) : (
                          <Button
                            variant="outline-danger"
                            className="btn-table-delete"
                            onClick={async () => {
                          const confirmed = window.confirm(`Bạn có chắc muốn xoá bàn ${table.tableNumber}?`);
                          if (!confirmed) return;

                          try {
                            const res = await axios.delete(`http://localhost:8080/api/tables/${table._id}`);
                            toast.success(`Đã xoá bàn ${table.tableNumber}`);
                            await fetchTables(); // Refresh list
                          } catch (err) {
                            console.error(err);
                            if (err.response?.data?.message) {
                              toast.error(err.response.data.message);
                            } else {
                              toast.error('Không thể xoá bàn');
                            }
                          }
                        }}
                      >
                        Xóa bàn
                      </Button>
                        )}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              );
            })}
          </Row>

          {tables.length === 0 && (
            <div className="table-management-empty text-center py-5">
              <p className="mb-0">Chưa có bàn nào. Nhấn <strong>Tạo bàn</strong> để thêm.</p>
            </div>
          )}
        </Container>
      </div>

      {/* Modal */}

      {showAddTableModal && (
        <div className="modal-overlay add-table-modal-overlay" onClick={() => setShowAddTableModal(false)}>
          <div className="modal-content add-table-modal" onClick={e => e.stopPropagation()}>
            <h3 className="add-table-modal-title">Thêm bàn mới</h3>
            <input
              type="text"
              placeholder="Số bàn (vd: A1)"
              value={newTable.tableNumber}
              onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
            />
            <p className="add-table-modal-hint">
              Định dạng hợp lệ: chữ + số (vd: A1, B10, 12)
            </p>

            <input
              type="number"
              placeholder="Số ghế"
              value={newTable.capacity}
              onChange={e => setNewTable({ ...newTable, capacity: e.target.value })}
            />

            <div className="add-table-modal-actions">
            <button type="button" className="btn btn-modal-submit" onClick={async () => {
              const { tableNumber, capacity } = newTable;
              if (!tableNumber.trim()) {
                toast.error("Vui lòng nhập số bàn!");
                return;
              }
              if (!capacity || capacity <= 0) {
                toast.error("Số ghế phải lớn hơn 0!");
                return;
              }

              try {
                await axios.post('http://localhost:8080/api/tables', {
                  tableNumber: tableNumber.trim(),
                  capacity: parseInt(capacity),
                });
                await fetchTables();
                setShowAddTableModal(false);
                setNewTable({ tableNumber: '', capacity: '' });
                toast.success('Bàn đã được thêm!');
              } catch (err) {
                console.error(err);
                if (err.response?.status === 409) {
                  toast.error(`Bàn ${tableNumber.trim()} đã tồn tại!`);
                } else if (err.response?.data?.message) {
                  toast.error(err.response.data.message);
                } else {
                  toast.error('Không thể thêm bàn');
                }
              }
            }}>
              Tạo bàn
            </button>

            <button type="button" className="btn btn-modal-cancel" onClick={() => setShowAddTableModal(false)}>
              Đóng
            </button>
            </div>
          </div>
        </div >
      )
      }
    </>
  );
}
export default AdminTableQRPage;
