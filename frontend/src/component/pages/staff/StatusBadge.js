import React from 'react';

const StatusBadge = ({ status }) => {
  const statusConfig = {
    ordered: { class: 'item-status-ordered', label: 'Đã đặt' },
    preparing: { class: 'item-status-preparing', label: 'Đã nhận' },
    cooking: { class: 'item-status-preparing', label: 'Đang nấu' },
    done: { class: 'item-status-done', label: 'Xong' },
    completed: { class: 'item-status-done', label: 'Xong' } // optional if you use 'completed'
  };

  const config = statusConfig[status] || { class: 'item-status-unknown', label: 'Không rõ' };

  return (
    <span className={`item-status-badge ${config.class}`}>
      {config.label}
    </span>
  );
};

export default StatusBadge;
