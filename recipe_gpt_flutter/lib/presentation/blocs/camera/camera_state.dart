import 'package:equatable/equatable.dart';

import '../../../domain/entities/ingredient.dart';

/// Base class for camera states
abstract class CameraState extends Equatable {
  const CameraState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class CameraInitial extends CameraState {
  const CameraInitial();
}

/// Loading state with optional message
class CameraLoading extends CameraState {
  const CameraLoading([this.message = 'Processing...']);

  final String message;

  @override
  List<Object?> get props => [message];
}

/// Success state with analyzed ingredients
class CameraSuccess extends CameraState {
  const CameraSuccess(this.ingredients);

  final List<Ingredient> ingredients;

  @override
  List<Object?> get props => [ingredients];
}

/// Error state with error message
class CameraError extends CameraState {
  const CameraError(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
} 