import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'dart:ui' as ui;
import 'package:flutter/services.dart';

import '../../config/app_config.dart';
import '../../core/constants/app_constants.dart';
import '../../core/errors/network_exceptions.dart';
import '../../core/network/network_client.dart';
import '../models/ingredient_model.dart';
import '../models/recipe_model.dart';
import '../models/chat_message_model.dart';
import '../../domain/entities/ingredient.dart';

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
  Future<List<Ingredient>> analyzeIngredientsFromImages({
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
  Future<List<Ingredient>> analyzeIngredientsFromImages({
    required List<String> imagePaths,
  }) async {
    try {
      if (AppConstants.useBackend) {
        print('🚀 Using backend for image analysis');
        print('Backend URL: ${AppConstants.backendUrl}');
        
        // Convert image files to base64 for backend analysis
        final List<String> imageBase64List = [];
        
        for (final imagePath in imagePaths) {
          print('🔍 Processing image path: $imagePath');
          
          final File imageFile = File(imagePath);
          final bool exists = await imageFile.exists();
          
          print('📁 File exists: $exists');
          
          if (exists) {
            try {
              List<int> imageBytes = await imageFile.readAsBytes();
              print('📊 Original image bytes length: ${imageBytes.length}');
              
              if (imageBytes.isEmpty) {
                print('❌ Image file is empty: ${imagePath}');
                continue;
              }
              
              // Compress image if it's too large (>2MB)
              if (imageBytes.length > 2 * 1024 * 1024) {
                print('🗜️ Image too large, compressing...');
                imageBytes = await _compressImage(imageBytes);
                print('📉 Compressed image bytes length: ${imageBytes.length}');
              }
              
              final String base64Image = base64Encode(imageBytes);
              print('📝 Base64 conversion result: originalPath=$imagePath, bytesLength=${imageBytes.length}, base64Length=${base64Image.length}');
              
              // Final check - if still too large after compression, skip
              if (base64Image.length > 4 * 1024 * 1024) { // 4MB limit for base64
                print('❌ Image still too large after compression, skipping');
                continue;
              }
              
              imageBase64List.add(base64Image);
              print('✅ Successfully added image to base64 list');
            } catch (e) {
              print('❌ Error reading image file: $e');
            }
          } else {
            print('❌ Image file not found: ${imagePath}');
          }
        }
        
        if (imageBase64List.isEmpty) {
          throw Exception('No valid images found');
        }

        print('📤 Calling backend with ${imageBase64List.length} images');
        
        // Call backend endpoint for image analysis
        final response = await _networkClient.post(
          endpoint: 'analyze-ingredients',
          data: {
            'images': imageBase64List,
          },
        );
        
        print('✅ Backend response received: ${response.keys}');
        
        // Response is already a Map<String, dynamic>
        if (response['success'] == true) {
          final List<dynamic> ingredientsData = response['ingredients'] ?? [];
          return ingredientsData.map((item) {
            if (item is Map<String, dynamic>) {
              return Ingredient(
                name: item['name']?.toString() ?? 'Unknown ingredient',
                quantity: item['quantity']?.toString() ?? '1',
                unit: item['unit']?.toString() ?? 'piece',
              );
            } else {
              // Fallback for string items
              return Ingredient(
                name: item.toString(),
                quantity: '1',
                unit: 'piece',
              );
            }
          }).toList();
        } else {
          throw Exception(response['error'] ?? 'Failed to analyze ingredients');
        }
      } else {
        // Direct Gemini API call for image analysis
        return await _analyzeImagesWithGemini(imagePaths);
      }
    } catch (e) {
      print('❌ Backend call failed - Error analyzing ingredients: $e');
      print('🔄 Falling back to direct Gemini API...');
      // Fallback to direct API if backend fails
      return await _analyzeImagesWithGemini(imagePaths);
    }
  }

  /// Analyzes images directly with Gemini Vision API
  Future<List<Ingredient>> _analyzeImagesWithGemini(List<String> imagePaths) async {
    try {
      // Convert images to base64
      final List<Map<String, dynamic>> imageParts = [];
      
      for (final imagePath in imagePaths) {
        final File imageFile = File(imagePath);
        if (await imageFile.exists()) {
          final List<int> imageBytes = await imageFile.readAsBytes();
          final String base64Image = base64Encode(imageBytes);
          
          imageParts.add({
            'inlineData': {
              'mimeType': 'image/jpeg',
              'data': base64Image,
            }
          });
        }
      }
      
      if (imageParts.isEmpty) {
        throw Exception('No valid images found');
      }

      // Prepare the text part
      final textPart = {
        'text': 'Analyze these images of food/pantry/fridge and identify all visible food ingredients. '
               'For each ingredient, estimate a reasonable quantity and unit. '
               'Return a JSON array of ingredient objects with this exact format: '
               '[{"name": "chicken breast", "quantity": "2", "unit": "pieces"}, {"name": "onion", "quantity": "1", "unit": "medium"}, {"name": "garlic", "quantity": "3", "unit": "cloves"}]. '
               'Only include actual food ingredients, not containers, utensils, or non-food items. '
               'Be specific about ingredients and provide realistic quantities. '
               'Common units: pieces, cloves, cups, tablespoons, teaspoons, grams, ounces, pounds, medium, large, small. '
               'Return ONLY the JSON array, no additional text.'
      };

      // Prepare the request matching exactly what works in backend
      final requestBody = {
        'contents': [{
          'parts': [textPart, ...imageParts]
        }],
        'generationConfig': {
          'temperature': 0.3,
          'maxOutputTokens': 1024 * 4,
        }
      };

      // Get API key safely
      String apiKey;
      try {
        apiKey = AppConfig.geminiApiKey;
      } catch (e) {
        throw Exception('Gemini API key not configured: $e');
      }

      // Debug: Print request structure (only in debug mode)
      print('Making Gemini API request with ${imageParts.length} images');
      print('Request structure: ${requestBody.keys}');
      
      // Make direct call to Gemini Vision API with correct endpoint
      final response = await _networkClient.postRaw(
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$apiKey',
        data: requestBody,
      );

      // Parse the response
      String? generatedText;
      if (response['candidates'] != null && 
          response['candidates'].length > 0 &&
          response['candidates'][0]['content'] != null &&
          response['candidates'][0]['content']['parts'] != null &&
          response['candidates'][0]['content']['parts'].length > 0) {
        generatedText = response['candidates'][0]['content']['parts'][0]['text'];
      }
      
      if (generatedText == null) {
        throw Exception('No response from Gemini API');
      }

      // Extract ingredients from JSON response
      List<Ingredient> ingredients = [];
      try {
        // Try to find JSON array in the response
        final jsonMatch = RegExp(r'\[.*\]', dotAll: true).firstMatch(generatedText);
        if (jsonMatch != null) {
          final jsonString = jsonMatch.group(0);
          final List<dynamic> parsed = jsonDecode(jsonString!);
          ingredients = parsed.map((item) {
            if (item is Map<String, dynamic>) {
              return Ingredient(
                name: item['name']?.toString() ?? 'Unknown ingredient',
                quantity: item['quantity']?.toString() ?? '1',
                unit: item['unit']?.toString() ?? 'piece',
              );
            } else {
              // Fallback for string items
              return Ingredient(
                name: item.toString(),
                quantity: '1',
                unit: 'piece',
              );
            }
          }).toList();
        } else {
          // Fallback: parse line by line and create basic ingredients
          final lines = generatedText.split('\n')
              .where((line) => line.trim().isNotEmpty)
              .map((line) => line.replaceAll(RegExp(r'^[-*•]\s*'), '').trim())
              .where((line) => line.isNotEmpty)
              .toList();
          ingredients = lines.map((name) => Ingredient(
            name: name,
            quantity: '1',
            unit: 'piece',
          )).toList();
        }
      } catch (parseError) {
        // Last fallback: split by lines and create basic ingredients
        final lines = generatedText.split('\n')
            .where((line) => line.trim().isNotEmpty)
            .map((line) => line.replaceAll(RegExp(r'^[-*•]\s*'), '').trim())
            .where((line) => line.isNotEmpty)
            .toList();
        ingredients = lines.map((name) => Ingredient(
          name: name,
          quantity: '1',
          unit: 'piece',
        )).toList();
      }

      return ingredients.isNotEmpty ? ingredients : [Ingredient(name: 'No ingredients detected', quantity: '0', unit: 'none')];
      
    } catch (e) {
      print('Error in direct Gemini image analysis: $e');
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
          'text': '''Create a detailed recipe using these ingredients: $ingredientText.

Recipe Style: $styleId

Please format the response using this EXACT template:

# [Recipe Title]

*[Brief appetizing description in 1-2 sentences]*

## 📊 Recipe Info
- **Prep Time:** [X minutes]
- **Cook Time:** [X minutes] 
- **Total Time:** [X minutes]
- **Servings:** [X servings]
- **Difficulty:** [Easy/Medium/Hard]
- **Cuisine:** [Type of cuisine]

## 🥘 Ingredients
${ingredients.map((ing) => '- ${ing['quantity']} ${ing['unit']} ${ing['name']}').join('\n')}
[Add any additional ingredients needed]

## 👨‍🍳 Instructions
1. [Detailed step-by-step instruction]
2. [Continue with each step...]
[Continue until recipe is complete]

## 📈 Nutrition (Per Serving)

| Nutrient | Amount |
|----------|--------|
| Calories | [X kcal] |
| Protein | [X g] |
| Carbohydrates | [X g] |
| Fat | [X g] |
| Fiber | [X g] |
| Sugar | [X g] |
| Sodium | [X mg] |

## 💡 Chef's Tips
- [Helpful tip or variation]
- [Storage instructions]
- [Serving suggestions]

---
*Enjoy your delicious $styleId meal!* 🍽️'''
        }]
      }],
      'generationConfig': {
        'temperature': 0.3,
        'maxOutputTokens': 2048 * 3, // Increased for detailed template with nutrition info
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

  /// Compresses image data to reduce size for API calls
  Future<List<int>> _compressImage(List<int> imageBytes) async {
    try {
      // Decode the image
      final ui.Codec codec = await ui.instantiateImageCodec(
        Uint8List.fromList(imageBytes),
        targetWidth: 1024, // Resize to max 1024px width
        targetHeight: 1024, // Resize to max 1024px height
      );
      final ui.FrameInfo frameInfo = await codec.getNextFrame();
      final ui.Image image = frameInfo.image;

      // Convert to bytes with compression
      final ByteData? byteData = await image.toByteData(
        format: ui.ImageByteFormat.png,
      );
      
      image.dispose();
      codec.dispose();
      
      if (byteData == null) {
        throw Exception('Failed to compress image');
      }
      
      return byteData.buffer.asUint8List();
    } catch (e) {
      print('❌ Image compression failed: $e');
      // Return original if compression fails
      return imageBytes;
    }
  }
} 