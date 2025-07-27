/// Application-wide constants
class AppConstants {
  // App Information
  static const String appName = 'Recipe GPT Flutter';
  static const String appVersion = '1.0.0';
  static const String appDescription = 'AI-powered recipe generation app';

  // API Configuration
  static const String geminiApiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
  static const String geminiStreamUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent';
  
  // Backend Configuration (Secure)
  static const String backendUrl = 'https://recipe-gpt-backend-ampgh4rmm-wuthrich-juliens-projects.vercel.app/api';
  static const bool useBackend = true; // ✅ Using backend with full ingredient objects!

  // Network Timeouts (in milliseconds)
  static const int connectTimeout = 30000;
  static const int receiveTimeout = 30000;
  static const int sendTimeout = 30000;

  // Image Configuration
  static const int maxImagesPerAnalysis = 3;
  static const double imageQuality = 0.8;
  static const int maxImageSizeMB = 10;

  // Recipe Configuration
  static const int maxIngredientsCount = 50;
  static const int minIngredientsCount = 1;
  static const int recipeGenerationTimeoutSeconds = 60;

  // Chat Configuration 
  static const int maxChatMessageLength = 500;
  static const int maxChatHistoryCount = 100;
  static const int chatStreamingDelayMS = 50;

  // UI Configuration
  static const double defaultPadding = 16.0;
  static const double smallPadding = 8.0;
  static const double largePadding = 24.0;
  static const double extraLargePadding = 32.0;

  static const double defaultBorderRadius = 12.0;
  static const double smallBorderRadius = 8.0;
  static const double largeBorderRadius = 20.0;
  static const double extraLargeBorderRadius = 28.0;

  // Animation Durations
  static const Duration shortAnimationDuration = Duration(milliseconds: 200);
  static const Duration mediumAnimationDuration = Duration(milliseconds: 300);
  static const Duration longAnimationDuration = Duration(milliseconds: 500);

  // Storage Keys
  static const String userPreferencesKey = 'user_preferences';
  static const String recipeHistoryKey = 'recipe_history';
  static const String chatHistoryKey = 'chat_history';
  static const String favoriteRecipesKey = 'favorite_recipes';

  // Error Messages
  static const String networkErrorMessage = 'Network error. Please check your connection.';
  static const String timeoutErrorMessage = 'Request timed out. Please try again.';
  static const String unknownErrorMessage = 'An unexpected error occurred.';
  static const String noIngredientsErrorMessage = 'No ingredients detected in the image.';
  static const String apiKeyMissingMessage = 'API key not configured. Please check your settings.';

  // Success Messages
  static const String recipeGeneratedMessage = 'Recipe generated successfully!';
  static const String ingredientsAnalyzedMessage = 'Ingredients analyzed successfully!';
  static const String imageUploadedMessage = 'Image uploaded successfully!';

  // Feature Flags
  static const bool enableChatFeature = true;
  static const bool enableRecipeSharing = true;
  static const bool enableAnalytics = false;
  static const bool enableOfflineMode = false;

  // File Paths
  static const String imagesAssetPath = 'assets/images/';
  static const String iconsAssetPath = 'assets/icons/';

  // Supported Image Formats
  static const List<String> supportedImageFormats = [
    'jpg',
    'jpeg',
    'png',
    'webp',
    'heic',
    'heif',
  ];

  // Recipe Style IDs (matches RecipeStyleModel)
  static const String highProteinStyleId = 'high-protein';
  static const String veganStyleId = 'vegan';
  static const String ketoStyleId = 'keto';
  static const String mediterraneanStyleId = 'mediterranean';
  static const String comfortStyleId = 'comfort';
  static const String quickStyleId = 'quick';

  // Camera Configuration
  static const double imageAspectRatio = 4.0 / 3.0;
  static const int maxCameraResolution = 1920;

  // Validation Rules
  static const int minIngredientNameLength = 2;
  static const int maxIngredientNameLength = 50;
  static const int minQuantityValue = 0;
  static const int maxQuantityValue = 9999;

  // Theme Configuration
  static const String defaultFontFamily = 'Roboto';
  static const double baseFontSize = 16.0;
  static const double smallFontSize = 12.0;
  static const double largeFontSize = 20.0;
  static const double extraLargeFontSize = 24.0;

  // Privacy and Terms
  static const String privacyPolicyUrl = 'https://example.com/privacy';
  static const String termsOfServiceUrl = 'https://example.com/terms';
  static const String supportEmailUrl = 'mailto:support@example.com';
} 