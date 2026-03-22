import axios from 'axios';
import StatusBadge from './StatusBadge';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

const OrderItem = ({ item, order, setOrders }) => {
  const handleQuantityChange = (val) => {
    if (!/^\d*$/.test(val)) return;
    setOrders(prev =>
      prev.map(o =>
        o._id === order._id
          ? {
            ...o,
            items: o.items.map(i =>
              i._id === item._id ? { ...i, updatedQuantity: val } : i
            )
          }
          : o
      )
    );
  };

  const deleteItem = async (id) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: 'Bạn có chắc chắn muốn xóa món này không?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy',
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(`http://localhost:8080/api/order-items/${id}`);
        toast.success('Đã xóa món thành công!');
        setOrders(prev =>
          prev.map(o =>
            o._id === order._id
              ? {
                ...o,
                items: o.items.filter(i => i._id !== id)
              }
              : o
          )
        );
      } catch (error) {
        console.error('Error deleting item:', error);
        toast.error('Xóa món thất bại!');
      }
    }
  };

  return (
    <div className="order-item">
      <div className="item-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            min="1"
            disabled={item.status !== 'ordered'}
            value={item.updatedQuantity ?? item.quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            style={{
              width: '60px',
              padding: '4px 6px',
              borderRadius: '4px',
              border: '1px solid #555',
              backgroundColor: item.status === 'ordered' ? '#1a1a1a' : '#2a2a2a',
              color: item.status === 'ordered' ? '#fff' : '#888',
              fontSize: '14px',
              fontWeight: 'bold',
              textAlign: 'center'
            }}
          />
          <span>{item.menuItemId?.name || 'Món ăn'}</span>
        </div>
        <p className="item-details">
          {item.menuItemId?.category?.name || item.menuItemId?.categoryName || 'Danh mục'}
        </p>
        {item.notes && <p className="item-notes">📝 {item.notes}</p>}
      </div>

      <div className="item-actions">
        <StatusBadge status={item.status} />
        {item.status === 'ordered' && (
          <button className="btn btn-danger" onClick={() => deleteItem(item._id)}>
            Xóa
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderItem;
