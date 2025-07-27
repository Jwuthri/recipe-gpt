// coverage:ignore-file
// GENERATED CODE - DO NOT MODIFY BY HAND
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'recipe_model.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

T _$identity<T>(T value) => value;

final _privateConstructorUsedError = UnsupportedError(
    'It seems like you constructed your class using `MyClass._()`. This constructor is only meant to be used by freezed and you are not supposed to need it nor use it.\nPlease check the documentation here for more information: https://github.com/rrousselGit/freezed#adding-getters-and-methods-to-our-models');

RecipeModel _$RecipeModelFromJson(Map<String, dynamic> json) {
  return _RecipeModel.fromJson(json);
}

/// @nodoc
mixin _$RecipeModel {
  String get id => throw _privateConstructorUsedError;
  String get title => throw _privateConstructorUsedError;
  String get content => throw _privateConstructorUsedError;
  List<IngredientModel> get ingredients => throw _privateConstructorUsedError;
  RecipeStyleModel get style => throw _privateConstructorUsedError;
  DateTime get createdAt => throw _privateConstructorUsedError;
  String? get description => throw _privateConstructorUsedError;
  int? get prepTime => throw _privateConstructorUsedError;
  int? get cookTime => throw _privateConstructorUsedError;
  int? get servings => throw _privateConstructorUsedError;
  String? get difficulty => throw _privateConstructorUsedError;
  List<String>? get instructions => throw _privateConstructorUsedError;
  Map<String, String>? get nutritionInfo => throw _privateConstructorUsedError;
  List<String>? get tips => throw _privateConstructorUsedError;
  List<String>? get variations => throw _privateConstructorUsedError;
  List<String>? get tags => throw _privateConstructorUsedError;
  double? get rating => throw _privateConstructorUsedError;
  bool? get isFavorite => throw _privateConstructorUsedError;
  DateTime? get lastUpdated => throw _privateConstructorUsedError;

  /// Serializes this RecipeModel to a JSON map.
  Map<String, dynamic> toJson() => throw _privateConstructorUsedError;

  /// Create a copy of RecipeModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  $RecipeModelCopyWith<RecipeModel> get copyWith =>
      throw _privateConstructorUsedError;
}

/// @nodoc
abstract class $RecipeModelCopyWith<$Res> {
  factory $RecipeModelCopyWith(
          RecipeModel value, $Res Function(RecipeModel) then) =
      _$RecipeModelCopyWithImpl<$Res, RecipeModel>;
  @useResult
  $Res call(
      {String id,
      String title,
      String content,
      List<IngredientModel> ingredients,
      RecipeStyleModel style,
      DateTime createdAt,
      String? description,
      int? prepTime,
      int? cookTime,
      int? servings,
      String? difficulty,
      List<String>? instructions,
      Map<String, String>? nutritionInfo,
      List<String>? tips,
      List<String>? variations,
      List<String>? tags,
      double? rating,
      bool? isFavorite,
      DateTime? lastUpdated});

  $RecipeStyleModelCopyWith<$Res> get style;
}

