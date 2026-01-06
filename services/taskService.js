const db = require("../db");

// Executes ACID transaction to transfer task ownership
// Supports: Engineering Execellence O(n) & Data Integrity
async function transferTaskOwnership({
  taskId,
  fromUserId,
  toUserId,
  clientIP,
}) {
  try {
    return await db.$transaction(async (tx) => {
      const task = await tx.task.findUnique({
        where: { id: Number(taskId) },
      });

      if (!task) {
        const error = new Error("Task not found.");
        error.statusCode = 404;
        throw error;
      }
      console.log("--- DEBUG OWNERSHIP ---");
      console.log("Task object from DB:", task);
      console.log(
        "fromUserId (Requester):",
        fromUserId,
        "Type:",
        typeof fromUserId,
      );
      console.log(
        "task.userId (Owner):",
        task.userId,
        "Type:",
        typeof task.userId,
      );
      console.log("Comparison Result:", task.userId !== fromUserId);

      if (task.userId !== Number(fromUserId)) {
        const error = new Error("Unauthorized: You do not own this task.");
        error.statusCode = 403;
        throw error;
      }
      console.log(
        `Transferring Task ID ${taskId} from User ID ${fromUserId} to Us
        er ID ${toUserId}`,
      );
      const targetUser = await tx.user.findUnique({
        where: { id: Number(toUserId) },
      });

      if (!targetUser) {
        const error = new Error("Target user not found.");
        error.statusCode = 404;
        error.body = { 
            statusCode: "error", 
            message: "Target user not found."
         };
         console.log("Error Body:", error.body);
        throw error;
      }
      // 1. Change the task ownership
      const updatedTask = await tx.task.update({
        where: {
          id: Number(taskId),
        },
        data: {
          userId: Number(toUserId),
        },
      });

      // 2. Decrement sender's task count
      await tx.user.update({
        where: { id: Number(fromUserId) },
        data: {
          taskCount: {
            decrement: 1,
          },
        },
      });

      // 3. Increment receiver's task count
      await tx.user.update({
        where: { id: Number(toUserId) },
        data: {
          taskCount: {
            increment: 1,
          },
        },
      });

      await tx.auditLog.create({
        data: {
          action: "TASK_TRANSFER",
          entityId: Number(taskId),
          entityType: "TASK",
          performedBy: Number(fromUserId),
          oldValue: { userId: Number(fromUserId) },
          newValue: { userId: Number(toUserId) },
          status: "SUCCESS",
          ipAddress: clientIP,
        },
      });

      return updatedTask;
    });
  } catch (error) {
    // ToDO: Log the failure for observability purposes - Splunk/Datadog
    console.error("Error during task ownership transfer:", error);
    throw error;
  }
}

module.exports = { transferTaskOwnership };
