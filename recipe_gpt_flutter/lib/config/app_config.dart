import 'dart:io';

import 'package:flutter_dotenv/flutter_dotenv.dart';

import '../core/constants/app_constants.dart';

/// Application configuration manager
class AppConfig {
  static bool _initialized = false;

  /// Initialize the app configuration
  static Future<void> initialize() async {
    if (_initialized) return;

    try {
      await dotenv.load(fileName: '.env');
      _initialized = true;
    } catch (e) {
      print('Warning: Could not load .env file: $e');
      // Continue without .env file for production builds
      _initialized = true;
    }
  }

  /// Gemini API key
  static String get geminiApiKey {
    final key = dotenv.env['GEMINI_API_KEY'] ?? '';
    if (key.isEmpty) {
      throw Exception('GEMINI_API_KEY not found in environment variables');
    }
    return key;
  }

  /// Gemini API base URL
  static String get geminiApiUrl =>
      dotenv.env['GEMINI_BASE_URL'] ?? AppConstants.geminiApiUrl;

  /// Gemini streaming URL
  static String get geminiStreamUrl =>
      dotenv.env['GEMINI_STREAM_URL'] ?? AppConstants.geminiStreamUrl;

  /// App name
  static String get appName =>
      dotenv.env['APP_NAME'] ?? AppConstants.appName;

  /// App version
  static String get appVersion =>
      dotenv.env['APP_VERSION'] ?? AppConstants.appVersion;

  /// Debug mode flag
  static bool get isDebugMode {
    final debug = dotenv.env['DEBUG_MODE']?.toLowerCase();
    return debug == 'true' || debug == '1';
  }

  /// Network timeouts
  static int get connectTimeout {
    final timeout = dotenv.env['CONNECT_TIMEOUT'];
    return timeout != null ? int.tryParse(timeout) ?? AppConstants.connectTimeout : AppConstants.connectTimeout;
  }

  static int get receiveTimeout {
    final timeout = dotenv.env['RECEIVE_TIMEOUT'];
    return timeout != null ? int.tryParse(timeout) ?? AppConstants.receiveTimeout : AppConstants.receiveTimeout;
  }

  static int get sendTimeout {
    final timeout = dotenv.env['SEND_TIMEOUT'];
    return timeout != null ? int.tryParse(timeout) ?? AppConstants.sendTimeout : AppConstants.sendTimeout;
  }

  /// Feature flags
  static bool get enableChatFeature {
    final enabled = dotenv.env['ENABLE_CHAT_FEATURE']?.toLowerCase();
    return enabled == 'true' || enabled == '1';
  }

  static bool get enableRecipeSharing {
    final enabled = dotenv.env['ENABLE_RECIPE_SHARING']?.toLowerCase();
    return enabled == 'true' || enabled == '1';
  }

  static bool get enableAnalytics {
    final enabled = dotenv.env['ENABLE_ANALYTICS']?.toLowerCase();
    return enabled == 'true' || enabled == '1';
  }

  /// Platform checks
  static bool get isAndroid => Platform.isAndroid;
  static bool get isIOS => Platform.isIOS;
  static bool get isMobile => Platform.isAndroid || Platform.isIOS;
  static bool get isDesktop => Platform.isWindows || Platform.isMacOS || Platform.isLinux;

  /// Environment detection
  static bool get isProduction => !isDebugMode;
  static bool get isDevelopment => isDebugMode;

  /// API configuration validation
  static bool get isApiConfigured {
    try {
      return geminiApiKey.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  /// Get all configuration as a map (for debugging)
  static Map<String, dynamic> get configMap => {
    'appName': appName,
    'appVersion': appVersion,
    'isDebugMode': isDebugMode,
    'isProduction': isProduction,
    'isApiConfigured': isApiConfigured,
    'platform': _getPlatformName(),
    'enableChatFeature': enableChatFeature,
    'enableRecipeSharing': enableRecipeSharing,
    'enableAnalytics': enableAnalytics,
    'connectTimeout': connectTimeout,
    'receiveTimeout': receiveTimeout,
    'sendTimeout': sendTimeout,
  };

  /// Get platform name
  static String _getPlatformName() {
    if (Platform.isAndroid) return 'Android';
    if (Platform.isIOS) return 'iOS';
    if (Platform.isWindows) return 'Windows';
    if (Platform.isMacOS) return 'macOS';
    if (Platform.isLinux) return 'Linux';
    if (Platform.isFuchsia) return 'Fuchsia';
    return 'Unknown';
  }

  /// Print configuration (for debugging)
  static void printConfig() {
    if (!isDebugMode) return;
    
    print('=== App Configuration ===');
    configMap.forEach((key, value) {
      print('$key: $value');
    });
    print('========================');
  }
} 