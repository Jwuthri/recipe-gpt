import '../datasources/ai_remote_datasource.dart';
import '../../domain/entities/ingredient.dart';
import '../../domain/repositories/ai_repository.dart';

/// Implementation of AIRepository
class AIRepositoryImpl implements AIRepository {
  final AIRemoteDataSource _remoteDataSource;

  const AIRepositoryImpl(this._remoteDataSource);

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
  Future<String> generateChatResponse({
    required String message,
    List<String>? context,
  }) async {
    return await _remoteDataSource.generateChatResponse(
      message: message,
      context: context ?? [],
    );
  }

  @override
  Future<List<String>> analyzeIngredientsFromImages({
    required List<String> imagePaths,
  }) async {
    return await _remoteDataSource.analyzeIngredientsFromImages(
      imagePaths: imagePaths,
    );
  }
} 