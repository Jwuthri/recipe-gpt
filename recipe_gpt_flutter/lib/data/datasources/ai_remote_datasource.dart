import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';

import '../../core/network/network_client.dart';
import '../models/ingredient_model.dart';
import '../models/recipe_model.dart';
import '../models/chat_message_model.dart';

/// Abstract interface for AI remote data source
abstract class AIRemoteDataSource {
  /// Analyzes images and extracts ingredients
  Future<List<IngredientModel>> analyzeImages(List<String> imagePaths);

  /// Generates recipe with streaming support
  Stream<String> generateRecipeStream({
    required List<IngredientModel> ingredients,
    required String styleId,
  });

  /// Generates chat response with streaming support
  Stream<String> generateChatResponseStream({
    required String prompt,
    List<ChatMessageModel>? conversationHistory,
  });

  /// Tests API connectivity
  Future<bool> testConnection();
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

  @override
  Stream<String> generateRecipeStream({
    required List<IngredientModel> ingredients,
    required String styleId,
  }) async* {
    try {
      if (ingredients.isEmpty) {
        throw Exception('No ingredients provided');
      }

      // Create recipe generation prompt
      final prompt = _createRecipePrompt(ingredients, styleId);

      // Create request payload
      final requestData = {
        'contents': [
          {
            'parts': [
              {'text': prompt}
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
      throw Exception('Failed to generate recipe: $e');
    }
  }

  @override
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

  @override
  Future<bool> testConnection() async {
    try {
      return await _networkClient.testConnection();
    } catch (_) {
      return false;
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

  /// Creates recipe generation prompt based on style
  String _createRecipePrompt(List<IngredientModel> ingredients, String styleId) {
    final ingredientList = ingredients
        .map((ing) => '${ing.quantity} ${ing.unit} ${ing.name}')
        .join(', ');

    final stylePrompts = {
      'high-protein': 'Focus on protein-rich preparation methods, include protein content per serving, and suggest high-protein variations.',
      'vegan': 'Use only plant-based ingredients and cooking methods. Ensure no animal products are used. Include nutritional info for vegans.',
      'keto': 'Create a low-carb, high-fat recipe. Limit carbs to under 20g per serving. Include net carb count.',
      'mediterranean': 'Use Mediterranean herbs, olive oil, and cooking techniques. Include fresh herbs and healthy fats.',
      'comfort': 'Create a hearty, satisfying comfort food recipe with rich flavors and warming spices.',
      'quick': 'Focus on quick cooking methods under 30 minutes. Include prep and cook times for each step.',
    };

    final styleInstruction = stylePrompts[styleId] ?? '';

    return '''
Create a delicious ${_getStyleName(styleId)} recipe with: $ingredientList

$styleInstruction

Format:
# ${_getStyleIcon(styleId)} [Recipe Name]
⏱️ Prep: X min | Cook: X min | Serves: X

## Ingredients
- List with measurements

## Instructions
1. Clear step-by-step directions (3-5 steps)
2. Include temperatures and timing

## 🍳Nutritional information:
| Nutrient | Amount |
|----------|--------|
| Calories | 450    |
| Protein  | 25g    |
| Carbs    | 35g    |
| Fat      | 20g    |
| Sugar    | 8g     |
| Fiber    | 5g     |
| Sodium   | 650mg  |

## Tips
- 2-3 cooking tips
- Substitutions if needed

Keep it concise but complete!
''';
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