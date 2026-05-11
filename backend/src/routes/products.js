import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
  uploadProductImages
} from '../controllers/productController.js';
import { authenticateToken, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Admin routes (require authentication)
router.post('/', authenticateToken, isAdmin, createProduct);
router.put('/:id', authenticateToken, isAdmin, updateProduct);
router.delete('/:id', authenticateToken, isAdmin, deleteProduct);
router.patch('/:id/stock', authenticateToken, isAdmin, updateProductStock);
router.post('/:id/images', authenticateToken, isAdmin, uploadProductImages);

export default router;
