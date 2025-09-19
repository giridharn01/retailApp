const Product = require('../models/Product');

// Simple in-memory cache for search results
const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100;

// Helper function to get cached search results
const getCachedSearch = (cacheKey) => {
    if (searchCache.has(cacheKey)) {
        const { results, timestamp } = searchCache.get(cacheKey);
        if (Date.now() - timestamp < CACHE_DURATION) {
            return results;
        }
        searchCache.delete(cacheKey);
    }
    return null;
};

// Helper function to cache search results
const setCachedSearch = (cacheKey, results) => {
    // Limit cache size
    if (searchCache.size >= MAX_CACHE_SIZE) {
        const firstKey = searchCache.keys().next().value;
        searchCache.delete(firstKey);
    }
    searchCache.set(cacheKey, { results, timestamp: Date.now() });
};

// Helper function to get sort options
const getSortOption = (sort) => {
    switch (sort) {
        case 'price:asc': return { price: 1 };
        case 'price:desc': return { price: -1 };
        case 'name:asc': return { name: 1 };
        case 'name:desc': return { name: -1 };
        case 'createdAt:desc': return { createdAt: -1 };
        case 'createdAt:asc': return { createdAt: 1 };
        default: return { createdAt: -1 };
    }
};

// @desc    Get all products with hybrid search
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res) => {
    try {
        const { category, search, sort, limit, page } = req.query;
        
        // Create cache key for this request
        const cacheKey = JSON.stringify({ category, search, sort, limit, page });
        
        // Check cache first
        const cachedResults = getCachedSearch(cacheKey);
        if (cachedResults) {
            return res.json(cachedResults);
        }

        let products;
        let total;

        // Pagination setup
        const pageNumber = parseInt(page, 10) || 1;
        const limitNumber = parseInt(limit, 10) || 10;
        const skip = (pageNumber - 1) * limitNumber;

        if (search && search.trim()) {
            // SIMPLIFIED SEARCH APPROACH - Skip Atlas Search for now, use reliable regex
            console.log(`Searching for: "${search}"`);
            
            // First, let's check if we have any products at all
            const totalProducts = await Product.countDocuments({});
            console.log(`Total products in database: ${totalProducts}`);
            
            const query = {
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { category: { $regex: search, $options: 'i' } }
                ]
            };

            // Add category filter
            if (category) {
                query.$and = [
                    { $or: query.$or },
                    { category: category }
                ];
                delete query.$or;
            }

            console.log('Search query:', JSON.stringify(query, null, 2));

            // Sort options
            const sortObj = getSortOption(sort);

            products = await Product.find(query)
                .sort(sortObj)
                .limit(limitNumber)
                .skip(skip)
                .lean(); // Use lean() for better performance

            total = await Product.countDocuments(query);

            console.log(`Regex Search used for: "${search}" - ${products.length} results out of ${total} total matches`);
            
            // Let's also test a simple search to see sample data
            if (products.length === 0) {
                const sampleProduct = await Product.findOne({}).lean();
                console.log('Sample product:', sampleProduct);
            }
        } else {
            // Regular product listing (no search)
            const query = category ? { category } : {};
            const sortObj = getSortOption(sort);

            products = await Product.find(query)
                .sort(sortObj)
                .limit(limitNumber)
                .skip(skip)
                .lean();

            total = await Product.countDocuments(query);
        }

        const response = {
            success: true,
            count: products.length,
            total,
            pagination: {
                current: pageNumber,
                pages: Math.ceil(total / limitNumber),
                hasNext: pageNumber * limitNumber < total,
                hasPrev: pageNumber > 1
            },
            data: products
        };

        // Cache the results
        setCachedSearch(cacheKey, response);

        res.json(response);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get single product
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get search suggestions
// @route   GET /api/products/suggestions
// @access  Public
exports.getSearchSuggestions = async (req, res) => {
    try {
        const { q } = req.query;
        
        if (!q || q.length < 1) {
            return res.json({
                success: true,
                data: []
            });
        }

        // Check cache for suggestions
        const cacheKey = `suggestions_${q.toLowerCase()}`;
        const cached = getCachedSearch(cacheKey);
        if (cached) {
            return res.json(cached);
        }

        // Get unique product names that match the query
        const suggestions = await Product.find({
            name: { $regex: q, $options: 'i' }
        })
        .select('name')
        .limit(8) // Increase limit for better suggestions
        .lean();

        const uniqueNames = [...new Set(suggestions.map(p => p.name))];

        const response = {
            success: true,
            data: uniqueNames
        };

        // Cache suggestions for 5 minutes
        setCachedSearch(cacheKey, response, 5 * 60 * 1000);

        res.json(response);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Admin
exports.createProduct = async (req, res) => {
    try {
        const product = await Product.create(req.body);

        res.status(201).json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Admin
exports.updateProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Delete product
// @route   DELETE /api/products/:id
// @access  Private/Admin
exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                success: false,
                error: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: {}
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get low stock products
// @route   GET /api/products/low-stock
// @access  Private/Admin
exports.getLowStockProducts = async (req, res) => {
    try {
        const products = await Product.find({
            $expr: {
                $lte: ['$stock', '$lowStockAlert']
            }
        });

        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};

// @desc    Get all product categories
// @route   GET /api/products/categories
// @access  Public
exports.getCategories = async (req, res) => {
    try {
        const categories = await Product.distinct('category');
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}; 