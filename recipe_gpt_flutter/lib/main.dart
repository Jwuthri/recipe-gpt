import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:dynamic_color/dynamic_color.dart';

import 'config/app_config.dart';
import 'core/di/injection.dart';
import 'presentation/themes/app_theme.dart';
import 'presentation/routes/app_router.dart';
import 'presentation/blocs/camera/camera_cubit.dart';
import 'presentation/blocs/ingredients/ingredients_cubit.dart';
import 'presentation/blocs/recipe/recipe_cubit.dart';
import 'presentation/blocs/chat/chat_cubit.dart';

/// Main entry point of the Recipe GPT Flutter application
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set preferred orientations
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);
  
  // Initialize app configuration
  await AppConfig.initialize();
  
  // Setup dependency injection
  await setupDependencies();
  
  // Set system UI overlay style
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  
  runApp(const RecipeGPTApp());
}

/// Root application widget
class RecipeGPTApp extends StatelessWidget {
  const RecipeGPTApp({super.key});

  @override
  Widget build(BuildContext context) {
    return DynamicColorBuilder(
      builder: (lightDynamic, darkDynamic) {
        return MultiBlocProvider(
          providers: [
            BlocProvider<CameraCubit>(
              create: (_) => getIt<CameraCubit>(),
            ),
            BlocProvider<IngredientsCubit>(
              create: (_) => getIt<IngredientsCubit>(),
            ),
            BlocProvider<RecipeCubit>(
              create: (_) => getIt<RecipeCubit>(),
            ),
            BlocProvider<ChatCubit>(
              create: (_) => getIt<ChatCubit>(),
            ),
          ],
          child: MaterialApp.router(
            title: 'Recipe GPT Flutter',
            debugShowCheckedModeBanner: false,
            
            // Theme configuration
            theme: AppTheme.lightTheme(lightDynamic),
            darkTheme: AppTheme.darkTheme(darkDynamic),
            themeMode: ThemeMode.dark, // Default to dark theme
            
            // Router configuration
            routerConfig: AppRouter.router,
            
            // Localization (placeholder for future implementation)
            supportedLocales: const [
              Locale('en', 'US'),
            ],
            
            // Builder for global configurations
            builder: (context, child) {
              return MediaQuery(
                // Disable text scaling for consistent UI
                data: MediaQuery.of(context).copyWith(
                  textScaler: const TextScaler.linear(1.0),
                ),
                child: child!,
              );
            },
          ),
        );
      },
    );
  }
}

/// Bloc observer for debugging (optional)
class AppBlocObserver extends BlocObserver {
  @override
  void onChange(BlocBase bloc, Change change) {
    super.onChange(bloc, change);
    if (AppConfig.isDebugMode) {
      print('${bloc.runtimeType} $change');
    }
  }

  @override
  void onError(BlocBase bloc, Object error, StackTrace stackTrace) {
    super.onError(bloc, error, stackTrace);
    if (AppConfig.isDebugMode) {
      print('${bloc.runtimeType} $error');
      print(stackTrace);
    }
  }
} 