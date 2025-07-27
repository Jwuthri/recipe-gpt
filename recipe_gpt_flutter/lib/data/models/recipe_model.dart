import 'package:freezed_annotation/freezed_annotation.dart';
import 'ingredient_model.dart';
import 'recipe_style_model.dart';

part 'recipe_model.freezed.dart';
part 'recipe_model.g.dart';

@freezed
class RecipeModel with _$RecipeModel {
  const factory RecipeModel({
    required String id,
    required String title,
    required String content,
    required List<IngredientModel> ingredients,
    required RecipeStyleModel style,
    required DateTime createdAt,
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
  }) = _RecipeModel;

  factory RecipeModel.fromJson(Map<String, dynamic> json) =>
      _$RecipeModelFromJson(json);

  const RecipeModel._();

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

  /// Creates a partial recipe for streaming
  factory RecipeModel.createForStreaming({
    required List<IngredientModel> ingredients,
    required RecipeStyleModel style,
  }) =>
      RecipeModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        title: 'Generating recipe...',
        content: '',
        ingredients: ingredients,
        style: style,
        createdAt: DateTime.now(),
      );

  /// Updates recipe content during streaming
  RecipeModel updateContent(String newContent) => copyWith(
        content: newContent,
        lastUpdated: DateTime.now(),
      );

  /// Marks recipe as completed
  RecipeModel markCompleted({
    String? finalTitle,
    int? prepTime,
    int? cookTime,
    int? servings,
    String? difficulty,
    List<String>? instructions,
    Map<String, String>? nutritionInfo,
    List<String>? tips,
    List<String>? variations,
  }) =>
      copyWith(
        title: finalTitle ?? title,
        prepTime: prepTime,
        cookTime: cookTime,
        servings: servings,
        difficulty: difficulty,
        instructions: instructions,
        nutritionInfo: nutritionInfo,
        tips: tips,
        variations: variations,
        lastUpdated: DateTime.now(),
      );

  /// Creates a copy with updated favorite status
  RecipeModel toggleFavorite() => copyWith(
        isFavorite: !(isFavorite ?? false),
        lastUpdated: DateTime.now(),
      );

  /// Creates a copy with updated rating
  RecipeModel updateRating(double newRating) => copyWith(
        rating: newRating,
        lastUpdated: DateTime.now(),
      );
} 