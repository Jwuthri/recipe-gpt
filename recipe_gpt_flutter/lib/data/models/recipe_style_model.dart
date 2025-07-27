import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:flutter/material.dart';

part 'recipe_style_model.freezed.dart';
part 'recipe_style_model.g.dart';

@freezed
class RecipeStyleModel with _$RecipeStyleModel {
  const factory RecipeStyleModel({
    required String id,
    required String title,
    required String icon,
    required String description,
    required List<int> primaryColor,
    required List<int> secondaryColor,
    String? dietaryInfo,
    List<String>? tags,
    int? estimatedCookTime,
    String? difficulty,
  }) = _RecipeStyleModel;

  factory RecipeStyleModel.fromJson(Map<String, dynamic> json) =>
      _$RecipeStyleModelFromJson(json);

  const RecipeStyleModel._();

  /// Converts color list to Color object
  Color get primaryColorObject => Color.fromARGB(
        primaryColor[0],
        primaryColor[1],
        primaryColor[2],
        primaryColor[3],
      );

  Color get secondaryColorObject => Color.fromARGB(
        secondaryColor[0],
        secondaryColor[1],
        secondaryColor[2],
        secondaryColor[3],
      );

  /// Creates a gradient from primary to secondary color
  LinearGradient get gradient => LinearGradient(
        colors: [primaryColorObject, secondaryColorObject],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      );

  /// Returns display text with icon
  String get displayTitle => '$icon $title';

  /// Predefined recipe styles
  static const List<RecipeStyleModel> defaultStyles = [
    RecipeStyleModel(
      id: 'high-protein',
      title: 'High Protein',
      icon: '💪',
      description: 'Muscle-building recipes with protein focus',
      primaryColor: [255, 255, 107, 107], // FF6B6B
      secondaryColor: [255, 255, 142, 142], // FF8E8E
      dietaryInfo: 'High in protein (25g+ per serving)',
      tags: ['protein', 'fitness', 'muscle-building'],
      estimatedCookTime: 25,
      difficulty: 'Medium',
    ),
    RecipeStyleModel(
      id: 'vegan',
      title: 'Vegan',
      icon: '🌱',
      description: 'Plant-based, no animal products',
      primaryColor: [255, 78, 205, 196], // 4ECDC4
      secondaryColor: [255, 68, 160, 141], // 44A08D
      dietaryInfo: '100% plant-based ingredients',
      tags: ['vegan', 'plant-based', 'healthy'],
      estimatedCookTime: 20,
      difficulty: 'Easy',
    ),
    RecipeStyleModel(
      id: 'keto',
      title: 'Keto',
      icon: '🥓',
      description: 'Low-carb, high-fat ketogenic',
      primaryColor: [255, 102, 126, 234], // 667eea
      secondaryColor: [255, 118, 75, 162], // 764ba2
      dietaryInfo: 'Under 20g net carbs per serving',
      tags: ['keto', 'low-carb', 'high-fat'],
      estimatedCookTime: 30,
      difficulty: 'Medium',
    ),
    RecipeStyleModel(
      id: 'mediterranean',
      title: 'Mediterranean',
      icon: '🫒',
      description: 'Fresh, healthy Mediterranean style',
      primaryColor: [255, 240, 147, 251], // f093fb
      secondaryColor: [255, 245, 87, 108], // f5576c
      dietaryInfo: 'Heart-healthy Mediterranean diet',
      tags: ['mediterranean', 'healthy', 'olive-oil'],
      estimatedCookTime: 35,
      difficulty: 'Medium',
    ),
    RecipeStyleModel(
      id: 'comfort',
      title: 'Comfort Food',
      icon: '🍲',
      description: 'Hearty, satisfying comfort meals',
      primaryColor: [255, 255, 236, 210], // ffecd2
      secondaryColor: [255, 252, 182, 159], // fcb69f
      dietaryInfo: 'Rich, warming comfort food',
      tags: ['comfort', 'hearty', 'warming'],
      estimatedCookTime: 45,
      difficulty: 'Easy',
    ),
    RecipeStyleModel(
      id: 'quick',
      title: 'Quick & Easy',
      icon: '⚡',
      description: 'Fast recipes under 30 minutes',
      primaryColor: [255, 168, 237, 234], // a8edea
      secondaryColor: [255, 254, 214, 227], // fed6e3
      dietaryInfo: 'Ready in under 30 minutes',
      tags: ['quick', 'easy', 'fast'],
      estimatedCookTime: 15,
      difficulty: 'Easy',
    ),
  ];

  /// Find style by ID
  static RecipeStyleModel? findById(String id) {
    try {
      return defaultStyles.firstWhere((style) => style.id == id);
    } catch (_) {
      return null;
    }
  }
} 