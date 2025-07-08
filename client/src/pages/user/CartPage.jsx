import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

const CartPage = () => {
    const { cart, loading, updateCartItem, removeFromCart } = useCart();
    const navigate = useNavigate();
    const [updating, setUpdating] = useState(null);

    const handleQuantityChange = async (productId, newQuantity) => {
        if (newQuantity < 1) return;
        
        setUpdating(productId);
        try {
            await updateCartItem(productId, newQuantity);
        } catch (error) {
            console.error('Error updating quantity:', error);
        } finally {
            setUpdating(null);
        }
    };

    const handleRemoveItem = async (productId) => {
        try {
            await removeFromCart(productId);
        } catch (error) {
            console.error('Error removing item:', error);
        }
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (cart.items.length === 0) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center">
                    <div className="text-6xl mb-4">🛒</div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-4">Your cart is empty</h1>
                    <p className="text-gray-600 mb-8">Looks like you haven't added any items to your cart yet.</p>
                    <button
                        onClick={() => navigate('/products')}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        Continue Shopping
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-md overflow-hidden">
                        <div className="p-6">
                            <h2 className="text-xl font-semibold mb-4">Cart Items ({cart.items.length})</h2>
                            
                            {cart.items.map((item) => (
                                <div key={item.product._id} className="flex items-center py-4 border-b border-gray-200 last:border-b-0">
                                    <div className="flex-shrink-0 w-20 h-20">
                                        <img
                                            src={item.product.image || '/default-product.jpg'}
                                            alt={item.product.name}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </div>
                                    
                                    <div className="ml-4 flex-1">
                                        <h3 className="text-lg font-medium text-gray-900">{item.product.name}</h3>
                                        <p className="text-gray-600">₹{item.price}</p>
                                        <p className="text-sm text-gray-500">Stock: {item.product.stock}</p>
                                    </div>
                                    
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => handleQuantityChange(item.product._id, item.quantity - 1)}
                                            disabled={updating === item.product._id || item.quantity <= 1}
                                            className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            -
                                        </button>
                                        
                                        <span className="w-12 text-center font-medium">
                                            {updating === item.product._id ? '...' : item.quantity}
                                        </span>
                                        
                                        <button
                                            onClick={() => handleQuantityChange(item.product._id, item.quantity + 1)}
                                            disabled={updating === item.product._id || item.quantity >= item.product.stock}
                                            className="w-8 h-8 rounded-md border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            +
                                        </button>
                                    </div>
                                    
                                    <div className="text-right ml-4">
                                        <p className="text-lg font-semibold">₹{item.price * item.quantity}</p>
                                        <button
                                            onClick={() => handleRemoveItem(item.product._id)}
                                            className="text-red-600 hover:text-red-800 text-sm font-medium"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
                        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
                        
                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-medium">₹{cart.subtotal}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Tax (18% GST)</span>
                                <span className="font-medium">₹{cart.tax}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className="font-medium">
                                    {cart.shippingCost === 0 ? 'Free' : `₹${cart.shippingCost}`}
                                </span>
                            </div>
                            <div className="border-t pt-3">
                                <div className="flex justify-between text-lg font-semibold">
                                    <span>Total</span>
                                    <span>₹{cart.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleCheckout}
                            disabled={cart.items.length === 0}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Proceed to Checkout
                        </button>

                        <button
                            onClick={() => navigate('/products')}
                            className="w-full mt-3 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Continue Shopping
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage; 