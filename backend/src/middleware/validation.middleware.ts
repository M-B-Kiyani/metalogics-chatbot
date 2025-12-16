import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";
import { ValidationError } from "../errors/AppError";

/**
 * Validation target type
 */
type ValidationTarget = "body" | "query" | "params";

/**
 * Middleware factory that validates request data against a Zod schema
 * @param schema - Zod schema to validate against
 * @param target - Which part of the request to validate (body, query, or params)
 * @returns Express middleware function
 */
export const validateRequest = (
  schema: z.ZodTypeAny,
  target: ValidationTarget = "body"
) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Get the data to validate based on target
      const dataToValidate = req[target];

      // Validate the data against the schema
      const validatedData = await schema.parseAsync(dataToValidate);

      // Replace the request data with validated and sanitized data
      if (target === "query") {
        // For query params, use Object.defineProperty to override the read-only getter
        Object.defineProperty(req, "query", {
          value: validatedData,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        // For body and params, direct assignment works
        (req as any)[target] = validatedData;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod validation errors into a more readable structure
        const formattedErrors = error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
          code: err.code,
        }));

        // Create a validation error with details
        const validationError = new ValidationError(
          "Validation failed",
          formattedErrors
        );

        next(validationError);
      } else {
        // Pass other errors to the error handler
        next(error);
      }
    }
  };
};

/**
 * Convenience function for validating request body
 */
export const validateBody = (schema: z.ZodTypeAny) => {
  return validateRequest(schema, "body");
};

/**
 * Convenience function for validating query parameters
 */
export const validateQuery = (schema: z.ZodTypeAny) => {
  return validateRequest(schema, "query");
};

/**
 * Convenience function for validating route parameters
 */
export const validateParams = (schema: z.ZodTypeAny) => {
  return validateRequest(schema, "params");
};
