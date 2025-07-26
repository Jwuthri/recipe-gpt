import '../entities/ingredient.dart';
import '../entities/recipe_style.dart';
import '../repositories/ai_repository.dart';

/// Use case for generating recipes with streaming
class GenerateRecipeUseCase {
  const GenerateRecipeUseCase(this._repository);

  final AIRepository _repository;

  /// Generates a recipe with streaming content
  Stream<String> call({
    required List<Ingredient> ingredients,
    required String styleId,
  }) async* {
    if (ingredients.isEmpty) {
      throw Exception('No ingredients provided for recipe generation');
    }

    // Validate style exists
    final style = RecipeStyle.findById(styleId);
    if (style == null) {
      throw Exception('Invalid recipe style: $styleId');
    }

    // Validate ingredients have required fields
    final validIngredients = ingredients
        .where((ingredient) => 
            ingredient.name.isNotEmpty && 
            ingredient.quantity.isNotEmpty &&
            ingredient.unit.isNotEmpty)
        .toList();

    if (validIngredients.isEmpty) {
      throw Exception('No valid ingredients found');
    }

    try {
      yield* _repository.generateRecipeStream(
        ingredients: validIngredients,
        styleId: styleId,
      );
    } catch (e) {
      throw Exception('Failed to generate recipe: $e');
    }
  }
} 