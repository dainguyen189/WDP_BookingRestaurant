import React from 'react';
import { Table, Button, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';

const UserList = ({ users, onEdit, onDelete }) => {
  // Function to render role badge with appropriate color
  const renderRoleBadge = (role) => {
    const badgeVariant = role === 'admin' ? 'danger' : 'info';
    return <Badge bg={badgeVariant}>{role}</Badge>;
  };

  return (
    <Table responsive striped bordered hover className="user-table">
      <thead>
        <tr>
          <th style={{ color: 'black' }}>#</th>
          <th style={{ color: 'black' }}>Tên người dùng</th>
          <th style={{ color: 'black' }}>Email</th>
          <th style={{ color: 'black' }}>Vai trò</th>
          <th style={{ color: 'black' }}>Số điện thoại</th>
          <th style={{ color: 'black' }}>Hành động</th>
        </tr>
      </thead>
      <tbody>
        {users.length > 0 ? (
          users.map((user, index) => (
            <tr key={user._id}>
              <td>{index + 1}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>{renderRoleBadge(user.role)}</td>
              <td>{user.phone || 'N/A'}</td>
              <td className="action-buttons">
                <Button
                  variant="outline-secondary"
                  size="sm"
                  className="me-1"
                  onClick={() => onEdit(user)}
                >
                  <FaEdit />
                  Sửa
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => onDelete(user)}
                >
                  <FaTrash />
                  Xóa
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center">Không tìm thấy người dùng</td>
          </tr>
        )}
      </tbody>
    </Table>
  );
};

export default UserList;
