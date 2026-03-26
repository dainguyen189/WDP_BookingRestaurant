import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import QRCodeComponent from './QRCodeGenerator';
import './css/WaiterTableQRPage.css';
import WaiterHeader from '../../Header/WaiterHeader';
import ChangeTableModal from './ChangeTableModal';

function formatElapsedSince(startTime) {
  const d = new Date(startTime);
  if (Number.isNaN(d.getTime())) return '—';
  const ms = Date.now() - d.getTime();
  if (ms < 0) return '—';
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 1) return 'Vừa mới';
  if (totalMin < 60) return `${totalMin} phút`;
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return m > 0 ? `${h} giờ ${m} phút` : `${h} giờ`;
}

function WaiterTablePage() {
  const [tables, setTables] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [loadingTableId, setLoadingTableId] = useState(null);
  const [activeSessions, setActiveSessions] = useState({});
  const [pendingReservations, setPendingReservations] = useState([]);
  const [showReservationModal, setShowReservationModal] = useState(false);
  const [selectedTableForReservation, setSelectedTableForReservation] = useState(null);
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    guestCount: 1,
    specialRequest: ''
  });

  const [showChangeTableModal, setShowChangeTableModal] = useState(false);
  const [selectedSessionForChange, setSelectedSessionForChange] = useState(null);
  const [sessionUserInfo, setSessionUserInfo] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    fetchTables();
    fetchPendingReservations();
  }, []);

  const fetchTables = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/tables');
      setTables(response.data);

      // Fetch user info cho các session active
      const activeSessions = response.data
        .filter(table => table.activeSession)
        .map(table => table.activeSession._id);

      activeSessions.forEach(sessionId => {
        fetchSessionUserInfo(sessionId);
      });
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const handleChangeTable = (session) => {
    setSelectedSessionForChange(session);
    setShowChangeTableModal(true);
  };

  const fetchPendingReservations = async () => {
    try {
      let allReservations = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const res = await axios.get(`http://localhost:8080/api/reservation?status=pending&page=${currentPage}&pageSize=10`);
        allReservations = [...allReservations, ...(res.data.reservations || [])];
        totalPages = res.data.totalPages || 1;
        currentPage++;
      } while (currentPage <= totalPages);

      console.log(`Fetched ${allReservations.length} total reservations from ${totalPages} pages`);
      setPendingReservations(allReservations);
    } catch (err) {
      console.error('Error fetching pending reservations:', err);
    }
  };

  const fetchSessionUserInfo = async (sessionId) => {
    try {
      const response = await axios.get(`http://localhost:8080/api/dining-sessions/${sessionId}/with-user`);
      setSessionUserInfo(prev => ({
        ...prev,
        [sessionId]: response.data
      }));
    } catch (err) {
      console.error('Error fetching session user info:', err);
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

  const createSessionForTable = async (tableId, reservationId = null) => {
    try {
      setLoadingTableId(tableId);
      let sessionData = { tableId: tableId };

      // Nếu có reservationId, lấy thông tin khách từ reservation
      if (reservationId) {
        const reservation = pendingReservations.find(r => r._id === reservationId);

        if (reservation) {
          sessionData = {
            tableId: tableId,
            customerName: reservation.name,
            customerPhone: reservation.phone,
            guestCount: reservation.guestCount,
            reservationId: reservationId,
            specialRequest: reservation.specialRequest || ''
          };
        }

        // Cập nhật reservation status thành confirmed
        await axios.put(`http://localhost:8080/api/reservation/${reservationId}`, {
          status: 'confirmed'
        });
      }

      console.log('Creating session with data:', sessionData);
      const res = await axios.post('http://localhost:8080/api/dining-sessions', sessionData);
      setSelectedSessionId(res.data._id);
      await fetchTables();
      await fetchPendingReservations();
      setShowReservationModal(false);
    } catch (err) {
      console.error('Error creating session:', err);
      alert('Failed to create new session');
    } finally {
      setLoadingTableId(null);
    }
  };

  const handleNewCustomer = (tableId) => {
    setSelectedTableForReservation(tableId);
    setShowCustomerInfoModal(true);

    // Set default guest count dựa trên capacity của bàn
    const selectedTable = tables.find(t => t._id === tableId);
    if (selectedTable) {
      setCustomerInfo(prev => ({
        ...prev,
        guestCount: Math.min(prev.guestCount, selectedTable.capacity)
      }));
    }
  };

  const handleReservedCustomer = (tableId) => {
    setSelectedTableForReservation(tableId);
    setShowReservationModal(true);
  };

  const handleSelectReservation = (reservationId) => {
    createSessionForTable(selectedTableForReservation, reservationId);
  };

  const closeQRModal = () => setSelectedSessionId(null);
  const closeReservationModal = () => {
    setShowReservationModal(false);
    setSelectedTableForReservation(null);
  };

  const closeCustomerInfoModal = () => {
    setShowCustomerInfoModal(false);
    setSelectedTableForReservation(null);
    setCustomerInfo({
      name: '',
      phone: '',
      guestCount: 1,
      specialRequest: ''
    });
  };

  const createSessionWithCustomerInfo = async () => {
    if (!customerInfo.name.trim()) {
      alert('Vui lòng nhập tên khách hàng');
      return;
    }

    try {
      setLoadingTableId(selectedTableForReservation);

      const sessionData = {
        tableId: selectedTableForReservation,
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        guestCount: customerInfo.guestCount,
        specialRequest: customerInfo.specialRequest || ''
      };

      console.log('Creating session with customer info:', sessionData);
      const res = await axios.post('http://localhost:8080/api/dining-sessions', sessionData);
      setSelectedSessionId(res.data._id);
      await fetchTables();
      closeCustomerInfoModal();
    } catch (err) {
      console.error('Error creating session:', err);
      alert('Lỗi khi tạo session: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoadingTableId(null);
    }
  };

  const getMatchingReservations = () => {
    return pendingReservations;
  };

  // Hàm helper để format thời gian hiển thị
  const formatReservationDateTime = (date, time) => {
    const today = new Date().toISOString().split('T')[0];
    const reservationDate = new Date(date).toISOString().split('T')[0];

    if (reservationDate === today) {
      return `Hôm nay ${time}`;
    } else {
      return `${new Date(date).toLocaleDateString('vi-VN')} ${time}`;
    }
  };

  return (
    <>
      <WaiterHeader />
      <div className="admin-table-container waiter-table-page">
        <h2>Quản lý bàn</h2>
        <ul className="table-grid">
          {tables.map(table => {
            const userInfo = table.activeSession ? sessionUserInfo[table.activeSession._id] : null;
            const currentSessionId = activeSessions[table._id];
            return (
              <li key={table._id} className={`table-item ${table.status}`}>
                <div className="table-info">
                  <h3>Bàn {table.tableNumber}</h3>
                  <p className="table-capacity">Sức chứa: {table.capacity} người</p>
                  <span className={`status ${table.status}`}>
                    {table.status === 'available' ? 'Trống' : 'Có khách'}
                  </span>
                </div>
                {table.status === 'occupied' && table.activeSession && (
                  <div className="session-panel">
                    <div className="session-duration-pill" title="Thời gian từ lúc vào bàn">
                      <span className="session-duration-icon" aria-hidden>
                        ⏱
                      </span>
                      <span>Đã phục vụ · {formatElapsedSince(table.activeSession.startTime)}</span>
                    </div>
                    <div className="session-details">
                      <div className="session-detail">
                        <span className="session-detail-label">
                          <span className="session-detail-icon" aria-hidden>
                            👤
                          </span>
                          Khách
                        </span>
                        <span className="session-detail-value">
                          {table.activeSession.customerName || '—'}
                        </span>
                      </div>
                      <div className="session-detail">
                        <span className="session-detail-label">
                          <span className="session-detail-icon" aria-hidden>
                            📞
                          </span>
                          SĐT
                        </span>
                        <span className="session-detail-value session-detail-value--mono">
                          {table.activeSession.customerPhone || '—'}
                        </span>
                      </div>
                      <div className="session-detail">
                        <span className="session-detail-label">
                          <span className="session-detail-icon" aria-hidden>
                            👥
                          </span>
                          Số khách
                        </span>
                        <span className="session-detail-value">{table.activeSession.guestCount}</span>
                      </div>
                      <div className="session-detail">
                        <span className="session-detail-label">
                          <span className="session-detail-icon" aria-hidden>
                            🕐
                          </span>
                          Bắt đầu
                        </span>
                        <span className="session-detail-value session-detail-value--wrap">
                          {new Date(table.activeSession.startTime).toLocaleString('vi-VN')}
                        </span>
                      </div>
                    </div>

                    {userInfo?.reservationId?.userId && (
                      <div className="session-account-box">
                        <div className="session-account-title">Tài khoản đặt bàn</div>
                        <div className="session-detail session-detail--compact">
                          <span className="session-detail-label">Tài khoản</span>
                          <span className="session-detail-value">
                            {userInfo.reservationId.userId.username}
                          </span>
                        </div>
                        <div className="session-detail session-detail--compact">
                          <span className="session-detail-label">Email</span>
                          <span className="session-detail-value session-detail-value--wrap">
                            {userInfo.reservationId.userId.email}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="session-actions">
                      <button
                        type="button"
                        className="btn-session-change"
                        onClick={() => handleChangeTable(table.activeSession)}
                      >
                        Đổi bàn
                      </button>
                      <button
                        type="button"
                        className="btn-session-qr"
                        onClick={() => setSelectedSessionId(table.activeSession._id)}
                      >
                        QR Code
                      </button>
                      {/* <button
                        className="btn btn-danger btn-sm"
                        onClick={async () => {
                          const confirmEnd = window.confirm('Bạn có chắc muốn kết thúc phiên này?');
                          if (!confirmEnd) return;

                          try {
                            await axios.put(`http://localhost:8080/api/dining-sessions/${table.activeSession._id}/complete`);
                            fetchTables();
                          } catch (err) {
                            alert('Lỗi khi kết thúc phiên');
                          }
                        }}
                      >
                        Kết thúc
                      </button> */}
                    </div>
                  </div>
                )}
                {currentSessionId ? (
                  <></>
                ) : (
                  <div className="create-section">
                    <button
                      type="button"
                      className="create-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleNewCustomer(table._id);
                      }}
                      disabled={loadingTableId === table._id}
                    >
                      {loadingTableId === table._id ? 'Đang tạo...' : 'Tạo'}
                    </button>
                    <button
                      type="button"
                      className="create-btn-secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleReservedCustomer(table._id);
                      }}
                      disabled={loadingTableId === table._id}
                    >
                      Khách đặt trước
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>

{/* Customer Info Modal */}
      {/* {showCustomerInfoModal && (
        <div className="modal-overlay" onClick={closeCustomerInfoModal}>
          <div className="modal-content customer-info-modal" onClick={e => e.stopPropagation()}>
            <h3>Thông tin khách hàng</h3>
            <div className="customer-info-form">
              <input
                type="text"
                placeholder="Tên khách hàng *"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                required
              />
              <input
                type="tel"
                placeholder="Số điện thoại"
                value={customerInfo.phone}
                onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
              />
              <select
                value={customerInfo.guestCount}
                onChange={(e) => setCustomerInfo({ ...customerInfo, guestCount: parseInt(e.target.value) })}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                  <option key={num} value={num}>{num} người</option>
                ))}
              </select>
            </div>
            <div className="button-group">
              <button
                onClick={createSessionWithCustomerInfo}
                className="confirm-btn"
                disabled={loadingTableId}
              >
                {loadingTableId ? 'Đang tạo...' : 'Tạo session'}
              </button>
              <button onClick={closeCustomerInfoModal} className="close-btn">
                Hủy
              </button>
            </div>
          </div>
        </div> */}

      {/* )} */}

      {/* QR Modal */}
      {/* {selectedSessionId && (
        <div className="modal-overlay" onClick={closeQRModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <QRCodeComponent sessionId={selectedSessionId} />

            <div className="button-group">
              <button
                className="end-btn"
                onClick={async () => {
                  const confirmEnd = window.confirm('Are you sure you want to end this session?');
                  if (!confirmEnd) return;

                  try {
                    await axios.put(`http://localhost:8080/api/dining-sessions/${selectedSessionId}/complete`);
                    alert('✅ Session ended.');
                    await fetchTables();
                    setSelectedSessionId(null);
                  } catch (err) {
                    console.error('Error ending session:', err);
                    alert('❌ Failed to end session.');
                  }
                }}
              >
                Kết thúc phiên
              </button>

              <button
                onClick={() => navigate(`/waiter/checkout?sessionId=${selectedSessionId}`)}
                className="checkout-btn"
              >
                💵 Thanh toán
              </button>

              <button onClick={closeQRModal} className="close-btn">Đóng</button>
            </div>
          </div>
        </div>
      )} */}
{/* Customer Info Modal */}
{showCustomerInfoModal && (
  <div className="customer-modal-backdrop" onClick={closeCustomerInfoModal}>
    <div className="customer-modal-container" onClick={e => e.stopPropagation()}>
      <div className="customer-modal-header">
        <h3>Thông tin khách hàng</h3>
        <div className="header-decoration"></div>
      </div>
      
      <div className="customer-form-section">
        <div className="form-group">
          <label className="form-label">Tên khách hàng *</label>
          <input
            type="text"
            className="customer-input required"
            placeholder="Nhập tên khách hàng"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
            required
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Số điện thoại</label>
          <input
            type="tel"
            className="customer-input"
            placeholder="Nhập số điện thoại"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Số lượng khách</label>
          <select
            className="customer-select"
            value={customerInfo.guestCount}
            onChange={(e) => setCustomerInfo({ ...customerInfo, guestCount: parseInt(e.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
              <option key={num} value={num}>{num} người</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="customer-action-buttons">
        <button
          onClick={createSessionWithCustomerInfo}
          className="create-session-button"
          disabled={loadingTableId}
        >
          {loadingTableId ? (
            <>
              <span className="loading-spinner"></span>
              Đang tạo...
            </>
          ) : (
            <>
              <span className="button-icon">✨</span>
              Tạo session
            </>
          )}
        </button>
        <button onClick={closeCustomerInfoModal} className="cancel-button">
          <span className="button-icon">✕</span>
          Hủy
        </button>
      </div>
    </div>
  </div>
)}


{/* QR Modal */}
{selectedSessionId && (
  <div className="qr-modal-backdrop" onClick={closeQRModal}>
    <div className="qr-modal-container" onClick={e => e.stopPropagation()}>
      <QRCodeComponent sessionId={selectedSessionId} />

      <div className="qr-action-buttons">
        <button
          className="session-end-button"
          onClick={async () => {
            const confirmEnd = window.confirm('Are you sure you want to end this session?');
            if (!confirmEnd) return;

            try {
              await axios.put(`http://localhost:8080/api/dining-sessions/${selectedSessionId}/complete`);
              alert('✅ Session ended.');
              await fetchTables();
              setSelectedSessionId(null);
            } catch (err) {
              console.error('Error ending session:', err);
              alert('❌ Failed to end session.');
            }
          }}
        >
          Kết thúc phiên
        </button>

        <button
          onClick={() => navigate(`/waiter/checkout?sessionId=${selectedSessionId}`)}
          className="payment-button"
        >
          💵 Thanh toán
        </button>

        <button onClick={closeQRModal} className="modal-close-button">
          Đóng
        </button>
      </div>
    </div>
  </div>
)}


      {/* Reservation Selection Modal
      {showReservationModal && (
        <div className="modal-overlay" onClick={closeReservationModal}>
          <div className="modal-content reservation-modal" onClick={e => e.stopPropagation()}>
            <h3>Chọn khách đã đặt bàn</h3>
            <div className="reservation-list">
              {getMatchingReservations().length === 0 ? (
                <div>
                  <p>Không có đặt bàn pending nào</p>
                  <p style={{ fontSize: '12px', color: '#666' }}>
                    Debug: Tổng {pendingReservations.length} reservations được tải
                  </p>
                </div>
              ) : (
                getMatchingReservations().map(reservation => {
                  const selectedTable = tables.find(t => t._id === selectedTableForReservation);
                  const isTableTooSmall = selectedTable && reservation.guestCount > selectedTable.capacity;

                  return (
                    <div key={reservation._id} className="reservation-item">
                      <div className="reservation-info">
                        <strong>{reservation.name}</strong>
                        <span>📞 {reservation.phone}</span>
                        <span>👥 {reservation.guestCount} người</span>
                        <span>⏰ {formatReservationDateTime(reservation.reservationDate, reservation.reservationTime)}</span>
                        {isTableTooSmall && (
                          <span className="table-warning">⚠️ Bàn {selectedTable.tableNumber} có thể hơi nhỏ ({selectedTable.capacity} chỗ)</span>
                        )}
                        {reservation.specialRequest && (
                          <span className="special-request">📝 {reservation.specialRequest}</span>
                        )}
                      </div>
                      <button
                        className="select-reservation-btn"
                        onClick={() => handleSelectReservation(reservation._id)}
                      >
                        Chọn
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <button onClick={closeReservationModal} className="close-btn">Close</button>
          </div>
        </div>
      )} */}
{/* Reservation Selection Modal */}
{showReservationModal && (
  <div className="reservation-modal-backdrop" onClick={closeReservationModal}>
    <div className="reservation-modal-container" onClick={e => e.stopPropagation()}>
      <div className="reservation-modal-header">
        <h3>Chọn khách đã đặt bàn</h3>
        <div className="header-decoration-line"></div>
      </div>
      
      <div className="reservation-content-section">
        {getMatchingReservations().length === 0 ? (
          <div className="no-reservations-state">
            <div className="empty-icon">📋</div>
            <p className="empty-message">Không có đặt bàn pending nào</p>
            <p className="debug-info">
              Debug: Tổng {pendingReservations.length} reservations được tải
            </p>
          </div>
        ) : (
          <div className="reservation-list-container">
            {getMatchingReservations().map(reservation => {
              const selectedTable = tables.find(t => t._id === selectedTableForReservation);
              const isTableTooSmall = selectedTable && reservation.guestCount > selectedTable.capacity;

              return (
                <div key={reservation._id} className="reservation-card">
                  <div className="reservation-details">
                    <div className="customer-name">
                      <span className="name-icon">👤</span>
                      <strong>{reservation.name}</strong>
                    </div>
                    
                    <div className="reservation-info-grid">
                      <div className="info-item">
                        <span className="info-icon">📞</span>
                        <span className="info-text">{reservation.phone}</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-icon">👥</span>
                        <span className="info-text">{reservation.guestCount} người</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-icon">⏰</span>
                        <span className="info-text">
                          {formatReservationDateTime(reservation.reservationDate, reservation.reservationTime)}
                        </span>
                      </div>
                    </div>

                    {isTableTooSmall && (
                      <div className="table-warning-alert">
                        <span className="warning-icon">⚠️</span>
                        <span className="warning-text">
                          Bàn {selectedTable.tableNumber} có thể hơi nhỏ ({selectedTable.capacity} chỗ)
                        </span>
                      </div>
                    )}

                    {reservation.specialRequest && (
                      <div className="special-request-note">
                        <span className="request-icon">📝</span>
                        <span className="request-text">{reservation.specialRequest}</span>
                      </div>
                    )}
                  </div>
                  
                  <button
                    className="select-reservation-button"
                    onClick={() => handleSelectReservation(reservation._id)}
                  >
                    <span className="select-icon">✓</span>
                    Chọn
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="reservation-modal-footer">
        <button onClick={closeReservationModal} className="close-modal-button">
          <span className="close-icon">✕</span>
          Đóng
        </button>
      </div>
    </div>
  </div>
)}
      <ChangeTableModal
        show={showChangeTableModal}
        onHide={() => {
          setShowChangeTableModal(false);
          setSelectedSessionForChange(null);
        }}
        currentSession={selectedSessionForChange}
        onSuccess={() => {
          fetchTables(); // Refresh tables data
          setSelectedSessionForChange(null);
          // Refresh user info for all active sessions
          setTimeout(() => {
            fetchTables();
          }, 500); // Delay để đảm bảo backend đã cập nhật xong
        }}
      />
    </>
  );
}

export default WaiterTablePage;
