// bugtrackr-backend/routes/projectRoutes.js

const express = require('express');
const router = express.Router();
const {
  createProject,
  getAllProjects,
  updateProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// GET all projects, POST create project (admin only)
router
  .route('/')
  .get(protect, getAllProjects)
  .post(protect, adminOnly, createProject);

// PUT update project, DELETE project (admin only)
router
  .route('/:id')
  .put(protect, adminOnly, updateProject)
  .delete(protect, adminOnly, deleteProject);

module.exports = router;
