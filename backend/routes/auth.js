
const express = require('express');
const router = express.Router();

const { login, addHR } = require('../controllers/authController');

router.post('/login', login);
router.post('/add-hr', addHR);

module.exports = router;
