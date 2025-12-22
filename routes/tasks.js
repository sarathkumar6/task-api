const express = require('express');
const router = express.Router();
const { authenticationToken } = require('../middleware/authMiddleware');
const taskController = require('../controllers/tasks');

console.log('DEBUG CHECK: ', taskController);
const { createTask, getMyTasks, deleteTask, updateTask } = taskController;

router.use(authenticationToken);

router.post('/', createTask);
router.get('/', getMyTasks);
router.delete('/:id', deleteTask);
router.patch('/:id', updateTask);

module.exports = router;