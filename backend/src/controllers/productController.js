import db from '../config/database.js';

// Get all products with filters
export const getAllProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, active = true } = req.query;

    let query = 'SELECT * FROM products WHERE 1=1';
    const params = [];

    if (category) {
      query += ' AND category_id = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (name LIKE ? OR code LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (minPrice) {
      query += ' AND price >= ?';
      params.push(minPrice);
    }

    if (maxPrice) {
      query += ' AND price <= ?';
      params.push(maxPrice);
    }

    query += ' AND active = ?';
    params.push(active);

    query += ' ORDER BY created_at DESC';

    const products = await db.query(query, params);

    res.json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single product by ID
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.query('SELECT * FROM products WHERE id = ?', [id]);

    if (!product.length) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ success: true, data: product[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create new product
export const createProduct = async (req, res) => {
  try {
    const { code, name, description, category_id, price, stock } = req.body;

    const query = `
      INSERT INTO products (code, name, description, category_id, price, stock)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const result = await db.query(query, [code, name, description, category_id, price, stock || 0]);

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      id: result.insertId
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const query = `UPDATE products SET ? WHERE id = ?`;
    await db.query(query, [updates, id]);

    res.json({
      success: true,
      message: 'Product updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM products WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update stock
export const updateProductStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    await db.query('UPDATE products SET stock = ? WHERE id = ?', [stock, id]);

    res.json({
      success: true,
      message: 'Stock updated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload product images
export const uploadProductImages = async (req, res) => {
  try {
    const { id } = req.params;
    const images = req.files; // Multer middleware

    // Save images to database
    const queries = images.map((img, index) => {
      return db.query(
        'INSERT INTO product_images (product_id, image_url, display_order) VALUES (?, ?, ?)',
        [id, img.path, index]
      );
    });

    await Promise.all(queries);

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      count: images.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
