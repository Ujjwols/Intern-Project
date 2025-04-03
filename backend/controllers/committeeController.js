const Committee = require('../models/committeFormModel.js');
const User = require('../models/userModel.js');
const fs = require('fs');
const path = require('path');
const AppError = require('../utils/appError.js');
const nodemailer = require('nodemailer');

// @desc    Create a new committee
// @route   POST /api/committees
const createCommittee = async (req, res, next) => {
  try {
    const { 
      name, 
      purpose, 
      formationDate, 
      specificationSubmissionDate,
      reviewDate,
      schedule,
      members,
      shouldNotify
    } = req.body;

    // Process members
    let membersArray = [];
    if (members && members.length > 0) {
      let memberData = typeof members === 'string' ? JSON.parse(members) : members;
      
      // Handle both array of strings and array of objects
      const memberIds = memberData.map(m => 
        typeof m === 'string' ? m : (m.employeeId || '')
      );

      if (!memberIds.every(id => typeof id === 'string' && id.trim() !== '')) {
        return next(new AppError('All member IDs must be non-empty strings', 400));
      }

      for (const employeeId of memberIds) {
        const user = await User.findOne({ employeeId });
        if (!user) {
          return next(new AppError(`User with employee ID ${employeeId} not found`, 404));
        }
        
        membersArray.push({
          name: user.name,
          role: user.role,
          email: user.email,
          employeeId: user.employeeId,
          department: user.department,
          designation: user.designation
        });
      }
    }

    const committee = new Committee({
      name,
      purpose,
      formationDate,
      specificationSubmissionDate,
      reviewDate,
      schedule,
      members: membersArray,
      createdBy: req.user._id,
      formationLetter: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    await committee.save();
    
    // Populate the createdBy field before sending response
    const populatedCommittee = await Committee.findById(committee._id)
      .populate('createdBy', 'name email role employeeId');

    // Send notifications if requested
    if (shouldNotify === 'true') {
      await sendCommitteeNotifications(populatedCommittee);
    }

    res.status(201).json({
      status: 'success',
      data: { committee: populatedCommittee }
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, err => {
        if (err) console.error('Error deleting uploaded file:', err);
      });
    }
    next(error);
  }
};

// @desc    Get all committees with creator details
// @route   GET /api/committees
const getCommittees = async (req, res, next) => {
  try {
    const committees = await Committee.find()
      .sort('-createdAt')
      .populate('createdBy', 'name email role employeeId');

    res.status(200).json({
      status: 'success',
      results: committees.length,
      data: { committees }
    });
  } catch (error) {
    next(new AppError('Failed to fetch committees', 500));
  }
};

// @desc    Get single committee with creator details
// @route   GET /api/committees/:id
const getCommittee = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id)
      .populate('createdBy', 'name email role employeeId');

    if (!committee) {
      return next(new AppError('Committee not found', 404));
    }

    res.status(200).json({
      status: 'success',
      data: { committee }
    });
  } catch (error) {
    next(new AppError('Failed to fetch committee', 500));
  }
};

// @desc    Download formation letter
// @route   GET /api/committees/:id/download
const downloadFormationLetter = async (req, res, next) => {
  try {
    const committee = await Committee.findById(req.params.id);
    
    if (!committee) {
      return next(new AppError('Committee not found', 404));
    }
    
    if (!committee.formationLetter) {
      return next(new AppError('No formation letter found', 404));
    }

    const filePath = path.join(__dirname, '../', committee.formationLetter.path);
    if (!fs.existsSync(filePath)) {
      return next(new AppError('File not found on server', 404));
    }

    res.download(filePath, committee.formationLetter.originalname);
  } catch (error) {
    next(new AppError('Error downloading file', 500));
  }
};

// Helper function for sending notifications
const sendCommitteeNotifications = async (committee) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailPromises = committee.members.map(member => {
      return transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: member.email,
        subject: `You've been added to committee: ${committee.name}`,
        html: `
          <h1>Committee Assignment</h1>
          <p>You have been added to the committee <strong>${committee.name}</strong>.</p>
          <p>Purpose: ${committee.purpose}</p>
          <p>Formation Date: ${new Date(committee.formationDate).toLocaleDateString()}</p>
          ${committee.formationLetter ? `<p>A formation letter is attached to this committee.</p>` : ''}
          <p>Created by: ${committee.createdBy.name}</p>
        `
      });
    });

    await Promise.all(mailPromises);
    console.log(`Notifications sent for committee ${committee._id}`);
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
};

module.exports = {
  createCommittee,
  getCommittees,
  getCommittee,
  downloadFormationLetter
};