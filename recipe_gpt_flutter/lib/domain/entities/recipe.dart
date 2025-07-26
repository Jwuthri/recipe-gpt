import 'package:equatable/equatable.dart';

import 'ingredient.dart';
import 'recipe_style.dart';

/// Domain entity for a recipe
class Recipe extends Equatable {
  const Recipe({
    required this.id,
    required this.title,
    required this.content,
    required this.ingredients,
    required this.style,
    required this.createdAt,
    this.description,
    this.prepTime,
    this.cookTime,
    this.servings,
    this.difficulty,
    this.instructions = const [],
    this.nutritionInfo = const {},
    this.tips = const [],
    this.variations = const [],
    this.tags = const [],
    this.rating,
    this.isFavorite = false,
    this.lastUpdated,
  });

  final String id;
  final String title;
  final String content;
  final List<Ingredient> ingredients;
  final RecipeStyle style;
  final DateTime createdAt;
  final String? description;
  final int? prepTime;
  final int? cookTime;
  final int? servings;
  final String? difficulty;
  final List<String> instructions;
  final Map<String, String> nutritionInfo;
  final List<String> tips;
  final List<String> variations;
  final List<String> tags;
  final double? rating;
  final bool isFavorite;
  final DateTime? lastUpdated;

  /// Returns total cooking time
  int get totalTime => (prepTime ?? 0) + (cookTime ?? 0);

  /// Returns formatted time string
  String get formattedTime {
    final prep = prepTime ?? 0;
    final cook = cookTime ?? 0;
    if (prep > 0 && cook > 0) {
      return 'Prep: ${prep}min | Cook: ${cook}min';
    } else if (totalTime > 0) {
      return 'Total: ${totalTime}min';
    }
    return 'Time not specified';
  }

  /// Returns formatted servings string
  String get formattedServings {
    final serves = servings ?? 1;
    return serves == 1 ? '1 serving' : '$serves servings';
  }

  /// Returns display title with style icon
  String get displayTitle => '${style.icon} $title';

  /// Returns true if recipe is completed (has content)
  bool get isCompleted => content.isNotEmpty;

  /// Returns true if recipe is being streamed
  bool get isStreaming => content.isNotEmpty && content.length < 50;

  /// Creates a copy with updated fields
  Recipe copyWith({
    String? id,
    String? title,
    String? content,
    List<Ingredient>? ingredients,
    RecipeStyle? style,
    DateTime? createdAt,
    String? description,
    int? prepTime,
    int? cookTime,
    int? servings,
    String? difficulty,
    List<String>? instructions,
    Map<String, String>? nutritionInfo,
    List<String>? tips,
    List<String>? variations,
    List<String>? tags,
    double? rating,
    bool? isFavorite,
    DateTime? lastUpdated,
  }) {
    return Recipe(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      ingredients: ingredients ?? this.ingredients,
      style: style ?? this.style,
      createdAt: createdAt ?? this.createdAt,
      description: description ?? this.description,
      prepTime: prepTime ?? this.prepTime,
      cookTime: cookTime ?? this.cookTime,
      servings: servings ?? this.servings,
      difficulty: difficulty ?? this.difficulty,
      instructions: instructions ?? this.instructions,
      nutritionInfo: nutritionInfo ?? this.nutritionInfo,
      tips: tips ?? this.tips,
      variations: variations ?? this.variations,
      tags: tags ?? this.tags,
      rating: rating ?? this.rating,
      isFavorite: isFavorite ?? this.isFavorite,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  @override
  List<Object?> get props => [
        id,
        title,
        content,
        ingredients,
        style,
        createdAt,
        description,
        prepTime,
        cookTime,
        servings,
        difficulty,
        instructions,
        nutritionInfo,
        tips,
        variations,
        tags,
        rating,
        isFavorite,
        lastUpdated,
      ];

  @override
  String toString() => 'Recipe($displayTitle)';
} 