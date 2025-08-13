# Product Database Seeder Script

This script adds 50 relevant electrical and hardware products to your MongoDB database.

## Products Included:
- **20 Electrical Products**: LED bulbs, copper wires, switches, motors, fans, etc.
- **20 Hardware Products**: Bolts, screws, pipes, valves, tools, etc.
- **10 Agri-tech Products**: Irrigation systems, solar panels, pumps, sensors, etc.

## How to Run:

### Method 1: Direct execution
```bash
cd server
node scripts/addProducts.js
```

### Method 2: Using npm script (add this to your package.json)
Add this to your server/package.json scripts section:
```json
"scripts": {
  "seed-products": "node scripts/addProducts.js"
}
```

Then run:
```bash
cd server
npm run seed-products
```

## Important Notes:

1. **Environment Variables**: Make sure your `.env` file has the correct `MONGO_URI`

2. **Database Connection**: The script will connect to your MongoDB database

3. **Existing Products**: The script will ADD new products without removing existing ones

4. **Product Images**: Image filenames are included but you'll need to add actual images to your public folder

5. **Categories**: Products are categorized as:
   - `electrical` - Motors, bulbs, wires, switches
   - `hardware` - Bolts, pipes, tools, locks
   - `agri-tech` - Irrigation, solar, pumps, sensors

## Sample Products Added:
- LED Bulbs (various wattages)
- Copper/Aluminum wires
- Electric motors and pumps
- Hardware fasteners and fittings
- Irrigation and solar equipment
- And many more relevant to Palani andavar's business

## After Running:
Check your database to confirm 50 new products have been added with proper pricing, stock levels, and categories.
