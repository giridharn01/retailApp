const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Product = require('../src/models/Product');

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection failed:', error);
        process.exit(1);
    }
};

// Sample products data for electrical and hardware business
const sampleProducts = [
    // Electrical Products
    {
        name: "LED Bulb 12W Cool White",
        description: "Energy efficient 12W LED bulb with cool white light, perfect for offices and workspaces",
        price: 180,
        category: "electrical",
        stock: 75,
        image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?w=400&h=400&fit=crop"
    },
    {
        name: "LED Bulb 15W Warm White",
        description: "Warm white 15W LED bulb ideal for living rooms and bedrooms",
        price: 220,
        category: "electrical",
        stock: 60,
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop"
    },
    {
        name: "CFL Bulb 20W",
        description: "Compact Fluorescent Lamp 20W for energy saving lighting",
        price: 85,
        category: "electrical",
        stock: 40,
        image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=400&fit=crop"
    },
    {
        name: "Tube Light 40W",
        description: "Standard 40W fluorescent tube light for commercial spaces",
        price: 150,
        category: "electrical",
        stock: 30,
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop"
    },
    {
        name: "Copper Wire 2.5mm",
        description: "High quality copper electrical wire 2.5mm for household wiring",
        price: 320,
        category: "electrical",
        stock: 100,
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop"
    },
    {
        name: "Copper Wire 4mm",
        description: "Heavy duty 4mm copper wire for industrial electrical installations",
        price: 480,
        category: "electrical",
        stock: 85,
        image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop"
    },
    {
        name: "Aluminum Wire 6mm",
        description: "Cost-effective aluminum electrical wire 6mm for large installations",
        price: 280,
        category: "electrical",
        stock: 70,
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop"
    },
    {
        name: "Electric Switch 2-Way",
        description: "Modular 2-way electric switch with elegant white finish",
        price: 45,
        category: "electrical",
        stock: 120,
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    },
    {
        name: "Electric Switch 3-Way",
        description: "Premium 3-way modular switch for multiple light control",
        price: 65,
        category: "electrical",
        stock: 90,
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop"
    },
    {
        name: "Power Socket 2-Pin",
        description: "Standard 2-pin power socket for household appliances",
        price: 35,
        category: "electrical",
        stock: 150,
        image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop"
    },
    {
        name: "Power Socket 3-Pin",
        description: "3-pin power socket with earth connection for safety",
        price: 55,
        category: "electrical",
        stock: 110,
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop"
    },
    {
        name: "Extension Cord 5m",
        description: "Heavy duty 5-meter extension cord with multiple sockets",
        price: 350,
        category: "electrical",
        stock: 45,
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    },
    {
        name: "Circuit Breaker 32A",
        description: "Single pole 32A MCB circuit breaker for electrical protection",
        price: 180,
        category: "electrical",
        stock: 65,
        image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop"
    },
    {
        name: "Distribution Box 8-Way",
        description: "8-way electrical distribution box for home wiring",
        price: 450,
        category: "electrical",
        stock: 25,
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop"
    },
    {
        name: "Electric Motor 1HP",
        description: "Single phase 1HP electric motor for water pumps and machinery",
        price: 3500,
        category: "electrical",
        stock: 15,
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop"
    },
    {
        name: "Electric Motor 2HP",
        description: "Three phase 2HP electric motor for industrial applications",
        price: 6800,
        category: "electrical",
        stock: 10,
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop"
    },
    {
        name: "Submersible Pump 0.5HP",
        description: "0.5HP submersible water pump for bore wells",
        price: 4200,
        category: "electrical",
        stock: 12,
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    },
    {
        name: "Table Fan 400mm",
        description: "High speed 400mm table fan with 3-speed control",
        price: 1200,
        category: "electrical",
        stock: 35,
        image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop"
    },
    {
        name: "Ceiling Fan 1200mm",
        description: "Energy efficient 1200mm ceiling fan with remote control",
        price: 2800,
        category: "electrical",
        stock: 20,
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop"
    },
    {
        name: "Electric Stabilizer 2kVA",
        description: "Automatic voltage stabilizer 2kVA for home appliances",
        price: 3200,
        category: "electrical",
        stock: 18,
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop"
    },

    // Hardware Products
    {
        name: "Steel Bolt M8x50",
        description: "High tensile steel bolt M8x50 with nut and washer",
        price: 8,
        category: "hardware",
        stock: 500,
        image: "https://images.unsplash.com/photo-1609205803522-0b4bbc7e59a1?w=400&h=400&fit=crop"
    },
    {
        name: "Steel Bolt M10x75",
        description: "Heavy duty steel bolt M10x75 for construction work",
        price: 12,
        category: "hardware",
        stock: 400,
        image: "https://images.unsplash.com/photo-1609205803889-c0f4e6c7e9e7?w=400&h=400&fit=crop"
    },
    {
        name: "Hex Nut M8",
        description: "Galvanized hex nut M8 for secure fastening",
        price: 3,
        category: "hardware",
        stock: 800,
        image: "https://images.unsplash.com/photo-1609205803522-0b4bbc7e59a1?w=400&h=400&fit=crop"
    },
    {
        name: "Washer 8mm",
        description: "Steel washer 8mm for even load distribution",
        price: 2,
        category: "hardware",
        stock: 1000,
        image: "https://images.unsplash.com/photo-1609205803889-c0f4e6c7e9e7?w=400&h=400&fit=crop"
    },
    {
        name: "Wood Screw 2x25",
        description: "Self-tapping wood screw 2x25mm for carpentry work",
        price: 1.5,
        category: "hardware",
        stock: 1200,
        image: "https://images.unsplash.com/photo-1609205803522-0b4bbc7e59a1?w=400&h=400&fit=crop"
    },
    {
        name: "Metal Screw 4x40",
        description: "Metal self-drilling screw 4x40mm for sheet metal",
        price: 3,
        category: "hardware",
        stock: 800,
        image: "https://images.unsplash.com/photo-1609205803889-c0f4e6c7e9e7?w=400&h=400&fit=crop"
    },
    {
        name: "Door Hinge 3 inch",
        description: "Stainless steel door hinge 3 inch with screws",
        price: 85,
        category: "hardware",
        stock: 150,
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    },
    {
        name: "Door Lock Mortise",
        description: "Heavy duty mortise door lock with 3 keys",
        price: 680,
        category: "hardware",
        stock: 45,
        image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop"
    },
    {
        name: "Padlock 50mm",
        description: "Brass padlock 50mm with 2 keys for security",
        price: 220,
        category: "hardware",
        stock: 80,
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop"
    },
    {
        name: "Window Handle",
        description: "Aluminum window handle with locking mechanism",
        price: 180,
        category: "hardware",
        stock: 60,
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    },
    {
        name: "Steel Pipe 1 inch",
        description: "Galvanized steel pipe 1 inch diameter for plumbing",
        price: 320,
        category: "hardware",
        stock: 75,
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop"
    },
    {
        name: "PVC Pipe 2 inch",
        description: "Heavy duty PVC pipe 2 inch for drainage systems",
        price: 180,
        category: "hardware",
        stock: 90,
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop"
    },
    {
        name: "Pipe Elbow 90°",
        description: "PVC pipe elbow 90 degree for direction changes",
        price: 25,
        category: "hardware",
        stock: 200,
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop"
    },
    {
        name: "Pipe T-Junction",
        description: "PVC T-junction fitting for pipe branching",
        price: 35,
        category: "hardware",
        stock: 150,
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop"
    },
    {
        name: "Valve Ball 1 inch",
        description: "Brass ball valve 1 inch for water flow control",
        price: 280,
        category: "hardware",
        stock: 55,
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    },
    {
        name: "Tap Handle",
        description: "Chrome plated tap handle for bathroom and kitchen",
        price: 120,
        category: "hardware",
        stock: 85,
        image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop"
    },
    {
        name: "Steel Wire Rope 6mm",
        description: "Galvanized steel wire rope 6mm for lifting applications",
        price: 45,
        category: "hardware",
        stock: 120,
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop"
    },
    {
        name: "Chain Link 8mm",
        description: "Heavy duty chain link 8mm for security and lifting",
        price: 65,
        category: "hardware",
        stock: 100,
        image: "https://images.unsplash.com/photo-1609205803522-0b4bbc7e59a1?w=400&h=400&fit=crop"
    },
    {
        name: "Rope Nylon 10mm",
        description: "Strong nylon rope 10mm for general purpose use",
        price: 35,
        category: "hardware",
        stock: 150,
        image: "https://images.unsplash.com/photo-1609205803889-c0f4e6c7e9e7?w=400&h=400&fit=crop"
    },
    {
        name: "Tool Box Metal",
        description: "Heavy duty metal tool box with multiple compartments",
        price: 850,
        category: "hardware",
        stock: 25,
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    },

    // Agri-tech Products
    {
        name: "Drip Irrigation Kit",
        description: "Complete drip irrigation kit for 1-acre farm with timers",
        price: 8500,
        category: "agri-tech",
        stock: 8,
        image: "https://images.unsplash.com/photo-1574263867128-0948a7d88db8?w=400&h=400&fit=crop"
    },
    {
        name: "Sprinkler System",
        description: "360-degree rotating sprinkler system for lawn irrigation",
        price: 1200,
        category: "agri-tech",
        stock: 35,
        image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop"
    },
    {
        name: "Water Timer Digital",
        description: "Digital water timer for automated irrigation control",
        price: 2800,
        category: "agri-tech",
        stock: 15,
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    },
    {
        name: "Pressure Gauge",
        description: "Water pressure gauge for pump and irrigation monitoring",
        price: 380,
        category: "agri-tech",
        stock: 45,
        image: "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop"
    },
    {
        name: "Water Flow Meter",
        description: "Digital water flow meter for irrigation efficiency",
        price: 1500,
        category: "agri-tech",
        stock: 20,
        image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop"
    },
    {
        name: "Solar Panel 100W",
        description: "100W solar panel for agricultural water pumping systems",
        price: 4500,
        category: "agri-tech",
        stock: 12,
        image: "https://images.unsplash.com/photo-1509391366360-2e959784a276?w=400&h=400&fit=crop"
    },
    {
        name: "Solar Controller 20A",
        description: "20A MPPT solar charge controller for battery systems",
        price: 2200,
        category: "agri-tech",
        stock: 18,
        image: "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=400&fit=crop"
    },
    {
        name: "Deep Well Pump 3HP",
        description: "High efficiency 3HP deep well pump for agricultural use",
        price: 15000,
        category: "agri-tech",
        stock: 5,
        image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?w=400&h=400&fit=crop"
    },
    {
        name: "Water Tank 1000L",
        description: "Food grade plastic water tank 1000L for water storage",
        price: 3800,
        category: "agri-tech",
        stock: 10,
        image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=400&fit=crop"
    },
    {
        name: "Soil Moisture Sensor",
        description: "Digital soil moisture sensor for precision agriculture",
        price: 850,
        category: "agri-tech",
        stock: 30,
        image: "https://images.unsplash.com/photo-1574263867128-0948a7d88db8?w=400&h=400&fit=crop"
    }
];

// Function to add products to database
const addProducts = async () => {
    try {
        // Clear existing products (optional - remove this line if you want to keep existing products)
        // await Product.deleteMany({});
        // console.log('Existing products cleared');

        // Insert new products
        const insertedProducts = await Product.insertMany(sampleProducts);
        console.log(`Successfully added ${insertedProducts.length} products to the database`);
        
        // Display summary
        const categoryCount = {
            electrical: insertedProducts.filter(p => p.category === 'electrical').length,
            hardware: insertedProducts.filter(p => p.category === 'hardware').length,
            'agri-tech': insertedProducts.filter(p => p.category === 'agri-tech').length
        };
        
        console.log('\nProducts added by category:');
        console.log(`Electrical: ${categoryCount.electrical}`);
        console.log(`Hardware: ${categoryCount.hardware}`);
        console.log(`Agri-tech: ${categoryCount['agri-tech']}`);
        
    } catch (error) {
        console.error('Error adding products:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Run the script
const runScript = async () => {
    await connectDB();
    await addProducts();
};

runScript();
