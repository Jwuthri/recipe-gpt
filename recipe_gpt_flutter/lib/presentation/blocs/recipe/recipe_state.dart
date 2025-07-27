import 'package:equatable/equatable.dart';

import '../../../domain/entities/recipe.dart';

/// Base class for recipe states
abstract class RecipeState extends Equatable {
  const RecipeState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class RecipeInitial extends RecipeState {
  const RecipeInitial();
}

/// Loading state with progress message
class RecipeLoading extends RecipeState {
  const RecipeLoading([this.message = 'Generating recipe...']);

  final String message;

  @override
  List<Object?> get props => [message];
}

/// Streaming state with partial recipe content
class RecipeStreaming extends RecipeState {
  const RecipeStreaming({
    required this.content,
    this.isComplete = false,
  });

  final String content;
  final bool isComplete;

  @override
  List<Object?> get props => [content, isComplete];
}

/// Success state with complete recipe
class RecipeSuccess extends RecipeState {
  const RecipeSuccess(this.recipe);

  final Recipe recipe;

  @override
  List<Object?> get props => [recipe];
}

/// Error state with error message
class RecipeError extends RecipeState {
  const RecipeError(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
} 