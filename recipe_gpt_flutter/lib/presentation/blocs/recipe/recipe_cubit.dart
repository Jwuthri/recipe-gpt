import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../domain/entities/ingredient.dart';
import '../../../domain/entities/recipe_style.dart';
import '../../../domain/entities/recipe.dart';
import '../../../domain/usecases/generate_recipe_usecase.dart';
import 'recipe_state.dart';

/// Cubit for managing recipe generation
class RecipeCubit extends Cubit<RecipeState> {
  RecipeCubit(this._generateRecipeUseCase) : super(const RecipeInitial());

  final GenerateRecipeUseCase _generateRecipeUseCase;
  StreamSubscription? _recipeSubscription;

  /// Generate recipe from ingredients and style
  Future<void> generateRecipe({
    required List<Ingredient> ingredients,
    required RecipeStyle style,
  }) async {
    try {
      // Cancel any existing subscription
      await _recipeSubscription?.cancel();

      emit(const RecipeLoading('🧠 AI Chef is thinking...'));

      // Create the streaming request
      final stream = _generateRecipeUseCase(
        ingredients: ingredients,
        styleId: style.id,
      );

      String accumulatedContent = '';

      _recipeSubscription = stream.listen(
        (chunk) {
          accumulatedContent += chunk;
          emit(RecipeStreaming(
            content: accumulatedContent,
            isComplete: false,
          ));
        },
        onDone: () {
          // When streaming is complete, parse the final content into a Recipe
          final recipe = Recipe(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            title: _extractTitle(accumulatedContent),
            content: accumulatedContent,
            ingredients: ingredients,
            style: style,
            createdAt: DateTime.now(),
            description: _extractDescription(accumulatedContent),
            prepTime: _extractPrepTime(accumulatedContent),
            cookTime: _extractCookTime(accumulatedContent),
            servings: _extractServings(accumulatedContent),
            difficulty: _extractDifficulty(accumulatedContent),
            instructions: _extractInstructions(accumulatedContent),
            tags: _extractTags(accumulatedContent),
            nutritionInfo: _extractNutrition(accumulatedContent) ?? {},
          );

          emit(RecipeSuccess(recipe));
        },
        onError: (error) {
          emit(RecipeError('Failed to generate recipe: ${error.toString()}'));
        },
      );
    } catch (e) {
      emit(RecipeError('Failed to generate recipe: ${e.toString()}'));
    }
  }

  /// Regenerate the current recipe
  Future<void> regenerateRecipe({
    required List<Ingredient> ingredients,
    required RecipeStyle style,
  }) async {
    await generateRecipe(ingredients: ingredients, style: style);
  }

  /// Reset to initial state
  void reset() {
    _recipeSubscription?.cancel();
    emit(const RecipeInitial());
  }

  @override
  Future<void> close() {
    _recipeSubscription?.cancel();
    return super.close();
  }

  // Helper methods to extract data from markdown content
  String _extractTitle(String content) {
    final titleMatch = RegExp(r'^#\s+(.+)$', multiLine: true).firstMatch(content);
    return titleMatch?.group(1)?.trim() ?? 'Delicious Recipe';
  }

  String _extractDescription(String content) {
    final lines = content.split('\n');
    for (int i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('#') && i + 1 < lines.length) {
        final nextLine = lines[i + 1].trim();
        if (nextLine.isNotEmpty && !nextLine.startsWith('#') && !nextLine.startsWith('**')) {
          return nextLine;
        }
      }
    }
    return 'A delicious recipe made with fresh ingredients.';
  }

  List<String> _extractInstructions(String content) {
    final instructions = <String>[];
    final lines = content.split('\n');
    bool inInstructionsSection = false;

    for (final line in lines) {
      if (line.toLowerCase().contains('instruction') || 
          line.toLowerCase().contains('method') ||
          line.toLowerCase().contains('steps')) {
        inInstructionsSection = true;
        continue;
      }

      if (inInstructionsSection) {
        if (line.trim().startsWith(RegExp(r'\d+\.'))) {
          instructions.add(line.trim().replaceFirst(RegExp(r'^\d+\.\s*'), ''));
        } else if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
          instructions.add(line.trim().replaceFirst(RegExp(r'^[-*]\s*'), ''));
        } else if (line.startsWith('#')) {
          break; // New section
        }
      }
    }

    return instructions.isEmpty ? ['Follow the recipe as described above.'] : instructions;
  }

  int _extractPrepTime(String content) {
    final match = RegExp(r'prep.*?(\d+).*?min', caseSensitive: false).firstMatch(content);
    return int.tryParse(match?.group(1) ?? '') ?? 15;
  }

  int _extractCookTime(String content) {
    final match = RegExp(r'cook.*?(\d+).*?min', caseSensitive: false).firstMatch(content);
    return int.tryParse(match?.group(1) ?? '') ?? 30;
  }

  int _extractServings(String content) {
    final match = RegExp(r'serv.*?(\d+)', caseSensitive: false).firstMatch(content);
    return int.tryParse(match?.group(1) ?? '') ?? 4;
  }

  String _extractDifficulty(String content) {
    if (content.toLowerCase().contains('easy')) return 'Easy';
    if (content.toLowerCase().contains('medium') || content.toLowerCase().contains('intermediate')) return 'Medium';
    if (content.toLowerCase().contains('hard') || content.toLowerCase().contains('difficult')) return 'Hard';
    return 'Medium';
  }

  List<String> _extractTags(String content) {
    final tags = <String>[];
    final lowercaseContent = content.toLowerCase();
    
    if (lowercaseContent.contains('vegetarian')) tags.add('Vegetarian');
    if (lowercaseContent.contains('vegan')) tags.add('Vegan');
    if (lowercaseContent.contains('gluten-free')) tags.add('Gluten-Free');
    if (lowercaseContent.contains('dairy-free')) tags.add('Dairy-Free');
    if (lowercaseContent.contains('quick') || lowercaseContent.contains('fast')) tags.add('Quick');
    if (lowercaseContent.contains('healthy')) tags.add('Healthy');
    
    return tags;
  }

  Map<String, String>? _extractNutrition(String content) {
    // Simple nutrition extraction - could be enhanced
    final nutrition = <String, String>{};
    
    // Look for common nutrition keywords
    if (content.toLowerCase().contains('calories')) {
      final match = RegExp(r'(\d+).*calorie', caseSensitive: false).firstMatch(content);
      if (match != null) {
        nutrition['calories'] = '${match.group(1)} kcal';
      }
    }
    
    return nutrition.isEmpty ? null : nutrition;
  }
} 