/// @nodoc
class _$RecipeModelCopyWithImpl<$Res, $Val extends RecipeModel>
    implements $RecipeModelCopyWith<$Res> {
  _$RecipeModelCopyWithImpl(this._value, this._then);

  // ignore: unused_field
  final $Val _value;
  // ignore: unused_field
  final $Res Function($Val) _then;

  /// Create a copy of RecipeModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? content = null,
    Object? ingredients = null,
    Object? style = null,
    Object? createdAt = null,
    Object? description = freezed,
    Object? prepTime = freezed,
    Object? cookTime = freezed,
    Object? servings = freezed,
    Object? difficulty = freezed,
    Object? instructions = freezed,
    Object? nutritionInfo = freezed,
    Object? tips = freezed,
    Object? variations = freezed,
    Object? tags = freezed,
    Object? rating = freezed,
    Object? isFavorite = freezed,
    Object? lastUpdated = freezed,
  }) {
    return _then(_value.copyWith(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      ingredients: null == ingredients
          ? _value.ingredients
          : ingredients // ignore: cast_nullable_to_non_nullable
              as List<IngredientModel>,
      style: null == style
          ? _value.style
          : style // ignore: cast_nullable_to_non_nullable
              as RecipeStyleModel,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      prepTime: freezed == prepTime
          ? _value.prepTime
          : prepTime // ignore: cast_nullable_to_non_nullable
              as int?,
      cookTime: freezed == cookTime
          ? _value.cookTime
          : cookTime // ignore: cast_nullable_to_non_nullable
              as int?,
      servings: freezed == servings
          ? _value.servings
          : servings // ignore: cast_nullable_to_non_nullable
              as int?,
      difficulty: freezed == difficulty
          ? _value.difficulty
          : difficulty // ignore: cast_nullable_to_non_nullable
              as String?,
      instructions: freezed == instructions
          ? _value.instructions
          : instructions // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      nutritionInfo: freezed == nutritionInfo
          ? _value.nutritionInfo
          : nutritionInfo // ignore: cast_nullable_to_non_nullable
              as Map<String, String>?,
      tips: freezed == tips
          ? _value.tips
          : tips // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      variations: freezed == variations
          ? _value.variations
          : variations // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      tags: freezed == tags
          ? _value.tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      rating: freezed == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as double?,
      isFavorite: freezed == isFavorite
          ? _value.isFavorite
          : isFavorite // ignore: cast_nullable_to_non_nullable
              as bool?,
      lastUpdated: freezed == lastUpdated
          ? _value.lastUpdated
          : lastUpdated // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ) as $Val);
  }

  /// Create a copy of RecipeModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @pragma('vm:prefer-inline')
  $RecipeStyleModelCopyWith<$Res> get style {
    return $RecipeStyleModelCopyWith<$Res>(_value.style, (value) {
      return _then(_value.copyWith(style: value) as $Val);
    });
  }
}

/// @nodoc
abstract class _$$RecipeModelImplCopyWith<$Res>
    implements $RecipeModelCopyWith<$Res> {
  factory _$$RecipeModelImplCopyWith(
          _$RecipeModelImpl value, $Res Function(_$RecipeModelImpl) then) =
      __$$RecipeModelImplCopyWithImpl<$Res>;
  @override
  @useResult
  $Res call(
      {String id,
      String title,
      String content,
      List<IngredientModel> ingredients,
      RecipeStyleModel style,
      DateTime createdAt,
      String? description,
      int? prepTime,
      int? cookTime,
      int? servings,
      String? difficulty,
      List<String>? instructions,
      Map<String, String>? nutritionInfo,
      List<String>? tips,
      List<String>? variations,
      List<String>? tags,
      double? rating,
      bool? isFavorite,
      DateTime? lastUpdated});

  @override
  $RecipeStyleModelCopyWith<$Res> get style;
}

/// @nodoc
class __$$RecipeModelImplCopyWithImpl<$Res>
    extends _$RecipeModelCopyWithImpl<$Res, _$RecipeModelImpl>
    implements _$$RecipeModelImplCopyWith<$Res> {
  __$$RecipeModelImplCopyWithImpl(
      _$RecipeModelImpl _value, $Res Function(_$RecipeModelImpl) _then)
      : super(_value, _then);

  /// Create a copy of RecipeModel
  /// with the given fields replaced by the non-null parameter values.
  @pragma('vm:prefer-inline')
  @override
  $Res call({
    Object? id = null,
    Object? title = null,
    Object? content = null,
    Object? ingredients = null,
    Object? style = null,
    Object? createdAt = null,
    Object? description = freezed,
    Object? prepTime = freezed,
    Object? cookTime = freezed,
    Object? servings = freezed,
    Object? difficulty = freezed,
    Object? instructions = freezed,
    Object? nutritionInfo = freezed,
    Object? tips = freezed,
    Object? variations = freezed,
    Object? tags = freezed,
    Object? rating = freezed,
    Object? isFavorite = freezed,
    Object? lastUpdated = freezed,
  }) {
    return _then(_$RecipeModelImpl(
      id: null == id
          ? _value.id
          : id // ignore: cast_nullable_to_non_nullable
              as String,
      title: null == title
          ? _value.title
          : title // ignore: cast_nullable_to_non_nullable
              as String,
      content: null == content
          ? _value.content
          : content // ignore: cast_nullable_to_non_nullable
              as String,
      ingredients: null == ingredients
          ? _value._ingredients
          : ingredients // ignore: cast_nullable_to_non_nullable
              as List<IngredientModel>,
      style: null == style
          ? _value.style
          : style // ignore: cast_nullable_to_non_nullable
              as RecipeStyleModel,
      createdAt: null == createdAt
          ? _value.createdAt
          : createdAt // ignore: cast_nullable_to_non_nullable
              as DateTime,
      description: freezed == description
          ? _value.description
          : description // ignore: cast_nullable_to_non_nullable
              as String?,
      prepTime: freezed == prepTime
          ? _value.prepTime
          : prepTime // ignore: cast_nullable_to_non_nullable
              as int?,
      cookTime: freezed == cookTime
          ? _value.cookTime
          : cookTime // ignore: cast_nullable_to_non_nullable
              as int?,
      servings: freezed == servings
          ? _value.servings
          : servings // ignore: cast_nullable_to_non_nullable
              as int?,
      difficulty: freezed == difficulty
          ? _value.difficulty
          : difficulty // ignore: cast_nullable_to_non_nullable
              as String?,
      instructions: freezed == instructions
          ? _value._instructions
          : instructions // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      nutritionInfo: freezed == nutritionInfo
          ? _value._nutritionInfo
          : nutritionInfo // ignore: cast_nullable_to_non_nullable
              as Map<String, String>?,
      tips: freezed == tips
          ? _value._tips
          : tips // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      variations: freezed == variations
          ? _value._variations
          : variations // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      tags: freezed == tags
          ? _value._tags
          : tags // ignore: cast_nullable_to_non_nullable
              as List<String>?,
      rating: freezed == rating
          ? _value.rating
          : rating // ignore: cast_nullable_to_non_nullable
              as double?,
      isFavorite: freezed == isFavorite
          ? _value.isFavorite
          : isFavorite // ignore: cast_nullable_to_non_nullable
              as bool?,
      lastUpdated: freezed == lastUpdated
          ? _value.lastUpdated
          : lastUpdated // ignore: cast_nullable_to_non_nullable
              as DateTime?,
    ));
  }
}

/// @nodoc
@JsonSerializable()
class _$RecipeModelImpl extends _RecipeModel {
  const _$RecipeModelImpl(
      {required this.id,
      required this.title,
      required this.content,
      required final List<IngredientModel> ingredients,
      required this.style,
      required this.createdAt,
      this.description,
      this.prepTime,
      this.cookTime,
      this.servings,
      this.difficulty,
      final List<String>? instructions,
      final Map<String, String>? nutritionInfo,
      final List<String>? tips,
      final List<String>? variations,
      final List<String>? tags,
      this.rating,
      this.isFavorite,
      this.lastUpdated})
      : _ingredients = ingredients,
        _instructions = instructions,
        _nutritionInfo = nutritionInfo,
        _tips = tips,
        _variations = variations,
        _tags = tags,
        super._();

  factory _$RecipeModelImpl.fromJson(Map<String, dynamic> json) =>
      _$$RecipeModelImplFromJson(json);

  @override
  final String id;
  @override
  final String title;
  @override
  final String content;
  final List<IngredientModel> _ingredients;
  @override
  List<IngredientModel> get ingredients {
    if (_ingredients is EqualUnmodifiableListView) return _ingredients;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(_ingredients);
  }

  @override
  final RecipeStyleModel style;
  @override
  final DateTime createdAt;
  @override
  final String? description;
  @override
  final int? prepTime;
  @override
  final int? cookTime;
  @override
  final int? servings;
  @override
  final String? difficulty;
  final List<String>? _instructions;
  @override
  List<String>? get instructions {
    final value = _instructions;
    if (value == null) return null;
    if (_instructions is EqualUnmodifiableListView) return _instructions;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final Map<String, String>? _nutritionInfo;
  @override
  Map<String, String>? get nutritionInfo {
    final value = _nutritionInfo;
    if (value == null) return null;
    if (_nutritionInfo is EqualUnmodifiableMapView) return _nutritionInfo;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableMapView(value);
  }

  final List<String>? _tips;
  @override
  List<String>? get tips {
    final value = _tips;
    if (value == null) return null;
    if (_tips is EqualUnmodifiableListView) return _tips;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final List<String>? _variations;
  @override
  List<String>? get variations {
    final value = _variations;
    if (value == null) return null;
    if (_variations is EqualUnmodifiableListView) return _variations;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  final List<String>? _tags;
  @override
  List<String>? get tags {
    final value = _tags;
    if (value == null) return null;
    if (_tags is EqualUnmodifiableListView) return _tags;
    // ignore: implicit_dynamic_type
    return EqualUnmodifiableListView(value);
  }

  @override
  final double? rating;
  @override
  final bool? isFavorite;
  @override
  final DateTime? lastUpdated;

  @override
  String toString() {
    return 'RecipeModel(id: $id, title: $title, content: $content, ingredients: $ingredients, style: $style, createdAt: $createdAt, description: $description, prepTime: $prepTime, cookTime: $cookTime, servings: $servings, difficulty: $difficulty, instructions: $instructions, nutritionInfo: $nutritionInfo, tips: $tips, variations: $variations, tags: $tags, rating: $rating, isFavorite: $isFavorite, lastUpdated: $lastUpdated)';
  }

  @override
  bool operator ==(Object other) {
    return identical(this, other) ||
        (other.runtimeType == runtimeType &&
            other is _$RecipeModelImpl &&
            (identical(other.id, id) || other.id == id) &&
            (identical(other.title, title) || other.title == title) &&
            (identical(other.content, content) || other.content == content) &&
            const DeepCollectionEquality()
                .equals(other._ingredients, _ingredients) &&
            (identical(other.style, style) || other.style == style) &&
            (identical(other.createdAt, createdAt) ||
                other.createdAt == createdAt) &&
            (identical(other.description, description) ||
                other.description == description) &&
            (identical(other.prepTime, prepTime) ||
                other.prepTime == prepTime) &&
            (identical(other.cookTime, cookTime) ||
                other.cookTime == cookTime) &&
            (identical(other.servings, servings) ||
                other.servings == servings) &&
            (identical(other.difficulty, difficulty) ||
                other.difficulty == difficulty) &&
            const DeepCollectionEquality()
                .equals(other._instructions, _instructions) &&
            const DeepCollectionEquality()
                .equals(other._nutritionInfo, _nutritionInfo) &&
            const DeepCollectionEquality().equals(other._tips, _tips) &&
            const DeepCollectionEquality()
                .equals(other._variations, _variations) &&
            const DeepCollectionEquality().equals(other._tags, _tags) &&
            (identical(other.rating, rating) || other.rating == rating) &&
            (identical(other.isFavorite, isFavorite) ||
                other.isFavorite == isFavorite) &&
            (identical(other.lastUpdated, lastUpdated) ||
                other.lastUpdated == lastUpdated));
  }

  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  int get hashCode => Object.hashAll([
        runtimeType,
        id,
        title,
        content,
        const DeepCollectionEquality().hash(_ingredients),
        style,
        createdAt,
        description,
        prepTime,
        cookTime,
        servings,
        difficulty,
        const DeepCollectionEquality().hash(_instructions),
        const DeepCollectionEquality().hash(_nutritionInfo),
        const DeepCollectionEquality().hash(_tips),
        const DeepCollectionEquality().hash(_variations),
        const DeepCollectionEquality().hash(_tags),
        rating,
        isFavorite,
        lastUpdated
      ]);

  /// Create a copy of RecipeModel
  /// with the given fields replaced by the non-null parameter values.
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  @pragma('vm:prefer-inline')
  _$$RecipeModelImplCopyWith<_$RecipeModelImpl> get copyWith =>
      __$$RecipeModelImplCopyWithImpl<_$RecipeModelImpl>(this, _$identity);

  @override
  Map<String, dynamic> toJson() {
    return _$$RecipeModelImplToJson(
      this,
    );
  }
}

abstract class _RecipeModel extends RecipeModel {
  const factory _RecipeModel(
      {required final String id,
      required final String title,
      required final String content,
      required final List<IngredientModel> ingredients,
      required final RecipeStyleModel style,
      required final DateTime createdAt,
      final String? description,
      final int? prepTime,
      final int? cookTime,
      final int? servings,
      final String? difficulty,
      final List<String>? instructions,
      final Map<String, String>? nutritionInfo,
      final List<String>? tips,
      final List<String>? variations,
      final List<String>? tags,
      final double? rating,
      final bool? isFavorite,
      final DateTime? lastUpdated}) = _$RecipeModelImpl;
  const _RecipeModel._() : super._();

  factory _RecipeModel.fromJson(Map<String, dynamic> json) =
      _$RecipeModelImpl.fromJson;

  @override
  String get id;
  @override
  String get title;
  @override
  String get content;
  @override
  List<IngredientModel> get ingredients;
  @override
  RecipeStyleModel get style;
  @override
  DateTime get createdAt;
  @override
  String? get description;
  @override
  int? get prepTime;
  @override
  int? get cookTime;
  @override
  int? get servings;
  @override
  String? get difficulty;
  @override
  List<String>? get instructions;
  @override
  Map<String, String>? get nutritionInfo;
  @override
  List<String>? get tips;
  @override
  List<String>? get variations;
  @override
  List<String>? get tags;
  @override
  double? get rating;
  @override
  bool? get isFavorite;
  @override
  DateTime? get lastUpdated;

  /// Create a copy of RecipeModel
  /// with the given fields replaced by the non-null parameter values.
  @override
  @JsonKey(includeFromJson: false, includeToJson: false)
  _$$RecipeModelImplCopyWith<_$RecipeModelImpl> get copyWith =>
      throw _privateConstructorUsedError;
}
