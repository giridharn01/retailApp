import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../utils/api';

const ProductListPage = React.memo(() => {
  const searchInputRef = useRef(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name:asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState([]);
  const productsPerPage = 12;

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiRequest('/products/categories');
      setCategories(res.data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories([]);
    }
  }, []);

  const fetchSuggestions = useCallback(async (term) => {
    if (!term || term.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Rate limiting for production
    if (window.lastSuggestionRequest && Date.now() - window.lastSuggestionRequest < 200) {
      return; // Skip if too frequent
    }
    window.lastSuggestionRequest = Date.now();

    try {
      const res = await apiRequest(`/products/suggestions?q=${encodeURIComponent(term)}`);
      const suggestionList = res.data || [];
      setSuggestions(suggestionList);
      setShowSuggestions(suggestionList.length > 0 && isSearchFocused);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [isSearchFocused]);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setIsSearching(true);
      
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: productsPerPage,
        ...(debouncedSearchTerm && { search: debouncedSearchTerm }),
        category: selectedCategory,
        sort: sortBy
      });

      const res = await apiRequest(`/products?${queryParams}`);
      console.log('Products API Response:', res);
      console.log('Total products:', res.total);
      console.log('Current page products:', res.data?.length);
      console.log('Query params:', queryParams.toString());
      setProducts(res.data || []);
      setTotalPages(Math.ceil((res.total || 0) / productsPerPage));
    } catch (err) {
      setError(err.message);
      setProducts([]);
    } finally {
      setLoading(false);
      setIsSearching(false);
      
      // Maintain focus on search input after results load
      setTimeout(() => {
        if (searchInputRef.current && isSearchFocused && document.activeElement !== searchInputRef.current) {
          try {
            searchInputRef.current.focus();
          } catch (e) {
            // Ignore focus errors in production
          }
        }
      }, 50);
    }
  }, [currentPage, debouncedSearchTerm, selectedCategory, sortBy, isSearchFocused]);

  // No automatic debounce - only search on Enter or explicit trigger
  const triggerSearch = useCallback(() => {
    setDebouncedSearchTerm(searchTerm);
    setCurrentPage(1);
    // Keep focus on input after search with better error handling
    setTimeout(() => {
      if (searchInputRef.current && document.activeElement !== searchInputRef.current) {
        try {
          searchInputRef.current.focus();
        } catch (e) {
          // Ignore focus errors in production
        }
      }
    }, 100);
  }, [searchTerm]);

  // Handle Enter key press for search
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      triggerSearch();
      setShowSuggestions(false); // Hide suggestions after search
    }
  }, [triggerSearch]);

  // Proper debounced search for consistent behavior in production
  useEffect(() => {
    // Only trigger search when debouncedSearchTerm changes
    fetchProducts();
  }, [fetchProducts]);

  // Debounced suggestions (faster than search)
  useEffect(() => {
    const suggestionTimer = setTimeout(() => {
      if (searchTerm.length >= 1) {
        fetchSuggestions(searchTerm);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300); // 300ms delay for suggestions

    return () => clearTimeout(suggestionTimer);
  }, [searchTerm, fetchSuggestions]);

  // Initial load and category fetch
  useEffect(() => {
    fetchCategories();
    // Initial load - fetch all products without search term
    const initialLoad = async () => {
      setDebouncedSearchTerm(''); // This will trigger fetchProducts
    };
    initialLoad();
  }, [fetchCategories]);

  // Maintain focus during search operations - with production safety
  useEffect(() => {
    if (isSearchFocused && searchInputRef.current && document.activeElement !== searchInputRef.current) {
      const shouldMaintainFocus = searchTerm.length > 0 || showSuggestions;
      if (shouldMaintainFocus) {
        try {
          searchInputRef.current.focus();
        } catch (e) {
          // Ignore focus errors in production
          console.warn('Focus error ignored:', e);
        }
      }
    }
  }, [isSearchFocused, searchTerm, showSuggestions]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = useCallback((e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setCurrentPage(1); // Reset to first page when search changes
    
    // Ensure input stays focused during typing
    if (!isSearchFocused) {
      setIsSearchFocused(true);
    }
  }, [isSearchFocused]);

  const handleSuggestionClick = useCallback((suggestion) => {
    setSearchTerm(suggestion);
    setShowSuggestions(false);
    setIsSearchFocused(true);
    
    // Immediately search when user clicks a suggestion and maintain focus
    setTimeout(() => {
      setDebouncedSearchTerm(suggestion);
      setCurrentPage(1);
      
      // Ensure input stays focused after suggestion click
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 10);
  }, []);

  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    // Show suggestions immediately if we have any and search term exists
    if (searchTerm.length >= 1) {
      if (suggestions.length > 0) {
        setShowSuggestions(true);
      } else {
        // Fetch suggestions immediately if we don't have any
        fetchSuggestions(searchTerm);
      }
    }
  };

  const handleSearchBlur = (e) => {
    // Don't hide suggestions if clicking on a suggestion or search button
    const relatedTarget = e.relatedTarget;
    if (relatedTarget && (
      relatedTarget.closest('.suggestions-dropdown') || 
      relatedTarget.closest('.search-button')
    )) {
      return;
    }
    
    setIsSearchFocused(false);
    // Only hide suggestions after a longer delay to prevent accidental hiding
    setTimeout(() => {
      if (!searchInputRef.current || document.activeElement !== searchInputRef.current) {
        setShowSuggestions(false);
      }
    }, 300);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-8 space-y-4 sm:flex sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="flex-1 relative">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search products... (Press Enter to search)"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                autoComplete="off"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {/* Search status indicator and search button */}
              <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                {searchTerm && searchTerm !== debouncedSearchTerm ? (
                  <button
                    onClick={triggerSearch}
                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                    className="search-button px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                    title="Click to search or press Enter"
                  >
                    Search
                  </button>
                ) : isSearching ? (
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                ) : searchTerm && searchTerm === debouncedSearchTerm ? (
                  <div className="text-green-500 text-sm" title="Search complete">✓</div>
                ) : null}
              </div>
            </div>
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="suggestions-dropdown absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-600 font-medium">
                  Suggestions (click to search)
                </div>
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onMouseDown={(e) => {
                      // Prevent blur event when clicking suggestions
                      e.preventDefault();
                      handleSuggestionClick(suggestion);
                    }}
                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 select-none flex items-center justify-between"
                  >
                    <span>{suggestion}</span>
                    <span className="text-xs text-gray-400">🔍</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex space-x-4">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={handleSortChange}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name:asc">Sort by Name</option>
              <option value="price:asc">Price: Low to High (₹)</option>
              <option value="price:desc">Price: High to Low (₹)</option>
              <option value="createdAt:desc">Newest First</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products && products.length > 0 ? (
            products.map((product) => (
              <Link
                key={product._id}
                to={`/products/${product._id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
              >
                <div className="w-full h-48 bg-gray-100 flex items-center justify-center overflow-hidden">
                  <img
                    src={product.image || '/placeholder.png'}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500 mb-2">{product.category}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-bold text-blue-600">
                      ₹{product.price?.toFixed(2) || '0.00'}
                    </span>
                    <span
                      className={`text-sm ${
                        product.stock > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <h3 className="text-lg font-medium text-gray-900">No products found</h3>
              <p className="mt-2 text-sm text-gray-500">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                Previous
              </button>
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => handlePageChange(index + 1)}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                    currentPage === index + 1
                      ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === totalPages
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
});

export default ProductListPage;