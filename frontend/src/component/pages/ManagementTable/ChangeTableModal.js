

import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';
import './ChangeTableModal.css';

const ChangeTableModal = ({ show, onHide, currentSession, onSuccess }) => {
  const [availableTables, setAvailableTables] = useState([]);
  const [selectedTableId, setSelectedTableId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      fetchAvailableTables();
    }
  }, [show]);

  const fetchAvailableTables = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/tables');
      // Lọc ra những bàn available và khác bàn hiện tại
      const available = response.data.filter(table =>
        table.status === 'available' &&
        table._id !== currentSession?.table?._id
      );
      setAvailableTables(available);
      setSelectedTableId(''); // Reset selection khi có danh sách mới
    } catch (err) {
      console.error('Error fetching tables:', err);
      setError('Không thể tải danh sách bàn');
    }
  };

  const handleChangeTable = async () => {
    if (!selectedTableId) {
      setError('Vui lòng chọn bàn mới');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await axios.put(`http://localhost:8080/api/dining-sessions/${currentSession._id}/change-table`, {
        newTableId: selectedTableId
      });

      // Đóng modal trước
      onHide();

      // Hiển thị thông báo thành công
      alert('Đổi bàn thành công!');
      console.log('Table changed successfully:', response.data);

      // Refresh data
      onSuccess();
    } catch (err) {
      console.error('Error changing table:', err);
      setError(err.response?.data?.message || 'Lỗi khi đổi bàn');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered className="change-table-modal">
      <Modal.Header closeButton>
        <Modal.Title>Đổi bàn cho khách</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {currentSession && (
          <div className="session-info">
            <p><strong>Khách:</strong> {currentSession.customerName}</p>
            <p><strong>Bàn hiện tại:</strong> {currentSession.table?.tableNumber}</p>
            <p><strong>Số khách:</strong> {currentSession.guestCount}</p>
          </div>
        )}

        {error && <Alert variant="danger">{error}</Alert>}

        <Form.Group className="mb-3">
          <Form.Label>Chọn bàn mới:</Form.Label>
          <Form.Select
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
          >
            <option value="">-- Chọn bàn --</option>
            {availableTables.map(table => {
              const isTooSmall = table.capacity < currentSession?.guestCount;
              const capacityWarning = isTooSmall ? ' (⚠️ Nhỏ hơn số khách)' : '';
              const capacityStatus = table.capacity >= currentSession?.guestCount ? ' ✓' : '';

              return (
                <option key={table._id} value={table._id}>
                  Bàn {table.tableNumber} - {table.capacity} chỗ{capacityStatus}{capacityWarning}
                </option>
              );
            })}
          </Form.Select>
          {availableTables.length > 0 && (
            <small className="form-text text-muted mt-2">
              ✓ = Đủ chỗ cho {currentSession?.guestCount} khách | ⚠️ = Có thể hơi chật
            </small>
          )}
        </Form.Group>

        {availableTables.length === 0 && (
          <Alert variant="warning">Không có bàn trống nào khác</Alert>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Hủy
        </Button>
        <Button
          variant="primary"
          onClick={handleChangeTable}
          disabled={loading || !selectedTableId}
        >
          {loading ? 'Đang đổi...' : 'Đổi bàn'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default ChangeTableModal;