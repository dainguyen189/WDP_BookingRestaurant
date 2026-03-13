import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import QRCodeComponent from './QRCodeGenerator';
import AdminHeader from '../../Header/AdminHeader';
import './AdminTableQRPage.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

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

  return (
    <>
      <AdminHeader />

      <Container className="mt-4">
        <Row className="align-items-center mb-4">
          <Col><h2>Quản lý bàn</h2></Col>
          <Col className="text-end">
            <Button variant="primary" onClick={() => setShowAddTableModal(true)}>
              Tạo bàn
            </Button>
          </Col>
        </Row>

        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {tables.map(table => {
            const currentSessionId = activeSessions[table._id];
            return (
              <Col key={table._id}>
                <Card className="h-100" style={{ backgroundColor: '#101010' }}>
                  <Card.Body>
                    <Card.Title style={{ color: 'white' }}>
                      <h2>
                        Bàn {table.tableNumber}
                      </h2>
                    </Card.Title>
                    <Card.Text style={{ color: 'white' }}>
                      Số ghế: {table.capacity}<br />
                      Trạng thái: {table.status}
                    </Card.Text >
                    {currentSessionId ? (
                      <Button
                        variant="danger"
                        disabled={true}
                      >
                        {loadingTableId === table._id ? 'Xóa...' : 'Xóa'}
                      </Button>
                    ) : (
                      <Button
                        variant="danger"
                        className="me-2"
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
                        Xoá
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>

      {/* Modal */}

      {showAddTableModal && (
        <div className="modal-overlay" onClick={() => setShowAddTableModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Thêm bàn mới</h3>
            <input
              type="text"
              placeholder="Số bàn (vd: A1)"
              value={newTable.tableNumber}
              onChange={e => setNewTable({ ...newTable, tableNumber: e.target.value })}
            />
            <p style={{ fontSize: '0.9em', color: '#888', marginTop: '4px' }}>
              Định dạng hợp lệ: chữ + số (vd: A1, B10, 12)
            </p>

            <input
              type="number"
              placeholder="Số ghế"
              value={newTable.capacity}
              onChange={e => setNewTable({ ...newTable, capacity: e.target.value })}
            />

            <button className="btn btn-primary" onClick={async () => {
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
              Tạo
            </button>

            <button className="btn btn-secondary" onClick={() => setShowAddTableModal(false)}>
              Đóng
            </button>
          </div>
        </div >
      )
      }
      <ToastContainer />
    </>
  );
}
export default AdminTableQRPage;
