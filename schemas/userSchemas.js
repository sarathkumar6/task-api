const { z } = require("zod");

const registerSchema = z.object({
  email: z.email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters long."),
  role: z.enum(["USER", "ADMIN", "MANAGER"]).optional(),
});

module.exports = {
  registerSchema,
};
