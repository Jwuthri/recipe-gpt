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

  /// Get Gemini API key from environment (for backward compatibility)
  String get _apiKey {
    final key = dotenv.env['GEMINI_API_KEY'];
    if (key == null || key.isEmpty) {
      throw const AuthenticationException();
    }
    return key;
  }

  /// Makes a standard POST request
  Future<Map<String, dynamic>> post({
    required String endpoint,
    required Map<String, dynamic> data,
    Map<String, String>? headers,
  }) async {
    try {
      String url;
      Map<String, dynamic> requestData;
      
      if (AppConstants.useBackend) {
        // Use secure backend
        url = '${AppConstants.backendUrl}/$endpoint';
        requestData = data;
      } else {
        // Direct API call (fallback)
        url = '${AppConstants.geminiApiUrl}?key=$_apiKey';
        requestData = data;
      }
      
      final response = await _dio.post(
        url,
        data: jsonEncode(requestData),
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

  /// Makes a raw POST request to any URL (for direct API calls)
  Future<Map<String, dynamic>> postRaw({
    required String url,
    required Map<String, dynamic> data,
    Map<String, String>? headers,
  }) async {
    try {
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
      
      return response.data as Map<String, dynamic>;
    } catch (e) {
      throw createNetworkException(message: 'Raw request failed: $e');
    }
  }

  /// Makes a streaming POST request
  Stream<String> postStream({
    required Map<String, dynamic> data,
    Map<String, String>? headers,
  }) async* {
    if (AppConstants.useBackend) {
      // Use secure backend streaming
      yield* _streamFromBackend(data, headers);
    } else {
      // Direct API streaming (fallback)
      yield* _streamFromGemini(data, headers);
    }
  }

  /// Stream from secure backend
  Stream<String> _streamFromBackend(
    Map<String, dynamic> data,
    Map<String, String>? headers,
  ) async* {
    try {
      final response = await _dio.post(
        '${AppConstants.backendUrl}/stream-recipe',
        data: jsonEncode(data),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            ...?headers,
          },
          responseType: ResponseType.stream,
        ),
      );

      final stream = response.data.stream as Stream<Uint8List>;
      
      await for (final chunk in stream) {
        final text = utf8.decode(chunk);
        yield text;
      }
    } catch (e) {
      throw createNetworkException(message: 'Streaming failed: $e');
    }
  }

  /// Stream from Gemini directly (fallback)
  Stream<String> _streamFromGemini(
    Map<String, dynamic> data,
    Map<String, String>? headers,
  ) async* {
    try {
      final url = '${AppConstants.geminiStreamUrl}?key=$_apiKey&alt=sse';
      
      final response = await _dio.post(
        url,
        data: jsonEncode(data),
        options: Options(
          headers: {
            'Content-Type': 'application/json',
            ...?headers,
          },
          responseType: ResponseType.stream,
        ),
      );

      final stream = response.data.stream as Stream<Uint8List>;
      
      await for (final chunk in stream) {
        final text = utf8.decode(chunk);
        final lines = text.split('\n');
        
        for (final line in lines) {
          if (line.startsWith('data: ')) {
            final data = line.substring(6);
            if (data.trim() == '[DONE]') continue;
            
            try {
              final json = jsonDecode(data);
              final content = json['candidates']?[0]?['content']?['parts']?[0]?['text'];
              if (content != null) {
                yield content as String;
              }
            } catch (e) {
              // Skip malformed JSON
              continue;
            }
          }
        }
      }
    } catch (e) {
      throw createNetworkException(message: 'Streaming failed: $e');
    }
  }

  /// Check if API is configured
  bool get isConfigured {
    if (AppConstants.useBackend) {
      return AppConstants.backendUrl.isNotEmpty;
    } else {
      return _apiKey.isNotEmpty;
    }
  }

  /// Get configuration status
  Map<String, dynamic> get configStatus {
    return {
      'useBackend': AppConstants.useBackend,
      'backendUrl': AppConstants.backendUrl,
      'hasApiKey': AppConstants.useBackend ? true : _apiKey.isNotEmpty,
      'isConfigured': isConfigured,
    };
  }
} 