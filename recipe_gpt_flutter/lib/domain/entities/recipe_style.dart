import 'package:equatable/equatable.dart';

/// Domain entity for recipe style
class RecipeStyle extends Equatable {
  const RecipeStyle({
    required this.id,
    required this.title,
    required this.icon,
    required this.description,
    this.dietaryInfo,
    this.tags = const [],
    this.estimatedCookTime,
    this.difficulty,
  });

  final String id;
  final String title;
  final String icon;
  final String description;
  final String? dietaryInfo;
  final List<String> tags;
  final int? estimatedCookTime;
  final String? difficulty;

  /// Returns display text with icon
  String get displayTitle => '$icon $title';

  /// Predefined recipe styles
  static const List<RecipeStyle> defaultStyles = [
    RecipeStyle(
      id: 'high-protein',
      title: 'High Protein',
      icon: '💪',
      description: 'Muscle-building recipes with protein focus',
      dietaryInfo: 'High in protein (25g+ per serving)',
      tags: ['protein', 'fitness', 'muscle-building'],
      estimatedCookTime: 25,
      difficulty: 'Medium',
    ),
    RecipeStyle(
      id: 'vegan',
      title: 'Vegan',
      icon: '🌱',
      description: 'Plant-based, no animal products',
      dietaryInfo: '100% plant-based ingredients',
      tags: ['vegan', 'plant-based', 'healthy'],
      estimatedCookTime: 20,
      difficulty: 'Easy',
    ),
    RecipeStyle(
      id: 'keto',
      title: 'Keto',
      icon: '🥓',
      description: 'Low-carb, high-fat ketogenic',
      dietaryInfo: 'Under 20g net carbs per serving',
      tags: ['keto', 'low-carb', 'high-fat'],
      estimatedCookTime: 30,
      difficulty: 'Medium',
    ),
    RecipeStyle(
      id: 'mediterranean',
      title: 'Mediterranean',
      icon: '🫒',
      description: 'Fresh, healthy Mediterranean style',
      dietaryInfo: 'Heart-healthy Mediterranean diet',
      tags: ['mediterranean', 'healthy', 'olive-oil'],
      estimatedCookTime: 35,
      difficulty: 'Medium',
    ),
    RecipeStyle(
      id: 'comfort',
      title: 'Comfort Food',
      icon: '🍲',
      description: 'Hearty, satisfying comfort meals',
      dietaryInfo: 'Rich, warming comfort food',
      tags: ['comfort', 'hearty', 'warming'],
      estimatedCookTime: 45,
      difficulty: 'Easy',
    ),
    RecipeStyle(
      id: 'quick',
      title: 'Quick & Easy',
      icon: '⚡',
      description: 'Fast recipes under 30 minutes',
      dietaryInfo: 'Ready in under 30 minutes',
      tags: ['quick', 'easy', 'fast'],
      estimatedCookTime: 15,
      difficulty: 'Easy',
    ),
  ];

  /// Find style by ID
  static RecipeStyle? findById(String id) {
    try {
      return defaultStyles.firstWhere((style) => style.id == id);
    } catch (_) {
      return null;
    }
  }

  /// Creates a copy with updated fields
  RecipeStyle copyWith({
    String? id,
    String? title,
    String? icon,
    String? description,
    String? dietaryInfo,
    List<String>? tags,
    int? estimatedCookTime,
    String? difficulty,
  }) {
    return RecipeStyle(
      id: id ?? this.id,
      title: title ?? this.title,
      icon: icon ?? this.icon,
      description: description ?? this.description,
      dietaryInfo: dietaryInfo ?? this.dietaryInfo,
      tags: tags ?? this.tags,
      estimatedCookTime: estimatedCookTime ?? this.estimatedCookTime,
      difficulty: difficulty ?? this.difficulty,
    );
  }

  @override
  List<Object?> get props => [
        id,
        title,
        icon,
        description,
        dietaryInfo,
        tags,
        estimatedCookTime,
        difficulty,
      ];

  @override
  String toString() => 'RecipeStyle($displayTitle)';
} 