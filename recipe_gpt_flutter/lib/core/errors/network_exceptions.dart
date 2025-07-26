import 'package:equatable/equatable.dart';

/// Base class for network-related exceptions
abstract class NetworkException extends Equatable implements Exception {
  const NetworkException(this.message);

  final String message;

  @override
  List<Object?> get props => [message];

  @override
  String toString() => 'NetworkException: $message';
}

/// Exception thrown when the device has no internet connection
class NoInternetException extends NetworkException {
  const NoInternetException() : super('No internet connection');
}

/// Exception thrown when a request times out
class TimeoutException extends NetworkException {
  const TimeoutException() : super('Request timed out');
}

/// Exception thrown for HTTP errors (4xx, 5xx)
class HttpException extends NetworkException {
  const HttpException(super.message, this.statusCode);

  final int statusCode;

  @override
  List<Object?> get props => [message, statusCode];
}

/// Exception thrown when the API key is missing or invalid
class AuthenticationException extends NetworkException {
  const AuthenticationException() : super('Authentication failed - invalid API key');
}

/// Exception thrown when the API rate limit is exceeded
class RateLimitException extends NetworkException {
  const RateLimitException() : super('Rate limit exceeded');
}

/// Exception thrown when the server is unavailable
class ServerException extends NetworkException {
  const ServerException() : super('Server is temporarily unavailable');
}

/// Exception thrown for malformed JSON responses
class ParseException extends NetworkException {
  const ParseException() : super('Failed to parse server response');
}

/// Exception thrown for streaming-related errors
class StreamingException extends NetworkException {
  const StreamingException(super.message);
}

/// Exception thrown when the maximum file size is exceeded
class FileSizeException extends NetworkException {
  const FileSizeException() : super('File size exceeds maximum limit');
}

/// Exception thrown for unsupported file formats
class FileFormatException extends NetworkException {
  const FileFormatException(String format) 
      : super('Unsupported file format: $format');
}

/// Exception thrown when too many images are provided
class TooManyImagesException extends NetworkException {
  const TooManyImagesException(int max) 
      : super('Too many images provided. Maximum allowed: $max');
}

/// Exception thrown for general API errors
class APIException extends NetworkException {
  const APIException(super.message);
}

/// Factory method to create appropriate exception based on error details
NetworkException createNetworkException({
  required String message,
  int? statusCode,
  String? type,
}) {
  if (statusCode != null) {
    switch (statusCode) {
      case 401:
      case 403:
        return const AuthenticationException();
      case 429:
        return const RateLimitException();
      case >= 500:
        return const ServerException();
      default:
        return HttpException(message, statusCode);
    }
  }

  if (type != null) {
    switch (type.toLowerCase()) {
      case 'timeout':
        return const TimeoutException();
      case 'network':
        return const NoInternetException();
      case 'parse':
        return const ParseException();
      case 'streaming':
        return StreamingException(message);
      case 'filesize':
        return const FileSizeException();
      case 'fileformat':
        return FileFormatException(message);
      default:
        return APIException(message);
    }
  }

  return APIException(message);
} 