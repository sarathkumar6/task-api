const db = require('../db');
const AppError = require('../utils/AppError');

const createTask = async (request, response, next) => {
    try {
        console.log(
            "Tasks Controller createTask -> USER IS:", request.user
        )
        if (!request.user) {
            return next(new AppError('User not authenticated correctly', 401));
        }
        const { title, description } = request.body
        const { user } = request;
        const userId = user.userId;
    const newTask = await db.task.create({
        data: {
            title,
            description,
            userId: userId // Linking the Foreign key
        }
    });

    response.status(201).json(newTask);

    } catch (error) {
        next(error);
    }
};

const getMyTasks = async (request, response, next) => {
    try {
        const userId = request.user.userId;

        const tasks = await db.task.findMany({
            where: {
                userId: userId // Filter particular user
            },
            orderBy: {
                createdAt: 'desc' // by latest first
            }
        });

        response.json(tasks)
    } catch (error) {
        next(error);
    }
};

const deleteTask = async (request, response, next) => {
    try {
        const taskId = parseInt(request.params.id)
        const userId = request.user.userId;

        const result = await db.task.deleteMany({
            where: {
                id: taskId,
                userId: userId
            }
        });

        if (result.count === 0) {
            return next(new AppError('Task not found or unauthorized', 404));
        }
        response.status(204).send(); // 204 is Standard for successful delete
    } catch (error) {
        next(error)
    }
};

const updateTask = async (request, response, next) => {
    try {
        const userId = request.user.userId;
        const { id } = request.params;
        const { title, description } = request.body;
        if (!id) {
            return next(new AppError('Task id is required', 400));
        }
        const result = await db.task.updateMany({
            where: { id: parseInt(id), userId: userId },
            data: {
                ...(title && {title: title}),
                ...(description && {description: description})
            }
        });

        if (result.count === 0) {
            return next(new AppError(`No task found wth the id ${id} for the user id ${userId}`, 404))
        }
        const updatedTask = await db.task.findUnique({
            where: {
                id: parseInt(id)
            }
        });
        response.status(200).json({
            status: 'success',
            data: updatedTask
        });

    } catch (error) {
        next(error)
    }
};

module.exports = { createTask, getMyTasks, deleteTask, updateTask };