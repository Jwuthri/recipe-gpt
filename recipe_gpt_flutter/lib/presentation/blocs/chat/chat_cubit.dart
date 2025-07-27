import 'dart:async';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../domain/entities/ingredient.dart';
import '../../../domain/usecases/generate_chat_response_usecase.dart';
import '../../../data/models/chat_message_model.dart';
import 'chat_state.dart';

/// Cubit for managing chat conversations
class ChatCubit extends Cubit<ChatState> {
  ChatCubit(this._generateChatResponseUseCase) : super(const ChatInitial()) {
    _initializeChat();
  }

  final GenerateChatResponseUseCase _generateChatResponseUseCase;
  StreamSubscription? _chatSubscription;
  final List<ChatMessageModel> _messages = [];

  /// Initialize chat with welcome message
  void _initializeChat() {
    final welcomeMessage = ChatMessageModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: "👋 Hi! I'm your AI cooking assistant. Ask me anything about recipes, cooking techniques, ingredient substitutions, or food in general!",
      type: MessageType.assistant,
      timestamp: DateTime.now(),
    );
    
    _messages.add(welcomeMessage);
    emit(ChatLoaded(messages: List.from(_messages)));
  }

  /// Initialize chat with ingredients context
  void initializeWithIngredients(List<Ingredient> ingredients) {
    final ingredientNames = ingredients.map((i) => i.name).join(', ');
    final contextMessage = ChatMessageModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      content: "I see you have: $ingredientNames. What would you like to know about cooking with these ingredients?",
      type: MessageType.assistant,
      timestamp: DateTime.now(),
    );
    
    _messages.clear();
    _messages.add(contextMessage);
    emit(ChatLoaded(messages: List.from(_messages)));
  }

  /// Send a user message and get AI response
  Future<void> sendMessage(String content, {List<Ingredient>? ingredients}) async {
    if (content.trim().isEmpty) return;

    try {
      // Add user message
      final userMessage = ChatMessageModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: content.trim(),
        type: MessageType.user,
        timestamp: DateTime.now(),
      );
      
      _messages.add(userMessage);
      emit(ChatLoaded(
        messages: List.from(_messages),
        isTyping: true,
      ));

      // Cancel any existing subscription
      await _chatSubscription?.cancel();

      // Create context from ingredients if provided
      String context = '';
      if (ingredients != null && ingredients.isNotEmpty) {
        final ingredientNames = ingredients.map((i) => i.name).join(', ');
        context = 'Available ingredients: $ingredientNames\n\n';
      }

      // Create the streaming request
      final stream = _generateChatResponseUseCase(
        prompt: context + content,
        conversationHistory: _getConversationHistory().map((msg) => msg['content']!).toList(),
      );

      String streamingContent = '';
      final aiMessageId = DateTime.now().millisecondsSinceEpoch.toString();

      _chatSubscription = stream.listen(
        (chunk) {
          streamingContent += chunk;
          emit(ChatStreaming(
            messages: List.from(_messages),
            streamingContent: streamingContent,
          ));
        },
        onDone: () {
          // Add complete AI message
          final aiMessage = ChatMessageModel(
            id: aiMessageId,
            content: streamingContent,
            type: MessageType.assistant,
            timestamp: DateTime.now(),
          );
          
          _messages.add(aiMessage);
          emit(ChatLoaded(
            messages: List.from(_messages),
            isTyping: false,
          ));
        },
        onError: (error) {
          emit(ChatLoaded(
            messages: List.from(_messages),
            isTyping: false,
          ));
          
          // Add error message
          final errorMessage = ChatMessageModel(
            id: DateTime.now().millisecondsSinceEpoch.toString(),
            content: "Sorry, I encountered an error: ${error.toString()}",
            type: MessageType.assistant,
            timestamp: DateTime.now(),
          );
          
          _messages.add(errorMessage);
          emit(ChatLoaded(messages: List.from(_messages)));
        },
      );
    } catch (e) {
      emit(ChatLoaded(
        messages: List.from(_messages),
        isTyping: false,
      ));
      
      // Add error message
      final errorMessage = ChatMessageModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: "Sorry, I encountered an error: ${e.toString()}",
        type: MessageType.assistant,
        timestamp: DateTime.now(),
      );
      
      _messages.add(errorMessage);
      emit(ChatLoaded(messages: List.from(_messages)));
    }
  }

  /// Clear chat history
  void clearChat() {
    _messages.clear();
    _chatSubscription?.cancel();
    _initializeChat();
  }

  /// Get conversation history for context
  List<Map<String, String>> _getConversationHistory() {
    return _messages.map((message) => {
      'role': message.isFromUser ? 'user' : 'assistant',
      'content': message.content,
    }).toList();
  }

  /// Get current messages
  List<ChatMessageModel> get messages => List.unmodifiable(_messages);

  @override
  Future<void> close() {
    _chatSubscription?.cancel();
    return super.close();
  }
} 