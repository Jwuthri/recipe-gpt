// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'recipe_style_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$RecipeStyleModelImpl _$$RecipeStyleModelImplFromJson(
        Map<String, dynamic> json) =>
    _$RecipeStyleModelImpl(
      id: json['id'] as String,
      title: json['title'] as String,
      icon: json['icon'] as String,
      description: json['description'] as String,
      primaryColor: (json['primaryColor'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
      secondaryColor: (json['secondaryColor'] as List<dynamic>)
          .map((e) => (e as num).toInt())
          .toList(),
      dietaryInfo: json['dietaryInfo'] as String?,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
      estimatedCookTime: (json['estimatedCookTime'] as num?)?.toInt(),
      difficulty: json['difficulty'] as String?,
    );

Map<String, dynamic> _$$RecipeStyleModelImplToJson(
        _$RecipeStyleModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'title': instance.title,
      'icon': instance.icon,
      'description': instance.description,
      'primaryColor': instance.primaryColor,
      'secondaryColor': instance.secondaryColor,
      'dietaryInfo': instance.dietaryInfo,
      'tags': instance.tags,
      'estimatedCookTime': instance.estimatedCookTime,
      'difficulty': instance.difficulty,
    };
