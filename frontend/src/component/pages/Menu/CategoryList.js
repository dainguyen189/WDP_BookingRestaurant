
import React from 'react';

const CategoryList = ({ categories, onSelect }) => {
  return (
    <div>
      <button onClick={() => onSelect(null)}>All</button>
      {categories?.map(cat => (
        <button key={cat._id} onClick={() => onSelect(cat._id)}>
          {cat.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryList;
