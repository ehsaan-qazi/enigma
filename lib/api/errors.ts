export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class BadRequestError extends ApiError {
  constructor(message = "Bad Request", details?: unknown) {
    super(400, message, details);
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Unauthorized", details?: unknown) {
    super(401, message, details);
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Forbidden", details?: unknown) {
    super(403, message, details);
  }
}

export class NotFoundError extends ApiError {
  constructor(message = "Resource Not Found", details?: unknown) {
    super(404, message, details);
  }
}

export class ConflictError extends ApiError {
  constructor(message = "Conflict", details?: unknown) {
    super(409, message, details);
  }
}

export class InternalServerError extends ApiError {
  constructor(message = "Internal Server Error", details?: unknown) {
    super(500, message, details);
  }
}
