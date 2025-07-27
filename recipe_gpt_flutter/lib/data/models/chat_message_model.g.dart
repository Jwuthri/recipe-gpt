// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'chat_message_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

_$ChatMessageModelImpl _$$ChatMessageModelImplFromJson(
        Map<String, dynamic> json) =>
    _$ChatMessageModelImpl(
      id: json['id'] as String,
      content: json['content'] as String,
      type: $enumDecode(_$MessageTypeEnumMap, json['type']),
      timestamp: DateTime.parse(json['timestamp'] as String),
      status: $enumDecodeNullable(_$MessageStatusEnumMap, json['status']),
      error: json['error'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      parentMessageId: json['parentMessageId'] as String?,
      isEdited: json['isEdited'] as bool?,
      editedAt: json['editedAt'] == null
          ? null
          : DateTime.parse(json['editedAt'] as String),
    );

Map<String, dynamic> _$$ChatMessageModelImplToJson(
        _$ChatMessageModelImpl instance) =>
    <String, dynamic>{
      'id': instance.id,
      'content': instance.content,
      'type': _$MessageTypeEnumMap[instance.type]!,
      'timestamp': instance.timestamp.toIso8601String(),
      'status': _$MessageStatusEnumMap[instance.status],
      'error': instance.error,
      'metadata': instance.metadata,
      'parentMessageId': instance.parentMessageId,
      'isEdited': instance.isEdited,
      'editedAt': instance.editedAt?.toIso8601String(),
    };

const _$MessageTypeEnumMap = {
  MessageType.user: 'user',
  MessageType.assistant: 'assistant',
  MessageType.system: 'system',
};

const _$MessageStatusEnumMap = {
  MessageStatus.sending: 'sending',
  MessageStatus.sent: 'sent',
  MessageStatus.delivered: 'delivered',
  MessageStatus.error: 'error',
  MessageStatus.streaming: 'streaming',
};
