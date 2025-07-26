import '../../core/errors/network_exceptions.dart';
import '../../domain/entities/ingredient.dart';
import '../../domain/entities/recipe.dart';
import '../../domain/repositories/ai_repository.dart';
import '../datasources/ai_remote_datasource.dart';
import '../models/ingredient_model.dart';
import '../models/chat_message_model.dart';

/// Implementation of AI repository using remote data source
class AIRepositoryImpl implements AIRepository {
  final AIRemoteDataSource _remoteDataSource;

  const AIRepositoryImpl(this._remoteDataSource);

  @override
  Future<List<Ingredient>> analyzeImages(List<String> imagePaths) async {
    try {
      final ingredientModels = await _remoteDataSource.analyzeImages(imagePaths);
      
      // Convert data models to domain entities
      return ingredientModels
          .map((model) => Ingredient(
                id: model.id,
                name: model.name,
                unit: model.unit,
                quantity: model.quantity,
                imageUrl: model.imageUrl,
                category: model.category,
                isAllergen: model.isAllergen ?? false,
                tags: model.tags ?? [],
              ))
          .toList();
    } catch (e) {
      throw Exception('Repository: Failed to analyze images - $e');
    }
  }

  @override
  Stream<String> generateRecipeStream({
    required List<Ingredient> ingredients,
    required String styleId,
  }) async* {
    try {
      // Convert domain entities to data models
      final ingredientModels = ingredients
          .map((ingredient) => IngredientModel(
                id: ingredient.id,
                name: ingredient.name,
                unit: ingredient.unit,
                quantity: ingredient.quantity,
                imageUrl: ingredient.imageUrl,
                category: ingredient.category,
                isAllergen: ingredient.isAllergen,
                tags: ingredient.tags,
              ))
          .toList();

      yield* _remoteDataSource.generateRecipeStream(
        ingredients: ingredientModels,
        styleId: styleId,
      );
    } catch (e) {
      throw Exception('Repository: Failed to generate recipe - $e');
    }
  }

  @override
  Stream<String> generateChatResponseStream({
    required String prompt,
    List<String>? conversationHistory,
  }) async* {
    try {
      yield* _remoteDataSource.generateChatResponseStream(
        prompt: prompt,
        conversationHistory: conversationHistory?.map((msg) => 
          ChatMessageModel(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            content: msg,
            type: MessageType.user,
            timestamp: DateTime.now(),
          )
        ).toList(),
      );
    } catch (e) {
      throw Exception('Repository: Failed to generate chat response - $e');
    }
  }

  @override
  Future<bool> testConnection() async {
    try {
      return await _remoteDataSource.testConnection();
    } catch (e) {
      return false;
    }
  }
} 