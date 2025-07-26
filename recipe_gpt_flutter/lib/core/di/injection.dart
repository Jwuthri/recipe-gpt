import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import '../../data/datasources/ai_remote_datasource.dart';
import '../../data/repositories/ai_repository_impl.dart';
import '../../domain/repositories/ai_repository.dart';
import '../../domain/usecases/analyze_ingredients_usecase.dart';
import '../../domain/usecases/generate_recipe_usecase.dart';
import '../../domain/usecases/generate_chat_response_usecase.dart';
import '../../presentation/blocs/camera/camera_cubit.dart';
import '../../presentation/blocs/ingredients/ingredients_cubit.dart';
import '../../presentation/blocs/recipe/recipe_cubit.dart';
import '../../presentation/blocs/chat/chat_cubit.dart';
import '../network/network_client.dart';

final GetIt getIt = GetIt.instance;

/// Manual dependency injection setup
Future<void> setupDependencies() async {
  // Load environment variables
  await dotenv.load(fileName: '.env');

  // Core dependencies
  getIt.registerLazySingleton<Dio>(() => _createDio());
  getIt.registerLazySingleton<NetworkClient>(
    () => NetworkClient(getIt<Dio>()),
  );

  // Data sources
  getIt.registerLazySingleton<AIRemoteDataSource>(
    () => AIRemoteDataSourceImpl(getIt<NetworkClient>()),
  );

  // Repositories
  getIt.registerLazySingleton<AIRepository>(
    () => AIRepositoryImpl(getIt<AIRemoteDataSource>()),
  );

  // Use cases
  getIt.registerLazySingleton<AnalyzeIngredientsUseCase>(
    () => AnalyzeIngredientsUseCase(getIt<AIRepository>()),
  );
  getIt.registerLazySingleton<GenerateRecipeUseCase>(
    () => GenerateRecipeUseCase(getIt<AIRepository>()),
  );
  getIt.registerLazySingleton<GenerateChatResponseUseCase>(
    () => GenerateChatResponseUseCase(getIt<AIRepository>()),
  );

  // Blocs/Cubits
  getIt.registerFactory<CameraCubit>(
    () => CameraCubit(getIt<AnalyzeIngredientsUseCase>()),
  );
  getIt.registerFactory<IngredientsCubit>(
    () => IngredientsCubit(),
  );
  getIt.registerFactory<RecipeCubit>(
    () => RecipeCubit(getIt<GenerateRecipeUseCase>()),
  );
  getIt.registerFactory<ChatCubit>(
    () => ChatCubit(getIt<GenerateChatResponseUseCase>()),
  );
}

/// Creates configured Dio instance
Dio _createDio() {
  final dio = Dio();
  
  // Configure base options
  dio.options = BaseOptions(
    connectTimeout: const Duration(milliseconds: 30000),
    receiveTimeout: const Duration(milliseconds: 120000), // Increased to 2 minutes for AI responses
    sendTimeout: const Duration(milliseconds: 30000),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  );

  // Add interceptors
  dio.interceptors.add(
    LogInterceptor(
      requestBody: true,
      responseBody: false, // Don't log response body for streaming
      logPrint: (object) {
        print('[DIO] $object');
      },
    ),
  );

  // Add error handling interceptor
  dio.interceptors.add(
    InterceptorsWrapper(
      onError: (error, handler) {
        print('[DIO ERROR] ${error.message}');
        handler.next(error);
      },
    ),
  );

  return dio;
}

/// Resets all dependencies (useful for testing)
Future<void> resetDependencies() async {
  await getIt.reset();
}

/// Type alias for dependency injection
typedef DI = GetIt; 