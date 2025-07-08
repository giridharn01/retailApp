import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'SET_CART':
            return {
                ...state,
                cart: action.payload,
                loading: false
            };
        case 'ADD_TO_CART':
            return {
                ...state,
                cart: action.payload,
                loading: false
            };
        case 'UPDATE_CART_ITEM':
            return {
                ...state,
                cart: action.payload,
                loading: false
            };
        case 'REMOVE_FROM_CART':
            return {
                ...state,
                cart: action.payload,
                loading: false
            };
        case 'CLEAR_CART':
            return {
                ...state,
                cart: { items: [], subtotal: 0, tax: 0, shippingCost: 0, totalAmount: 0 },
                loading: false
            };
        case 'SET_LOADING':
            return {
                ...state,
                loading: action.payload
            };
        case 'SET_ERROR':
            return {
                ...state,
                error: action.payload,
                loading: false
            };
        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    const { user } = useAuth();
    const [state, dispatch] = useReducer(cartReducer, {
        cart: { items: [], subtotal: 0, tax: 0, shippingCost: 0, totalAmount: 0 },
        loading: false,
        error: null
    });

    const getCart = async () => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const data = await apiRequest('/cart');
            dispatch({ type: 'SET_CART', payload: data.data });
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
        }
    };

    const addToCart = async (productId, quantity = 1) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const data = await apiRequest('/cart', 'POST', { productId, quantity });
            dispatch({ type: 'ADD_TO_CART', payload: data.data });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    const updateCartItem = async (productId, quantity) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const data = await apiRequest(`/cart/${productId}`, 'PUT', { quantity });
            dispatch({ type: 'UPDATE_CART_ITEM', payload: data.data });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    const removeFromCart = async (productId) => {
        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            const data = await apiRequest(`/cart/${productId}`, 'DELETE');
            dispatch({ type: 'REMOVE_FROM_CART', payload: data.data });
            return data;
        } catch (error) {
            dispatch({ type: 'SET_ERROR', payload: error.message });
            throw error;
        }
    };

    const clearCart = async (skipApiCall = false) => {
        // Skip cart clearing for admin users or when explicitly requested
        if (user && user.role === 'admin') {
            dispatch({ type: 'CLEAR_CART' });
            return;
        }

        // If skipApiCall is true, just update local state
        if (skipApiCall) {
            dispatch({ type: 'CLEAR_CART' });
            return;
        }

        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            await apiRequest('/cart', 'DELETE');
            dispatch({ type: 'CLEAR_CART' });
        } catch (error) {
            // If cart is already cleared (404 error), just update local state
            if (error.message.includes('Cart not found') || error.message.includes('404')) {
                dispatch({ type: 'CLEAR_CART' });
            } else {
                dispatch({ type: 'SET_ERROR', payload: error.message });
                throw error;
            }
        }
    };

    const getCartItemCount = () => {
        // Only return cart count for non-admin users
        if (!user || user.role === 'admin') {
            return 0;
        }
        return state.cart.items.reduce((total, item) => total + item.quantity, 0);
    };

    useEffect(() => {
        // Load cart when component mounts (only for non-admin users)
        if (user && user.role !== 'admin') {
            getCart();
        }
    }, [user?.id]); // Only depend on user ID, not the entire user object

    const refreshCart = async () => {
        // Force refresh cart from backend
        if (user && user.role !== 'admin') {
            await getCart();
        }
    };

    return (
        <CartContext.Provider value={{
            cart: state.cart,
            loading: state.loading,
            error: state.error,
            getCart,
            refreshCart,
            addToCart,
            updateCartItem,
            removeFromCart,
            clearCart,
            getCartItemCount
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}; 