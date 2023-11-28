class ApiResponse {
  constructor(data, status, statusCode, message = "Success") {
    this.status = status;
    this.statusCode = statusCode;
    this.message = message;
    this.success = status < 400;
  }
}

export { ApiResponse };
