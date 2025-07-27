import '../entities/ingredient.dart';
import '../entities/recipe.dart';

/// Repository interface for AI operations
abstract class AIRepository {
  /// Analyzes images and extracts ingredients
  Future<List<Ingredient>> analyzeImages(List<String> imagePaths);

  /// Generates recipe with streaming support
  Stream<String> generateRecipeStream({
    required List<Ingredient> ingredients,
    required String styleId,
  });

  /// Generates chat response with streaming support
  Stream<String> generateChatResponseStream({
    required String prompt,
    List<String>? conversationHistory,
  });

  /// Tests API connectivity
  Future<bool> testConnection();
} 