import React from 'react';

const MenuItemList = ({ items }) => {
  return (
    <div>
      {items.length === 0 ? (
        <p>Không có món ăn nào</p>
      ) : (
        <ul>
          {items.map(item => (
            <li key={item._id}>
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p>Giá: {item.price} VNĐ</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MenuItemList;
