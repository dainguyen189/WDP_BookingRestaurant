const express = require('express');
const { getUsers, getUserById, createUser, updateUser, deleteUser, getUserBySessionId, searchUser, changePassword } = require('../controller/user');
const { verifyAdmin, verifyUser } = require('../util/verifyToken');

const router = express.Router();

router.get('/', verifyAdmin, getUsers);
router.get('/search', searchUser);
router.get('/:id', verifyUser, getUserById);
router.get('/session/:sessionId', getUserBySessionId);
router.post('/createUser', verifyAdmin, createUser);
router.put('/updateUser/:id', verifyUser, updateUser);
router.delete('/deleteUser/:id', verifyUser, deleteUser);

router.put('/change-password/:id', verifyUser, changePassword);

module.exports = router;
