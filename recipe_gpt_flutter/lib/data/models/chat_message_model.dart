import 'package:freezed_annotation/freezed_annotation.dart';

part 'chat_message_model.freezed.dart';
part 'chat_message_model.g.dart';

enum MessageType {
  user,
  assistant,
  system,
}

enum MessageStatus {
  sending,
  sent,
  delivered,
  error,
  streaming,
}

@freezed
class ChatMessageModel with _$ChatMessageModel {
  const factory ChatMessageModel({
    required String id,
    required String content,
    required MessageType type,
    required DateTime timestamp,
    MessageStatus? status,
    String? error,
    Map<String, dynamic>? metadata,
    String? parentMessageId,
    bool? isEdited,
    DateTime? editedAt,
  }) = _ChatMessageModel;

  factory ChatMessageModel.fromJson(Map<String, dynamic> json) =>
      _$ChatMessageModelFromJson(json);

  const ChatMessageModel._();

  /// Returns true if message is from user
  bool get isFromUser => type == MessageType.user;

  /// Returns true if message is from assistant
  bool get isFromAssistant => type == MessageType.assistant;

  /// Returns true if message is a system message
  bool get isSystemMessage => type == MessageType.system;

  /// Returns true if message is currently being streamed
  bool get isStreaming => status == MessageStatus.streaming;

  /// Returns true if message has an error
  bool get hasError => status == MessageStatus.error || error != null;

  /// Returns true if message is still being sent
  bool get isPending => status == MessageStatus.sending;

  /// Returns formatted timestamp
  String get formattedTime {
    final now = DateTime.now();
    final diff = now.difference(timestamp);
    
    if (diff.inMinutes < 1) {
      return 'Just now';
    } else if (diff.inHours < 1) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inDays < 1) {
      return '${diff.inHours}h ago';
    } else {
      return '${diff.inDays}d ago';
    }
  }

  /// Creates a user message
  factory ChatMessageModel.user({
    required String content,
    String? parentMessageId,
  }) =>
      ChatMessageModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: content,
        type: MessageType.user,
        timestamp: DateTime.now(),
        status: MessageStatus.sent,
        parentMessageId: parentMessageId,
      );

  /// Creates an assistant message for streaming
  factory ChatMessageModel.assistantStreaming({
    String? parentMessageId,
  }) =>
      ChatMessageModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: '',
        type: MessageType.assistant,
        timestamp: DateTime.now(),
        status: MessageStatus.streaming,
        parentMessageId: parentMessageId,
      );

  /// Creates a system message
  factory ChatMessageModel.system({
    required String content,
  }) =>
      ChatMessageModel(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        content: content,
        type: MessageType.system,
        timestamp: DateTime.now(),
        status: MessageStatus.delivered,
      );

  /// Updates message content during streaming
  ChatMessageModel updateContent(String newContent) => copyWith(
        content: newContent,
      );

  /// Marks message as completed
  ChatMessageModel markCompleted() => copyWith(
        status: MessageStatus.delivered,
      );

  /// Marks message as error
  ChatMessageModel markError(String errorMessage) => copyWith(
        status: MessageStatus.error,
        error: errorMessage,
      );

  /// Marks message as edited
  ChatMessageModel markEdited(String newContent) => copyWith(
        content: newContent,
        isEdited: true,
        editedAt: DateTime.now(),
      );
} 