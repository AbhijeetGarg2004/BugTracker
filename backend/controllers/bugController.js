// bugtrackr-backend/controllers/bugController.js

const Bug = require('../models/Bug');
const User = require('../models/User');
const Project = require('../models/Project');

// @desc    Get all bugs (dashboard listing)
// @route   GET /api/bugs
// @access  Private (any authenticated user)
exports.getAllBugs = async (req, res) => {
  try {
    const bugs = await Bug.find()
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .populate('reportedBy', 'name email')
      .sort({ createdAt: -1 });

    const formatted = bugs.map((bug) => ({
      _id: bug._id,
      title: bug.title,
      description: bug.description,
      status: bug.status,
      priority: bug.priority,
      project: bug.project
        ? { _id: bug.project._id, name: bug.project.name }
        : null,
      assignee: bug.assignee
        ? { _id: bug.assignee._id, name: bug.assignee.name, email: bug.assignee.email }
        : null,
      reportedBy: bug.reportedBy
        ? { _id: bug.reportedBy._id, name: bug.reportedBy.name, email: bug.reportedBy.email }
        : null,
      createdAt: bug.createdAt,
      updatedAt: bug.updatedAt,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get all bugs error:', error);
    res.status(500).json({ message: 'Server error while fetching bugs' });
  }
};

// @desc    Create a new bug
// @route   POST /api/bugs
// @access  Private (any authenticated user)
exports.createBug = async (req, res) => {
  const { title, description, priority, project, assignee } = req.body;

  if (!title || !description || !priority || !project) {
    return res.status(400).json({
      message: 'Title, description, priority, and project are required',
    });
  }

  try {
    // Validate project exists
    const projectExists = await Project.findById(project);
    if (!projectExists) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Validate assignee if provided
    let assigneeUser = null;
    if (assignee) {
      const userExists = await User.findById(assignee);
      if (!userExists) {
        return res.status(404).json({ message: 'Assignee user not found' });
      }
      assigneeUser = userExists._id;
    }

    const newBug = new Bug({
      title,
      description,
      priority,
      project: projectExists._id,
      assignee: assigneeUser,
      reportedBy: req.user._id,
      status: 'Open',
    });

    const savedBug = await newBug.save();

    // Re-fetch and populate
    const populatedBug = await Bug.findById(savedBug._id)
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .populate('reportedBy', 'name email');

    res.status(201).json({
      _id: populatedBug._id,
      title: populatedBug.title,
      description: populatedBug.description,
      status: populatedBug.status,
      priority: populatedBug.priority,
      project: populatedBug.project
        ? { _id: populatedBug.project._id, name: populatedBug.project.name }
        : null,
      assignee: populatedBug.assignee
        ? { _id: populatedBug.assignee._id, name: populatedBug.assignee.name, email: populatedBug.assignee.email }
        : null,
      reportedBy: populatedBug.reportedBy
        ? { _id: populatedBug.reportedBy._id, name: populatedBug.reportedBy.name, email: populatedBug.reportedBy.email }
        : null,
      createdAt: populatedBug.createdAt,
      updatedAt: populatedBug.updatedAt,
    });
  } catch (error) {
    console.error('Create bug error:', error);
    res.status(500).json({ message: 'Server error while creating bug' });
  }
};

// @desc    Update a bug (status, priority, assignee)
// @route   PUT /api/bugs/:id
// @access  Private (admin or current assignee)
exports.updateBug = async (req, res) => {
  const { id } = req.params;
  const updates = req.body; // { status, priority, assignee }

  try {
    const bug = await Bug.findById(id);
    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    // Only admin or current assignee can update
    if (
      req.user.role !== 'admin' &&
      bug.assignee?.toString() !== req.user._id.toString()
    ) {
      return res
        .status(403)
        .json({ message: 'Not authorized to update this bug' });
    }

    // Validate assignee if updating
    if (updates.assignee) {
      const newAssignee = await User.findById(updates.assignee);
      if (!newAssignee) {
        return res.status(404).json({ message: 'New assignee user not found' });
      }
    }

    // Apply updates
    if (updates.status) bug.status = updates.status;
    if (updates.priority) bug.priority = updates.priority;
    if (updates.assignee !== undefined) bug.assignee = updates.assignee;

    const updatedBug = await bug.save();

    const populatedUpdatedBug = await Bug.findById(updatedBug._id)
      .populate('project', 'name')
      .populate('assignee', 'name email')
      .populate('reportedBy', 'name email');

    res.json({
      _id: populatedUpdatedBug._id,
      title: populatedUpdatedBug.title,
      description: populatedUpdatedBug.description,
      status: populatedUpdatedBug.status,
      priority: populatedUpdatedBug.priority,
      project: populatedUpdatedBug.project
        ? { _id: populatedUpdatedBug.project._id, name: populatedUpdatedBug.project.name }
        : null,
      assignee: populatedUpdatedBug.assignee
        ? { _id: populatedUpdatedBug.assignee._id, name: populatedUpdatedBug.assignee.name, email: populatedUpdatedBug.assignee.email }
        : null,
      reportedBy: populatedUpdatedBug.reportedBy
        ? { _id: populatedUpdatedBug.reportedBy._id, name: populatedUpdatedBug.reportedBy.name, email: populatedUpdatedBug.reportedBy.email }
        : null,
      createdAt: populatedUpdatedBug.createdAt,
      updatedAt: populatedUpdatedBug.updatedAt,
    });
  } catch (error) {
    console.error('Update bug error:', error);
    res.status(500).json({ message: 'Server error while updating bug' });
  }
};

// @desc    Delete a bug
// @route   DELETE /api/bugs/:id
// @access  Private (admin only)
exports.deleteBug = async (req, res) => {
  const { id } = req.params;

  try {
    const bug = await Bug.findById(id);
    if (!bug) {
      return res.status(404).json({ message: 'Bug not found' });
    }

    // Only admin can delete
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admins only can delete bugs' });
    }

    await bug.remove();

    res.json({ message: 'Bug removed' });
  } catch (error) {
    console.error('Delete bug error:', error);
    res.status(500).json({ message: 'Server error while deleting bug' });
  }
};
