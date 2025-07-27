import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../screens/camera_screen.dart';
import '../screens/ingredients_screen.dart';
import '../screens/recipe_screen.dart';
import '../screens/chat_screen.dart';
import '../../domain/entities/ingredient.dart';
import '../../domain/entities/recipe_style.dart';

/// Application router configuration
class AppRouter {
  static const String camera = '/';
  static const String ingredients = '/ingredients';
  static const String recipe = '/recipe';
  static const String chat = '/chat';

  /// Router configuration
  static final GoRouter router = GoRouter(
    initialLocation: camera,
    debugLogDiagnostics: true,
    routes: [
      // Camera Screen (Home)
      GoRoute(
        path: camera,
        name: 'camera',
        builder: (context, state) => const CameraScreen(),
      ),

      // Ingredients Screen
      GoRoute(
        path: ingredients,
        name: 'ingredients',
        builder: (context, state) {
          final ingredientsList = state.extra as List<Ingredient>?;
          
          if (ingredientsList == null) {
            // Redirect to camera if no ingredients provided
            return const CameraScreen();
          }
          
          return IngredientsScreen(ingredients: ingredientsList);
        },
      ),

      // Recipe Screen
      GoRoute(
        path: recipe,
        name: 'recipe',
        builder: (context, state) {
          final args = state.extra as Map<String, dynamic>?;
          
          if (args == null) {
            // Redirect to camera if no arguments provided
            return const CameraScreen();
          }
          
          final ingredientsList = args['ingredients'] as List<Ingredient>?;
          final style = args['style'] as RecipeStyle?;
          
          if (ingredientsList == null || style == null) {
            return const CameraScreen();
          }
          
          return RecipeScreen(
            ingredients: ingredientsList,
            style: style,
          );
        },
      ),

      // Chat Screen
      GoRoute(
        path: chat,
        name: 'chat',
        builder: (context, state) {
          final ingredientsList = state.extra as List<Ingredient>?;
          
          return ChatScreen(ingredients: ingredientsList);
        },
      ),
    ],
    
    // Error page
    errorBuilder: (context, state) => Scaffold(
      appBar: AppBar(
        title: const Text('Error'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              state.error?.toString() ?? 'Unknown error',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go(camera),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
}

/// Extension on BuildContext for easy navigation
extension AppNavigation on BuildContext {
  /// Navigate to camera screen
  void goToCamera() => go(AppRouter.camera);

  /// Navigate to ingredients screen
  void goToIngredients(List<Ingredient> ingredients) => 
      go(AppRouter.ingredients, extra: ingredients);

  /// Navigate to recipe screen
  void goToRecipe({
    required List<Ingredient> ingredients,
    required RecipeStyle style,
  }) => go(AppRouter.recipe, extra: {
    'ingredients': ingredients,
    'style': style,
  });

  /// Navigate to chat screen
  void goToChat([List<Ingredient>? ingredients]) => 
      go(AppRouter.chat, extra: ingredients);

  /// Navigate back
  void goBack() => pop();
} 