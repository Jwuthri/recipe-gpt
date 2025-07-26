import 'package:equatable/equatable.dart';

import '../../../domain/entities/ingredient.dart';
import '../../../domain/entities/recipe_style.dart';

/// Base class for ingredients states
abstract class IngredientsState extends Equatable {
  const IngredientsState();

  @override
  List<Object?> get props => [];
}

/// Initial state with ingredients list
class IngredientsInitial extends IngredientsState {
  const IngredientsInitial(this.ingredients);

  final List<Ingredient> ingredients;

  @override
  List<Object?> get props => [ingredients];
}

/// State when ingredients are being modified
class IngredientsModified extends IngredientsState {
  const IngredientsModified({
    required this.ingredients,
    this.selectedStyle,
  });

  final List<Ingredient> ingredients;
  final RecipeStyle? selectedStyle;

  @override
  List<Object?> get props => [ingredients, selectedStyle];
}

/// State when user is ready to generate recipe
class IngredientsReady extends IngredientsState {
  const IngredientsReady({
    required this.ingredients,
    required this.selectedStyle,
  });

  final List<Ingredient> ingredients;
  final RecipeStyle selectedStyle;

  @override
  List<Object?> get props => [ingredients, selectedStyle];
} 