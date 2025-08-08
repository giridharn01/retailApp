import React from 'react';

const ProductCard = ({ product }) => (
  <div className="border rounded p-4 shadow hover:shadow-lg transition">
    <div className="w-full h-40 bg-gray-100 rounded mb-2 flex items-center justify-center overflow-hidden">
      <img 
        src={product.image || '/placeholder.png'} 
        alt={product.name} 
        className="max-w-full max-h-full object-contain"
      />
    </div>
    <h2 className="text-lg font-semibold">{product.name}</h2>
    <p className="text-gray-600">{product.category}</p>
    <p className="text-blue-600 font-bold">₹{product.price}</p>
    <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Add to Cart</button>
  </div>
);

export default ProductCard; 