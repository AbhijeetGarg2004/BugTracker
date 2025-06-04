// bugtrackr-backend/routes/bugRoutes.js
const express = require('express');
const router = express.Router();
const {
  getAllBugs,
  createBug,
  updateBug,
  deleteBug,
} = require('../controllers/bugController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAllBugs)
  .post(protect, createBug);

router.route('/:id')
  .put(protect, updateBug)
  .delete(protect, deleteBug);

module.exports = router;
