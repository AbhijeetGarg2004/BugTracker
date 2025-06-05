// bugtrackr-backend/controllers/projectController.js

const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Create a new project (admin only)
// @route   POST /api/projects
// @access  Private (admin)
exports.createProject = async (req, res) => {
  const { name, description, members } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: 'Project name and description are required' });
  }

  try {
    // Validate members array if provided
    let validMemberIds = [];
    if (Array.isArray(members) && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } }).select('_id');
      validMemberIds = validMembers.map(u => u._id);
    }

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: validMemberIds,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get all projects (any authenticated user)
// @route   GET /api/projects
// @access  Private
exports.getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate('createdBy', 'name email')
      .populate('members', 'name email');
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update a project (admin only)
// @route   PUT /api/projects/:id
// @access  Private (admin)
exports.updateProject = async (req, res) => {
  const { id } = req.params;
  const { name, description, members } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: 'Project name and description are required' });
  }

  try {
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Validate members if provided
    let validMemberIds = [];
    if (Array.isArray(members) && members.length > 0) {
      const validMembers = await User.find({ _id: { $in: members } }).select('_id');
      validMemberIds = validMembers.map(u => u._id);
    }

    project.name = name;
    project.description = description;
    project.members = validMemberIds;

    const updatedProject = await project.save();
    const populatedProject = await updatedProject
      .populate('createdBy', 'name email')
      .populate('members', 'name email')
      .execPopulate();

    res.json(populatedProject);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error while updating project' });
  }
};

// @desc    Delete a project (admin only)
// @route   DELETE /api/projects/:id
// @access  Private (admin)
exports.deleteProject = async (req, res) => {
  const { id } = req.params;

  try {
    const project = await Project.findByIdAndDelete(id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error while deleting project' });
  }
};
