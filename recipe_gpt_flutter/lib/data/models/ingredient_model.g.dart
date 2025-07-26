// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'ingredient_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$IngredientModelImpl _$$IngredientModelImplFromJson(
        Map<String, dynamic> json) =>
    _$IngredientModelImpl(
      name: json['name'] as String,
      unit: json['unit'] as String,
      quantity: json['quantity'] as String,
      id: json['id'] as String?,
      imageUrl: json['imageUrl'] as String?,
      category: json['category'] as String?,
      isAllergen: json['isAllergen'] as bool?,
      tags: (json['tags'] as List<dynamic>?)?.map((e) => e as String).toList(),
    );

Map<String, dynamic> _$$IngredientModelImplToJson(
        _$IngredientModelImpl instance) =>
    <String, dynamic>{
      'name': instance.name,
      'unit': instance.unit,
      'quantity': instance.quantity,
      'id': instance.id,
      'imageUrl': instance.imageUrl,
      'category': instance.category,
      'isAllergen': instance.isAllergen,
      'tags': instance.tags,
    };
