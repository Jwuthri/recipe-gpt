// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recipe_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$RecipeModelImpl _$$RecipeModelImplFromJson(Map<String, dynamic> json) =>
    _$RecipeModelImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      content: json['content'] as String,
      ingredients: (json['ingredients'] as List<dynamic>)
          .map((e) => IngredientModel.fromJson(e as Map<String, dynamic>))
          .toList(),
      style: RecipeStyleModel.fromJson(json['style'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
      description: json['description'] as String?,
      prepTime: (json['prepTime'] as num?)?.toInt(),
      cookTime: (json['cookTime'] as num?)?.toInt(),
      servings: (json['servings'] as num?)?.toInt(),
      difficulty: json['difficulty'] as String?,
      instructions: (json['instructions'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      nutritionInfo: (json['nutritionInfo'] as Map<String, dynamic>?)?.map(
        (k, e) => MapEntry(k, e as String),
      ),
      tips: (json['tips'] as List<dynamic>?)?.map((e) => e as String).toList(),
      variations: (json['variations'] as List<dynamic>?)
          ?.map((e) => e as String)
          .toList(),
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
      rating: (json['rating'] as num?)?.toDouble(),
      isFavorite: json['isFavorite'] as bool?,
      lastUpdated: json['lastUpdated'] == null
          ? null
          : DateTime.parse(json['lastUpdated'] as String),
    );

Map<String, dynamic> _$$RecipeModelImplToJson(_$RecipeModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'content': instance.content,
      'ingredients': instance.ingredients,
      'style': instance.style,
      'createdAt': instance.createdAt.toIso8601String(),
      'description': instance.description,
      'prepTime': instance.prepTime,
      'cookTime': instance.cookTime,
      'servings': instance.servings,
      'difficulty': instance.difficulty,
      'instructions': instance.instructions,
      'nutritionInfo': instance.nutritionInfo,
      'tips': instance.tips,
      'variations': instance.variations,
      'tags': instance.tags,
      'rating': instance.rating,
      'isFavorite': instance.isFavorite,
      'lastUpdated': instance.lastUpdated?.toIso8601String(),
    };
