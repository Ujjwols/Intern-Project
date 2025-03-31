const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const {
  createCommittee,
  getCommittees,
  getCommittee,
  downloadFormationLetter
} = require('../controllers/committeeController');

// POST /api/committees - Create new committee
router.post('/createcommittees', upload.single('formationLetter'), createCommittee);

// GET /api/committees - Get all committees
router.get('/getcommittees', getCommittees);

// GET /api/committees/:id - Get single committee
router.get('getcommitteebyid/:id', getCommittee);

// GET /api/committees/:id/download - Download formation letter
router.get('/:id/download', downloadFormationLetter);

module.exports = router;