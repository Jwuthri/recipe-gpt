import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../domain/usecases/analyze_ingredients_usecase.dart';
import 'camera_state.dart';

/// Cubit for managing camera screen state
class CameraCubit extends Cubit<CameraState> {
  CameraCubit(this._analyzeIngredientsUseCase) : super(const CameraInitial());

  final AnalyzeIngredientsUseCase _analyzeIngredientsUseCase;

  /// Analyzes images and extracts ingredients
  Future<void> analyzeImages(List<String> imagePaths) async {
    try {
      emit(const CameraLoading('🔍 Scanning your photos...'));
      
      // Simulate progress updates
      await Future.delayed(const Duration(milliseconds: 500));
      emit(const CameraLoading('📸 Processing images...'));
      
      await Future.delayed(const Duration(milliseconds: 500));
      emit(const CameraLoading('🧠 AI is analyzing ingredients...'));
      
      // Call the use case
      final ingredients = await _analyzeIngredientsUseCase(imagePaths);
      
      await Future.delayed(const Duration(milliseconds: 500));
      emit(const CameraLoading('✨ Finalizing ingredient list...'));
      
      await Future.delayed(const Duration(milliseconds: 500));
      emit(CameraSuccess(ingredients));
      
    } catch (e) {
      emit(CameraError('Failed to analyze images: ${e.toString()}'));
    }
  }

  /// Resets the state to initial
  void reset() {
    emit(const CameraInitial());
  }
} 