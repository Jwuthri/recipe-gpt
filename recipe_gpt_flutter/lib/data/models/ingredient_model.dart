import 'package:freezed_annotation/freezed_annotation.dart';

part 'ingredient_model.freezed.dart';
part 'ingredient_model.g.dart';

@freezed
class IngredientModel with _$IngredientModel {
  const factory IngredientModel({
    required String name,
    required String unit,
    required String quantity,
    String? id,
    String? imageUrl,
    String? category,
    bool? isAllergen,
    List<String>? tags,
  }) = _IngredientModel;

  factory IngredientModel.fromJson(Map<String, dynamic> json) =>
      _$IngredientModelFromJson(json);

  const IngredientModel._();

  /// Returns a display string for the ingredient
  String get displayText => '$quantity $unit $name';

  /// Returns true if the ingredient has a valid quantity
  bool get hasValidQuantity {
    final parsed = double.tryParse(quantity);
    return parsed != null && parsed > 0;
  }

  /// Returns the numeric quantity as a double
  double? get numericQuantity => double.tryParse(quantity);

  /// Creates a copy with updated quantity
  IngredientModel updateQuantity(String newQuantity) =>
      copyWith(quantity: newQuantity);

  /// Creates a copy with updated unit
  IngredientModel updateUnit(String newUnit) => copyWith(unit: newUnit);

  /// Factory method for creating ingredient from AI analysis
  factory IngredientModel.fromAIResponse({
    required String name,
    required String unit,
    required String quantity,
  }) =>
      IngredientModel(
        name: name.trim(),
        unit: unit.trim(),
        quantity: quantity.trim(),
        id: null,
      );
} 