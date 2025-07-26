import '../repositories/ai_repository.dart';

/// Use case for generating chat responses with streaming
class GenerateChatResponseUseCase {
  const GenerateChatResponseUseCase(this._repository);

  final AIRepository _repository;

  /// Generates a chat response with streaming content
  Stream<String> call({
    required String prompt,
    List<String>? conversationHistory,
  }) async* {
    if (prompt.isEmpty) {
      throw Exception('Empty prompt provided');
    }

    if (prompt.length > 500) {
      throw Exception('Prompt too long (max 500 characters)');
    }

    try {
      yield* _repository.generateChatResponseStream(
        prompt: prompt.trim(),
        conversationHistory: conversationHistory,
      );
    } catch (e) {
      throw Exception('Failed to generate chat response: $e');
    }
  }
} 