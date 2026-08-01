/**
 * Standard success response envelope so every endpoint returns a
 * predictable shape: { success, message, data, meta }.
 * `meta` is used for pagination info, counts, etc. and is optional.
 */
export class ApiResponse {
  constructor(statusCode, data = null, message = 'Success', meta = undefined) {
    this.statusCode = statusCode;
    this.success = statusCode < 400;
    this.message = message;
    this.data = data;
    if (meta) this.meta = meta;
  }

  send(res) {
    return res.status(this.statusCode).json({
      success: this.success,
      message: this.message,
      data: this.data,
      ...(this.meta ? { meta: this.meta } : {}),
    });
  }
}
