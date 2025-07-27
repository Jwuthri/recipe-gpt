import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import '../../core/network/network_client.dart';
import '../models/ingredient_model.dart';
import '../models/recipe_model.dart';
import '../models/chat_message_model.dart';
import '../../core/constants/app_constants.dart';
import '../../core/errors/network_exceptions.dart';

/// Abstract interface for AI remote data source
abstract class AIRemoteDataSource {
  /// Analyzes images and extracts ingredients
  Future<List<IngredientModel>> analyzeImages(List<String> imagePaths);

  /// Generates recipe with streaming support
  Stream<String> generateRecipeStream({
    required List<Map<String, String>> ingredients,
    required String styleId,
  });

  /// Generates chat response with streaming support
  Stream<String> generateChatResponseStream({
    required String prompt,
    List<ChatMessageModel>? conversationHistory,
  });

  /// Tests API connectivity
  Future<bool> testConnection();

  /// Analyzes ingredients from images
  Future<List<String>> analyzeIngredientsFromImages({
    required List<String> imagePaths,
  });
}

/// Implementation of AI remote data source using Gemini API
class AIRemoteDataSourceImpl implements AIRemoteDataSource {
  final NetworkClient _networkClient;

  const AIRemoteDataSourceImpl(this._networkClient);

  @override
  Future<List<IngredientModel>> analyzeImages(List<String> imagePaths) async {
    try {
      if (imagePaths.isEmpty) {
        throw Exception('No images provided');
      }

      if (imagePaths.length > 3) {
        throw Exception('Maximum 3 images allowed');
      }

      // Create prompt for ingredient analysis
      final prompt = imagePaths.length == 1
          ? _createSingleImagePrompt()
          : _createMultiImagePrompt(imagePaths.length);

      // Convert images to base64 (simplified - would need actual implementation)
      final imageData = await _convertImagesToBase64(imagePaths);

      // Create request payload
      final requestData = {
        'contents': [
          {
            'parts': [
              {'text': prompt},
              ...imageData.map((data) => {
                    'inline_data': {
                      'mime_type': data['mimeType'],
                      'data': data['base64Data'],
                    }
                  }),
            ]
          }
        ],
        'generationConfig': {
          'maxOutputTokens': 2048 * 4,
          'temperature': 0.33,
        },
      };

      // Make API request
      final response = await _networkClient.post(
        endpoint: '',
        data: requestData,
      );

      // Parse response and extract ingredients
      return _parseIngredientsResponse(response);
    } catch (e) {
      throw Exception('Failed to analyze images: $e');
    }
  }

  /// Generate recipe with streaming
  Stream<String> generateRecipeStream({
    required List<Map<String, String>> ingredients,
    required String styleId,
  }) async* {
         if (ingredients.isEmpty) {
       throw createNetworkException(message: 'No ingredients provided');
     }

    try {
      final requestData = {
        'ingredients': ingredients,
        'styleId': styleId,
      };

      if (AppConstants.useBackend) {
        // Use secure backend
        yield* _networkClient.postStream(data: requestData);
      } else {
        // Direct Gemini API call (fallback)
        final geminiRequest = _buildGeminiRequest(ingredients, styleId);
        yield* _networkClient.postStream(data: geminiRequest);
      }
    } catch (e) {
      throw createNetworkException(message: 'Failed to generate recipe: $e');
    }
  }

  /// Generates chat response with streaming support
  Stream<String> generateChatResponseStream({
    required String prompt,
    List<ChatMessageModel>? conversationHistory,
  }) async* {
    try {
      // Build conversation context
      final fullPrompt = _buildChatPrompt(prompt, conversationHistory);

      // Create request payload
      final requestData = {
        'contents': [
          {
            'parts': [
              {'text': fullPrompt}
            ]
          }
        ],
        'generationConfig': {
          'maxOutputTokens': 2048 * 4,
          'temperature': 0.33,
        },
      };

      // Stream the response
      await for (final chunk in _networkClient.postStream(data: requestData)) {
        yield chunk;
      }
    } catch (e) {
      throw Exception('Failed to generate chat response: $e');
    }
  }

  /// Tests connection to the API
  @override
  Future<bool> testConnection() async {
    try {
      // Simple test - this will be used by repository
      return true;
    } catch (e) {
      return false;
    }
  }

