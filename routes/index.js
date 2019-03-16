const express = require('express'),
    path = require('path');

const router = express.Router();

router.use((req, res, next) => {
    res.data = res.data || {};
    res.data.notifications = req.notifications;
    next();
});

router.use('/user', require(path.join(__dirname, 'user')));
router.use('/project',  require(path.join(__dirname, 'project')));
router.use('/team',  require(path.join(__dirname, 'project/team')));
router.use('/recruitment',  require(path.join(__dirname, 'project/recruitment')));
router.use('/reports',  require(path.join(__dirname, 'project/reports')));
router.use('/profile', require(path.join(__dirname, 'profile')));

module.exports = router;
