import '../entities/ingredient.dart';
import '../repositories/ai_repository.dart';

/// Use case for analyzing ingredients from images
class AnalyzeIngredientsUseCase {
  const AnalyzeIngredientsUseCase(this._repository);

  final AIRepository _repository;

  /// Analyzes images and returns detected ingredients
  Future<List<Ingredient>> call(List<String> imagePaths) async {
    if (imagePaths.isEmpty) {
      throw Exception('No images provided for analysis');
    }

    if (imagePaths.length > 3) {
      throw Exception('Maximum 3 images allowed for analysis');
    }

    try {
      final ingredients = await _repository.analyzeImages(imagePaths);
      
      if (ingredients.isEmpty) {
        throw Exception('No ingredients detected in the provided images');
      }

      // Filter out invalid ingredients
      final validIngredients = ingredients
          .where((ingredient) => 
              ingredient.name.isNotEmpty && 
              ingredient.hasValidQuantity)
          .toList();

      if (validIngredients.isEmpty) {
        throw Exception('No valid ingredients detected');
      }

      return validIngredients;
    } catch (e) {
      throw Exception('Failed to analyze ingredients: $e');
    }
  }
} 