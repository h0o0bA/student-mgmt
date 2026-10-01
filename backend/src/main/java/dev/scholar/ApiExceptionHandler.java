package dev.scholar;

import static dev.scholar.ApiModels.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class ApiExceptionHandler {
  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(ApiException.class)
  ResponseEntity<ApiError> domain(ApiException error) {
    return response(error.status, error.getMessage(), Map.of());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<ApiError> validation(MethodArgumentNotValidException error) {
    Map<String, String> fields = new LinkedHashMap<>();
    error
        .getBindingResult()
        .getFieldErrors()
        .forEach(field -> fields.putIfAbsent(field.getField(), field.getDefaultMessage()));
    return response(
        HttpStatus.BAD_REQUEST,
        "Check the submitted fields: " + String.join(", ", fields.keySet()) + ".",
        fields);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  ResponseEntity<ApiError> malformed() {
    return response(HttpStatus.BAD_REQUEST, "Invalid request body or field type.", Map.of());
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<ApiError> conflict() {
    return response(
        HttpStatus.CONFLICT,
        "This change conflicts with an existing record. Refresh and try again.",
        Map.of());
  }

  @ExceptionHandler(NoResourceFoundException.class)
  ResponseEntity<ApiError> missing() {
    return response(HttpStatus.NOT_FOUND, "Endpoint not found.", Map.of());
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<ApiError> unexpected(Exception error) {
    log.error("Unexpected API error", error);
    return response(
        HttpStatus.INTERNAL_SERVER_ERROR, "The server could not complete this request.", Map.of());
  }

  private ResponseEntity<ApiError> response(
      HttpStatus status, String message, Map<String, String> fields) {
    return ResponseEntity.status(status)
        .body(new ApiError(status.value(), message, fields, Instant.now()));
  }
}