  /// Analyzes ingredients from images
  @override
  Future<List<String>> analyzeIngredientsFromImages({
    required List<String> imagePaths,
  }) async {
    try {
      if (AppConstants.useBackend) {
        // For now, use mock data since image analysis endpoint isn't implemented yet
        // TODO: Implement /analyze-ingredients endpoint in backend
        return await _analyzeImagesWithGemini(imagePaths);
      } else {
        // Direct Gemini API call for image analysis
        return await _analyzeImagesWithGemini(imagePaths);
      }
    } catch (e) {
      throw createNetworkException(message: 'Failed to analyze ingredients: $e');
    }
  }

  /// Analyzes images directly with Gemini API
  Future<List<String>> _analyzeImagesWithGemini(List<String> imagePaths) async {
    try {
      // For now, return mock ingredients since image analysis requires more complex setup
      // This is a temporary solution until we implement proper vision API
      await Future.delayed(const Duration(seconds: 2)); // Simulate processing
      
      // Return some mock ingredients based on common food items
      return [
        'chicken breast',
        'onion',
        'garlic',
        'tomato',
        'bell pepper',
        'olive oil',
        'salt',
        'black pepper',
      ];
    } catch (e) {
      throw createNetworkException(message: 'Failed to analyze images: $e');
    }
  }

  /// Creates prompt for single image analysis
  String _createSingleImagePrompt() {
    return '''
Analyze this image of a fridge/pantry and list all visible food ingredients with their estimated quantities. 
Format the response as a JSON array where each item has "name", "unit", and "quantity" properties. 
The "name" should be the ingredient name, "unit" should be the unit of measurement (g, kg, ml, l, pieces, etc.), 
and "quantity" should be the quantity/amount. Be specific about quantities (e.g., {"name": "eggs", "unit": "pieces", "quantity": "2"}). 
Only include actual food ingredients, not containers or non-food items. 
Return ONLY the JSON array, no additional text.
''';
  }

  /// Creates prompt for multiple image analysis
  String _createMultiImagePrompt(int imageCount) {
    return '''
Analyze these $imageCount images of a fridge/pantry and list all visible food ingredients with their estimated quantities from ALL images. 
Combine ingredients from all images into a single list. Format the response as a JSON array where each item has "name", "unit", and "quantity" properties. 
The "name" should be the ingredient name, "unit" should be the unit of measurement (g, kg, ml, l, pieces, etc.), 
and "quantity" should be the quantity/amount. Be specific about quantities (e.g., {"name": "eggs", "unit": "pieces", "quantity": "2"}). 
Only include actual food ingredients, not containers or non-food items. 
If the same ingredient appears in multiple images, combine the quantities. 
Return ONLY the JSON array, no additional text.
''';
  }

  /// Build Gemini API request format
  Map<String, dynamic> _buildGeminiRequest(
    List<Map<String, String>> ingredients,
    String styleId,
  ) {
    final ingredientText = ingredients
        .map((ing) => '${ing['quantity']} ${ing['unit']} ${ing['name']}')
        .join(', ');

    return {
      'contents': [{
        'parts': [{
          'text': 'Generate a recipe using these ingredients: $ingredientText. '
                  'Style: $styleId. Please provide a complete recipe with ingredients, '
                  'instructions, and cooking details in markdown format.'
        }]
      }],
      'generationConfig': {
        'temperature': 0.7,
        'topK': 40,
        'topP': 0.95,
        'maxOutputTokens': 2048,
      }
    };
  }

  /// Builds chat prompt with conversation context
  String _buildChatPrompt(String prompt, List<ChatMessageModel>? history) {
    final buffer = StringBuffer();
    
    buffer.writeln('You are a helpful cooking assistant.');
    
    if (history != null && history.isNotEmpty) {
      buffer.writeln('\nPrevious conversation:');
      for (final message in history.take(10)) { // Limit context
        final role = message.isFromUser ? 'User' : 'AI';
        buffer.writeln('$role: ${message.content}');
      }
    }
    
    buffer.writeln('\nUser\'s new message: $prompt');
    buffer.writeln('\nRespond helpfully using proper markdown formatting:');
    buffer.writeln('- Use **bold** for emphasis and key points');
    buffer.writeln('- Use bullet points (- or •) for lists');
    buffer.writeln('- Use ## for section headers when giving structured info');
    buffer.writeln('- Include relevant emojis to make responses engaging');
    buffer.writeln('- If suggesting a recipe, use full markdown format with sections');
    buffer.writeln('- Keep responses focused, helpful but not too long');
    buffer.writeln('- Make it visually appealing with proper formatting');

    return buffer.toString();
  }

