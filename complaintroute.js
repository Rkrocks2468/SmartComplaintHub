const express = require('express');
const Complaint = require('../models/Complaint');
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const { categorizeComplaint } = require('../utils/geminiService');

const router = express.Router();

/**
 * @route   POST /api/complaints
 * @desc    Submit a new complaint
 * @access  Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { title, description, room } = req.body;

    const combinedText = `${title} - ${description}`;
    const category = await categorizeComplaint(combinedText);

    const complaint = new Complaint({
      title,
      description,
      room,
      category,
      status: 'pending',
      user: req.user.id
    });

    await complaint.save();
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit complaint' });
  }
});

/**
 * @route   GET /api/complaints
 * @desc    Get complaints of logged-in user
 * @access  Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find({ user: req.user.id })
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch {
    res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

/**
 * @route   GET /api/complaints/admin
 * @desc    Admin: Get all complaints
 * @access  Private (Admin only)
 */
router.get('/admin', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const complaints = await Complaint.find()
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch {
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private (Admin or Owner)
 */
router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const user = await User.findById(req.user.id);

    if (!user.isAdmin && complaint.user.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    complaint.status = req.body.status || complaint.status;
    await complaint.save();

    res.json({ message: 'Status updated', complaint });
  } catch {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Delete a complaint
 * @access  Private (Admin only)
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    await complaint.deleteOne();
    res.json({ message: 'Complaint deleted' });
  } catch {
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
