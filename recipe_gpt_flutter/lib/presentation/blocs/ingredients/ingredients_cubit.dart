import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../domain/entities/ingredient.dart';
import '../../../domain/entities/recipe_style.dart';
import 'ingredients_state.dart';

/// Cubit for managing ingredients screen state
class IngredientsCubit extends Cubit<IngredientsState> {
  IngredientsCubit() : super(const IngredientsInitial([]));

  List<Ingredient> _ingredients = [];
  RecipeStyle? _selectedStyle;

  /// Initialize with ingredients from camera analysis
  void initializeIngredients(List<Ingredient> ingredients) {
    _ingredients = List.from(ingredients);
    emit(IngredientsModified(ingredients: _ingredients));
  }

  /// Add a new ingredient manually
  void addIngredient(String name) {
    if (name.trim().isNotEmpty) {
      final ingredient = Ingredient(
        name: name.trim(),
        unit: 'pcs', // Default unit for manual additions
        quantity: '1', // Default quantity
        category: 'manual',
      );
      _ingredients.add(ingredient);
      _emitCurrentState();
    }
  }

  /// Remove an ingredient from the list
  void removeIngredient(int index) {
    if (index >= 0 && index < _ingredients.length) {
      _ingredients.removeAt(index);
      _emitCurrentState();
    }
  }

  /// Update an ingredient name
  void updateIngredient(int index, String newName) {
    if (index >= 0 && index < _ingredients.length && newName.trim().isNotEmpty) {
      _ingredients[index] = _ingredients[index].copyWith(
        name: newName.trim(),
      );
      _emitCurrentState();
    }
  }

  /// Select a recipe style
  void selectRecipeStyle(RecipeStyle style) {
    _selectedStyle = style;
    _emitCurrentState();
  }

  /// Clear recipe style selection
  void clearRecipeStyle() {
    _selectedStyle = null;
    _emitCurrentState();
  }

  /// Check if ready to generate recipe
  bool get isReadyToGenerate => 
      _ingredients.isNotEmpty && _selectedStyle != null;

  /// Get current ingredients
  List<Ingredient> get ingredients => List.unmodifiable(_ingredients);

  /// Get selected style
  RecipeStyle? get selectedStyle => _selectedStyle;

  /// Emit current state based on data
  void _emitCurrentState() {
    if (isReadyToGenerate) {
      emit(IngredientsReady(
        ingredients: _ingredients,
        selectedStyle: _selectedStyle!,
      ));
    } else {
      emit(IngredientsModified(
        ingredients: _ingredients,
        selectedStyle: _selectedStyle,
      ));
    }
  }

  /// Reset to initial state
  void reset() {
    _ingredients = [];
    _selectedStyle = null;
    emit(const IngredientsInitial([]));
  }
} 