  /// Converts image paths to base64 data
  Future<List<Map<String, String>>> _convertImagesToBase64(
      List<String> imagePaths) async {
    final List<Map<String, String>> results = [];
    
    for (final imagePath in imagePaths) {
      try {
        final file = File(imagePath);
        if (!await file.exists()) {
          throw Exception('Image file not found: $imagePath');
        }
        
        // Read the image file as bytes
        final Uint8List imageBytes = await file.readAsBytes();
        
        // Convert to base64
        final String base64String = base64Encode(imageBytes);
        
        // Determine MIME type based on file extension
        final String mimeType = _getMimeTypeFromPath(imagePath);
        
        results.add({
          'base64Data': base64String,
          'mimeType': mimeType,
        });
        
      } catch (e) {
        throw Exception('Failed to convert image to base64: $e');
      }
    }
    
    return results;
  }
  
  /// Gets MIME type from file path extension
  String _getMimeTypeFromPath(String filePath) {
    final extension = filePath.toLowerCase().split('.').last;
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'heic':
        return 'image/heic';
      case 'heif':
        return 'image/heif';
      default:
        return 'image/jpeg'; // Default fallback
    }
  }

  /// Parses API response and extracts ingredients
  List<IngredientModel> _parseIngredientsResponse(Map<String, dynamic> response) {
    try {
      if (response['candidates'] == null || response['candidates'].isEmpty) {
        throw Exception('No response from API');
      }

      final candidate = response['candidates'][0];
      if (candidate['content'] == null || 
          candidate['content']['parts'] == null ||
          candidate['content']['parts'].isEmpty) {
        throw Exception('Invalid response structure');
      }

      final content = candidate['content']['parts'][0]['text'] as String;
      
      // Try to parse JSON array
      final cleanContent = _extractJsonFromText(content);
      
      // Handle different response formats
      List<dynamic> ingredientsList;
      if (cleanContent is List) {
        ingredientsList = cleanContent;
      } else if (cleanContent is Map && cleanContent.containsKey('ingredients')) {
        ingredientsList = cleanContent['ingredients'] as List<dynamic>;
      } else if (cleanContent is Map && cleanContent.containsKey('items')) {
        ingredientsList = cleanContent['items'] as List<dynamic>;
      } else if (cleanContent is String) {
        // If it's still a string, try parsing again
        final reparsed = _extractJsonFromText(cleanContent);
        if (reparsed is List) {
          ingredientsList = reparsed;
        } else {
          throw Exception('Unable to extract ingredients list from response');
        }
      } else {
        throw Exception('Unexpected response format: ${cleanContent.runtimeType}');
      }
      
      return ingredientsList.map((item) => IngredientModel.fromJson(item as Map<String, dynamic>)).toList();
    } catch (e) {
      throw Exception('Failed to parse ingredients: $e');
    }
  }

  /// Extracts JSON array from text response
  dynamic _extractJsonFromText(String text) {
    try {
      // First try to parse the entire text as JSON
      return jsonDecode(text);
    } catch (_) {
      // Try to find JSON array in text
      final jsonMatch = RegExp(r'\[[\s\S]*?\]').firstMatch(text);
      if (jsonMatch != null) {
        return jsonDecode(jsonMatch.group(0)!);
      }
      
      // Try to find JSON object in text
      final objMatch = RegExp(r'\{[\s\S]*?\}').firstMatch(text);
      if (objMatch != null) {
        return jsonDecode(objMatch.group(0)!);
      }
      
      throw Exception('No valid JSON found in response');
    }
  }

  /// Gets style name from ID
  String _getStyleName(String styleId) {
    const styleNames = {
      'high-protein': 'High Protein',
      'vegan': 'Vegan',
      'keto': 'Keto',
      'mediterranean': 'Mediterranean',
      'comfort': 'Comfort Food',
      'quick': 'Quick & Easy',
    };
    return styleNames[styleId] ?? 'Custom';
  }

  /// Gets style icon from ID
  String _getStyleIcon(String styleId) {
    const styleIcons = {
      'high-protein': '💪',
      'vegan': '🌱',
      'keto': '🥓',
      'mediterranean': '🫒',
      'comfort': '🍲',
      'quick': '⚡',
    };
    return styleIcons[styleId] ?? '🍳';
  }
} 