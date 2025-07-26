import 'dart:async';
import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import '../constants/app_constants.dart';
import '../errors/network_exceptions.dart';

/// Network client for handling HTTP requests and streaming
class NetworkClient {
  final Dio _dio;

  NetworkClient(this._dio);

  /// Get Gemini API key from environment
  String get _apiKey {
    final key = dotenv.env['GEMINI_API_KEY'];
    if (key == null || key.isEmpty) {
      throw const AuthenticationException();
    }
    return key;
  }

  /// Makes a standard POST request to Gemini API
  Future<Map<String, dynamic>> post({
    required String endpoint,
    required Map<String, dynamic> data,
    Map<String, String>? headers,
  }) async {
    try {
      final url = '${AppConstants.geminiApiUrl}?key=$_apiKey';
      
      final response = await _dio.post(
        url,
        data: jsonEncode(data),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            ...?headers,
          },
        ),
      );

      if (response.statusCode == 200) {
        return response.data as Map<String, dynamic>;
      } else {
        throw createNetworkException(
          message: 'Request failed with status: ${response.statusCode}',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      if (e is NetworkException) rethrow;
      throw createNetworkException(message: 'Unexpected error: $e');
    }
  }

  /// Makes a streaming POST request to Gemini API
  Stream<String> postStream({
    required Map<String, dynamic> data,
    Map<String, String>? headers,
  }) async* {
    try {
      final url = '${AppConstants.geminiStreamUrl}?key=$_apiKey&alt=sse';
      
      final response = await _dio.post(
        url,
        data: jsonEncode(data),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            'Cache-Control': 'no-cache',
            ...?headers,
          },
          responseType: ResponseType.stream,
          receiveTimeout: const Duration(milliseconds: 120000), // 2 minutes for streaming
          sendTimeout: const Duration(milliseconds: 30000),
          receiveDataWhenStatusError: true,
        ),
      );

      if (response.statusCode == 200) {
        final stream = response.data as ResponseBody;
        
        await for (final chunk in _parseSSEStream(stream.stream)) {
          yield chunk;
        }
      } else {
        throw createNetworkException(
          message: 'Streaming request failed with status: ${response.statusCode}',
          statusCode: response.statusCode,
        );
      }
    } on DioException catch (e) {
      throw _handleDioException(e);
    } catch (e) {
      throw createNetworkException(message: 'Streaming error: $e', type: 'streaming');
    }
  }

  /// Parses Server-Sent Events (SSE) stream
  Stream<String> _parseSSEStream(Stream<Uint8List> byteStream) async* {
    String buffer = '';
    
    try {
      await for (final bytes in byteStream) {
        final chunk = utf8.decode(bytes, allowMalformed: true);
        buffer += chunk;
        
        // Process complete lines
        final lines = buffer.split('\n');
        buffer = lines.removeLast(); // Keep incomplete line in buffer
        
        for (final line in lines) {
          final trimmedLine = line.trim();
          
          if (trimmedLine.startsWith('data: ')) {
            final data = trimmedLine.substring(6).trim();
            
            // Skip keep-alive messages and empty data
            if (data == '[DONE]' || data.isEmpty) {
              if (data == '[DONE]') return;
              continue;
            }
            
            try {
              final jsonData = jsonDecode(data);
              
              // Extract content from Gemini response structure
              if (jsonData['candidates'] != null && 
                  jsonData['candidates'].isNotEmpty) {
                final candidate = jsonData['candidates'][0];
                if (candidate['content'] != null && 
                    candidate['content']['parts'] != null &&
                    candidate['content']['parts'].isNotEmpty) {
                  final text = candidate['content']['parts'][0]['text'];
                  if (text != null && text.toString().isNotEmpty) {
                    // Yield each chunk immediately for real-time streaming
                    yield text.toString();
                  }
                }
              }
            } catch (e) {
              // Skip malformed JSON chunks but continue processing
              print('[SSE] Failed to parse chunk: $e, data: $data');
              continue;
            }
          }
        }
      }
    } catch (e) {
      print('[SSE] Stream processing error: $e');
      rethrow;
    }
  }

  /// Handles Dio exceptions and converts them to NetworkException
  NetworkException _handleDioException(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return const TimeoutException();
      
      case DioExceptionType.connectionError:
        return const NoInternetException();
      
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode;
        final message = e.response?.data?['error']?['message'] ?? 
                        'HTTP $statusCode error';
        return createNetworkException(message: message, statusCode: statusCode);
      
      case DioExceptionType.cancel:
        return createNetworkException(message: 'Request cancelled');
      
      case DioExceptionType.unknown:
      default:
        return createNetworkException(message: e.message ?? AppConstants.unknownErrorMessage);
    }
  }

  /// Uploads image for analysis
  Future<Map<String, dynamic>> uploadImage({
    required String base64Data,
    required String mimeType,
    Map<String, String>? headers,
  }) async {
    try {
      final data = {
        'contents': [
          {
            'parts': [
              {
                'inline_data': {
                  'mime_type': mimeType,
                  'data': base64Data,
                }
              }
            ]
          }
        ],
        'generationConfig': {
          'maxOutputTokens': 2048 * 4,
          'temperature': 0.33,
        },
      };

      return await post(
        endpoint: '',
        data: data,
        headers: headers,
      );
    } catch (e) {
      throw createNetworkException(message: 'Image upload failed: $e');
    }
  }

  /// Converts image file to base64
  Future<Map<String, String>> imageToBase64(String imagePath) async {
    try {
      // This would typically read the file and convert to base64
      // For now, return a placeholder
      return {
        'base64Data': '',
        'mimeType': 'image/jpeg',
      };
    } catch (e) {
      throw createNetworkException(message: 'Failed to convert image: $e');
    }
  }

  /// Validates API configuration
  bool get isConfigured {
    try {
      return _apiKey.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  /// Tests network connectivity
  Future<bool> testConnection() async {
    try {
      await _dio.get(
        'https://www.google.com',
        options: Options(
          sendTimeout: const Duration(seconds: 5),
          receiveTimeout: const Duration(seconds: 5),
        ),
      );
      return true;
    } catch (_) {
      return false;
    }
  }
} 