const express = require('express');
const router = express.Router();
const { createProject, getAllProjects } = require('../controllers/projectController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.route('/')
  .get(protect, getAllProjects)
  .post(protect, adminOnly, createProject);

module.exports = router;
