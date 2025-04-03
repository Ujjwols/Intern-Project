const express = require('express');
const router = express.Router();
const upload = require('../config/multer.js');
const authController = require('../controllers/authController.js');
const {
  createCommittee,
  getCommittees,
  getCommittee,
  downloadFormationLetter
} = require('../controllers/committeeController.js');

// Protect all committee routes
router.use(authController.protect);

// POST /api/committees - Create new committee
router.post('/createcommittees', upload.single('formationLetter'), createCommittee);

// GET /api/committees - Get all committees
router.get('/getallcommittee', getCommittees);

// GET /api/committees/:id - Get single committee
router.get('/getcommitteebyid/:id', getCommittee);

// GET /api/committees/:id/download - Download formation letter
router.get('/:id/download', downloadFormationLetter);

module.exports = router;