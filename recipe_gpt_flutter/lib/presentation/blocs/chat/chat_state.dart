import 'package:equatable/equatable.dart';

import '../../../data/models/chat_message_model.dart';

/// Base class for chat states
abstract class ChatState extends Equatable {
  const ChatState();

  @override
  List<Object?> get props => [];
}

/// Initial state
class ChatInitial extends ChatState {
  const ChatInitial();
}

/// State with chat messages
class ChatLoaded extends ChatState {
  const ChatLoaded({
    required this.messages,
    this.isTyping = false,
    this.isStreaming = false,
  });

  final List<ChatMessageModel> messages;
  final bool isTyping;
  final bool isStreaming;

  @override
  List<Object?> get props => [messages, isTyping, isStreaming];

  ChatLoaded copyWith({
    List<ChatMessageModel>? messages,
    bool? isTyping,
    bool? isStreaming,
  }) {
    return ChatLoaded(
      messages: messages ?? this.messages,
      isTyping: isTyping ?? this.isTyping,
      isStreaming: isStreaming ?? this.isStreaming,
    );
  }
}

/// State when streaming a response
class ChatStreaming extends ChatState {
  const ChatStreaming({
    required this.messages,
    required this.streamingContent,
  });

  final List<ChatMessageModel> messages;
  final String streamingContent;

  @override
  List<Object?> get props => [messages, streamingContent];
}

/// Error state
class ChatError extends ChatState {
  const ChatError(this.message);

  final String message;

  @override
  List<Object?> get props => [message];
} 