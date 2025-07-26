import 'package:equatable/equatable.dart';

/// Domain entity for an ingredient
class Ingredient extends Equatable {
  const Ingredient({
    required this.name,
    required this.unit,
    required this.quantity,
    this.id,
    this.imageUrl,
    this.category,
    this.isAllergen = false,
    this.tags = const [],
  });

  final String? id;
  final String name;
  final String unit;
  final String quantity;
  final String? imageUrl;
  final String? category;
  final bool isAllergen;
  final List<String> tags;

  /// Returns a display string for the ingredient
  String get displayText => '$quantity $unit $name';

  /// Returns true if the ingredient has a valid quantity
  bool get hasValidQuantity {
    final parsed = double.tryParse(quantity);
    return parsed != null && parsed > 0;
  }

  /// Returns the numeric quantity as a double
  double? get numericQuantity => double.tryParse(quantity);

  /// Creates a copy with updated fields
  Ingredient copyWith({
    String? id,
    String? name,
    String? unit,
    String? quantity,
    String? imageUrl,
    String? category,
    bool? isAllergen,
    List<String>? tags,
  }) {
    return Ingredient(
      id: id ?? this.id,
      name: name ?? this.name,
      unit: unit ?? this.unit,
      quantity: quantity ?? this.quantity,
      imageUrl: imageUrl ?? this.imageUrl,
      category: category ?? this.category,
      isAllergen: isAllergen ?? this.isAllergen,
      tags: tags ?? this.tags,
    );
  }

  @override
  List<Object?> get props => [
        id,
        name,
        unit,
        quantity,
        imageUrl,
        category,
        isAllergen,
        tags,
      ];

  @override
  String toString() => 'Ingredient($displayText)';
} 