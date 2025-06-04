const Project = require('../models/Project');
const User = require('../models/User');

// Create project (Admin only)
exports.createProject = async (req, res) => {
  const { name, description, members } = req.body;

  if (!name || !description) {
    return res.status(400).json({ message: 'Project name and description are required' });
  }

  try {
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

// Get all projects (authenticated users)
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
