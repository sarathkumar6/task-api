const db = require('../db');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { transferTaskOwnership } = require('../services/taskService');

const createTask = async (request, response, next) => {
    try {
        logger.info(
            `Task creation is initiated by User: ${request.user.userId}`
        );
        if (!request.user) {
            logger.warn('Task createion attempted without valid suer context');
            return next(new AppError('User not authenticated correctly', 401));
        }
        const { title, description } = request.body
        const { user } = request;
        const userId = user.userId;

        logger.debug(`Task Payload: ${JSON.stringify({
            title, description, userId
        })}`)
        const newTask = await db.task.create({
            data: {
                title,
                description,
                userId: userId // Linking the Foreign key
            }
        });
        logger.info(`Task created successfully. Task ID: ${newTask.id}`)
        response.status(201).json(newTask);

    } catch (error) {
        logger.error(`Create Task Failed: ${error.message}`, {
            stack: error.stack
        });
        next(error);
    }
};

const transferTask = async (request, response, next) => {
    try {
        logger.info('Transfer Task - Not implemented yet');
        const taskId = request.params.id;
        const fromUserId = request.user.userId; // Get it from JST Payload
        const { toUserId } = request.body
        const clientIP = request.user.ClientIP;

        if (!toUserId) {
            return response.status(400).json({
                status: 'error',
                message: 'toUserId is required in the request body'
            });
        }
        const params = { taskId, fromUserId, toUserId, clientIP };
        logger.info(`Initiating transfer with params: ${JSON.stringify(params)}`);
        const updatedTask = await transferTaskOwnership(params);

        response.status(200).json({
            status: 'Task transferred successfully',
            data: updatedTask
        });
    } catch (error) {
        next(error);
    }

};

const getMyTasks = async (request, response, next) => {
    try {
        const userId = request.user.userId;

        logger.info(`Fetching tasks for User: ${userId}`);

        // Extract query params with defaults
        // Default to page 1 and 6 items per page
        const { query } = request;
        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 6;
        const cursor = query.cursor ? parseInt(query.cursor) : undefined;
        const { isComplete, sort } = request.query;

        // ToDo: Implementing cursor pagination over offset pagination

        const queryOptions = {
            where: {
                userId: userId,
                ...(isComplete !== undefined && { isComplete: isComplete === 'true' })
            },
            take: limit,
            orderBy: {
                id: sort === 'asc' ? 'asc' : 'desc'
            }
        };

        if (cursor) {
            queryOptions.cursor = {
                id: cursor
            }
            queryOptions.skip = 1;
        }

        // Fetch data
        const tasks = await db.task.findMany(queryOptions);
        logger.info(`Fetched ${tasks.length} tasks for User: ${userId}`)
        // Next cursor
        const lastTask = tasks[tasks.length - 1];
        const nextCursor = tasks.length === limit ? lastTask.id : null;
        response.set('Cache-Control', 'private, max-age=30');

        response.json({
            data: tasks,
            meta: {
                count: tasks.length,
                nextCursor: nextCursor
            }
        });
    } catch (error) {
        logger.error(`Fetch Tasks Failed: ${error.message}`)
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
                ...(title && { title: title }),
                ...(description && { description: description })
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

module.exports = { createTask, transferTask, getMyTasks, deleteTask, updateTask };