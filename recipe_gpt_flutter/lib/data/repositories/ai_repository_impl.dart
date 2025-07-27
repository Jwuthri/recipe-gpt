import '../datasources/ai_remote_datasource.dart';
import '../../domain/entities/ingredient.dart';
import '../../domain/repositories/ai_repository.dart';

/// Implementation of AIRepository
class AIRepositoryImpl implements AIRepository {
  final AIRemoteDataSource _remoteDataSource;

  const AIRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<Ingredient>> analyzeImages(List<String> imagePaths) async {
    // Call the remote data source to analyze ingredients from images
    final ingredientNames = await _remoteDataSource.analyzeIngredientsFromImages(
      imagePaths: imagePaths,
    );
    
    // Convert strings to Ingredient objects
    return ingredientNames.map((name) => Ingredient(
      name: name,
      quantity: '1',
      unit: 'piece',
    )).toList();
  }

  @override
  Stream<String> generateRecipeStream({
    required List<Ingredient> ingredients,
    required String styleId,
  }) async* {
    // Convert ingredients to the format expected by backend
    final ingredientsData = ingredients.map((ingredient) => {
      'name': ingredient.name,
      'quantity': ingredient.quantity,
      'unit': ingredient.unit,
    }).toList();

    yield* _remoteDataSource.generateRecipeStream(
      ingredients: ingredientsData,
      styleId: styleId,
    );
  }

  @override
  Stream<String> generateChatResponseStream({
    required String prompt,
    List<String>? conversationHistory,
  }) async* {
    // For now, yield a simple response - this would be implemented later
    // when we add chat functionality to the backend
    yield 'Chat functionality coming soon!';
  }

  @override
  Future<bool> testConnection() async {
    // Simple connection test
    try {
      // This would test the backend connection
      return true;
    } catch (e) {
      return false;
    }
  }
} 