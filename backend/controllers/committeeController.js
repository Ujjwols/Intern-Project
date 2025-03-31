const Committee = require('../models/committeFormModel.js');
const fs = require('fs');
const path = require('path');

// @desc    Create a new committee
// @route   POST /api/committees
// @access  Public
const createCommittee = async (req, res) => {
  try {
    const { 
      name, 
      purpose, 
      formationDate, 
      specificationSubmissionDate,
      reviewDate,
      schedule,
      members
    } = req.body;

    // Improved members data handling
    let membersArray = [];
    if (members) {
      try {
        // Handle both stringified JSON and already-parsed objects
        membersArray = typeof members === 'string' ? JSON.parse(members) : members;
        
        // Ensure it's always an array
        if (!Array.isArray(membersArray)) {
          membersArray = [membersArray];
        }
      } catch (parseError) {
        console.error('Error parsing members:', parseError);
        return res.status(400).json({ 
          message: 'Invalid members format. Expected JSON array.' 
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
      formationLetter: req.file ? {
        filename: req.file.filename,
        path: req.file.path,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });

    await committee.save();
    res.status(201).json(committee);
  } catch (error) {
    console.error('Error creating committee:', error);
    res.status(500).json({ 
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Get all committees
// @route   GET /api/committees
// @access  Public
const getCommittees = async (req, res) => {
  try {
    const committees = await Committee.find().sort('-createdAt');
    res.json({
      success: true,
      count: committees.length,
      data: committees
    });
  } catch (error) {
    console.error('Error fetching committees:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get single committee
// @route   GET /api/committees/:id
// @access  Public
const getCommittee = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id);
    if (!committee) {
      return res.status(404).json({ 
        success: false,
        message: 'Committee not found' 
      });
    }
    res.json({
      success: true,
      data: committee
    });
  } catch (error) {
    console.error('Error fetching committee:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Download formation letter
// @route   GET /api/committees/:id/download
// @access  Public
const downloadFormationLetter = async (req, res) => {
  try {
    const committee = await Committee.findById(req.params.id);
    
    if (!committee) {
      return res.status(404).json({ 
        success: false,
        message: 'Committee not found' 
      });
    }
    
    if (!committee.formationLetter) {
      return res.status(404).json({ 
        success: false,
        message: 'No formation letter found for this committee' 
      });
    }

    const filePath = path.join(__dirname, '../', committee.formationLetter.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false,
        message: 'File not found on server' 
      });
    }

    res.download(filePath, committee.formationLetter.originalname);
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server Error'
    });
  }
};

module.exports = {
  createCommittee,
  getCommittees,
  getCommittee,
  downloadFormationLetter
};