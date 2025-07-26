import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

import '../blocs/recipe/recipe_cubit.dart';
import '../blocs/recipe/recipe_state.dart';
import '../widgets/gradient_container.dart';
import '../widgets/animated_button.dart';
import '../widgets/loading_overlay.dart';
import '../routes/app_router.dart';
import '../../domain/entities/ingredient.dart';
import '../../domain/entities/recipe_style.dart';
import '../../core/constants/app_constants.dart';

/// Screen for displaying streaming recipe generation
class RecipeScreen extends StatefulWidget {
  const RecipeScreen({
    super.key,
    required this.ingredients,
    required this.style,
  });

  final List<Ingredient> ingredients;
  final RecipeStyle style;

  @override
  State<RecipeScreen> createState() => _RecipeScreenState();
}

class _RecipeScreenState extends State<RecipeScreen>
    with TickerProviderStateMixin {
  late AnimationController _fadeController;
  late AnimationController _typewriterController;
  late Animation<double> _fadeAnimation;

  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _setupAnimations();
    _generateRecipe();
  }

  void _setupAnimations() {
    _fadeController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );

    _typewriterController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );

    _fadeAnimation = Tween<double>(
      begin: 0,
      end: 1,
    ).animate(CurvedAnimation(
      parent: _fadeController,
      curve: Curves.easeInOut,
    ));

    _fadeController.forward();
    
    // Start typewriter animation
    _typewriterController.repeat();
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _typewriterController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _generateRecipe() {
    context.read<RecipeCubit>().generateRecipe(
          ingredients: widget.ingredients,
          style: widget.style,
        );
  }

  void _regenerateRecipe() {
    showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Regenerate Recipe'),
        content: const Text(
          'Generate a new recipe with the same ingredients and style?',
        ),
        actions: [
          TextButton(
                          onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
                              Navigator.of(context).pop();
              _generateRecipe();
            },
            child: const Text('Yes'),
          ),
        ],
      ),
    );
  }

  void _shareRecipe(String content) {
    // TODO: Implement sharing functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Sharing functionality coming soon!'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: BlocConsumer<RecipeCubit, RecipeState>(
        listener: (context, state) {
          if (state is RecipeError) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(state.message),
                backgroundColor: Theme.of(context).colorScheme.error,
              ),
            );
          } else if (state is RecipeStreaming) {
            print('[UI] RecipeStreaming state received, content length: ${state.content.length}');
          } else if (state is RecipeSuccess) {
            // Stop typewriter animation when streaming is complete
            _typewriterController.stop();
          }
        },
        builder: (context, state) {
          return Stack(
            children: [
              GradientContainer(
                child: SafeArea(
                  child: Column(
                    children: [
                      _buildHeader(state),
                      Expanded(
                        child: _buildContent(state),
                      ),
                    ],
                  ),
                ),
              ),
              if (state is RecipeInitial || state is RecipeLoading)
                LoadingOverlay(
                  message: state is RecipeLoading 
                      ? state.message 
                      : 'Preparing your recipe...',
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildHeader(RecipeState state) {
    return Container(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        border: Border(
          bottom: BorderSide(
            color: Colors.white.withOpacity(0.1),
          ),
        ),
      ),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.goToIngredients(widget.ingredients),
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.15),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(
                  color: Colors.white.withOpacity(0.3),
                ),
              ),
              child: const Icon(
                Icons.arrow_back,
                color: Colors.white,
                size: 24,
              ),
            ),
          ),
          const SizedBox(width: AppConstants.defaultPadding),
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  widget.style.id == 'high-protein' 
                      ? const Color(0xFFFF6B6B) 
                      : widget.style.id == 'vegan'
                          ? const Color(0xFF4ECDC4)
                          : const Color(0xFF667eea),
                  widget.style.id == 'high-protein' 
                      ? const Color(0xFFFF8E8E) 
                      : widget.style.id == 'vegan'
                          ? const Color(0xFF44A08D)
                          : const Color(0xFF764ba2),
                ],
              ),
              borderRadius: BorderRadius.circular(25),
            ),
            child: Center(
              child: Text(
                widget.style.icon,
                style: const TextStyle(fontSize: 24),
              ),
            ),
          ),
          const SizedBox(width: AppConstants.defaultPadding),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.style.title,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                Text(
                  'AI-generated recipe',
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: Colors.white70,
                  ),
                ),
              ],
            ),
          ),
          if (state is RecipeSuccess && state.recipe.content.isNotEmpty) ...[
            GestureDetector(
              onTap: _regenerateRecipe,
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                  ),
                ),
                child: const Icon(
                  Icons.refresh,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
            const SizedBox(width: AppConstants.smallPadding),
            GestureDetector(
              onTap: () => _shareRecipe(state.recipe.content),
              child: Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withOpacity(0.3),
                  ),
                ),
                child: const Icon(
                  Icons.share,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildContent(RecipeState state) {
    if (state is RecipeStreaming) {
      return _buildStreamingContent(state.content, !state.isComplete);
    } else if (state is RecipeSuccess) {
      return _buildStreamingContent(state.recipe.content, false);
    } else if (state is RecipeError) {
      return _buildErrorContent(state.message);
    }
    
    return const SizedBox.shrink();
  }

  Widget _buildStreamingContent(String content, bool isStreaming) {
    // Auto-scroll to bottom when new content arrives
    if (isStreaming && content.isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 100),
            curve: Curves.easeOut,
          );
        }
      });
    }

    return FadeTransition(
      opacity: _fadeAnimation,
      child: Column(
        children: [
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(AppConstants.defaultPadding),
              padding: const EdgeInsets.all(AppConstants.largePadding),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.08),
                borderRadius: BorderRadius.circular(AppConstants.largeBorderRadius),
                border: Border.all(
                  color: Colors.white.withOpacity(0.15),
                ),
              ),
              child: SingleChildScrollView(
                controller: _scrollController,
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    RepaintBoundary(
                      child: MarkdownBody(
                        data: content,
                        styleSheet: _getMarkdownStyleSheet(),
                        selectable: true,
                        shrinkWrap: false,
                        fitContent: false,
                      ),
                    ),
                    if (isStreaming) ...[
                      const SizedBox(height: AppConstants.smallPadding),
                      _buildTypingIndicator(),
                    ],
                  ],
                ),
              ),
            ),
          ),
          if (!isStreaming && content.isNotEmpty)
            _buildActionButtons(),
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Row(
      children: [
        ...List.generate(3, (index) {
          return AnimatedBuilder(
            animation: _typewriterController,
            builder: (context, child) {
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 2),
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF4ECDC4).withOpacity(
                    0.3 + 0.7 * ((_typewriterController.value + index * 0.2) % 1.0),
                  ),
                ),
              );
            },
          );
        }),
        const SizedBox(width: AppConstants.smallPadding),
        Text(
          'AI is writing...',
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: const Color(0xFF4ECDC4),
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }

  Widget _buildActionButtons() {
    return Padding(
      padding: const EdgeInsets.all(AppConstants.defaultPadding),
      child: Column(
        children: [
          AnimatedButton(
            onPressed: () => context.goToCamera(),
            gradient: const LinearGradient(
              colors: [Color(0xFF4ECDC4), Color(0xFF44A08D)],
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.camera_alt,
                  color: Colors.white,
                ),
                SizedBox(width: AppConstants.smallPadding),
                Text(
                  'Cook Another Recipe',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppConstants.defaultPadding),
          AnimatedButton(
            onPressed: _regenerateRecipe,
            gradient: LinearGradient(
              colors: [
                Colors.white.withOpacity(0.1),
                Colors.white.withOpacity(0.05),
              ],
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.refresh,
                  color: Colors.white,
                  size: 20,
                ),
                SizedBox(width: AppConstants.smallPadding),
                Text(
                  'Try Again',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorContent(String message) {
    return Center(
      child: Container(
        margin: const EdgeInsets.all(AppConstants.extraLargePadding),
        padding: const EdgeInsets.all(AppConstants.extraLargePadding),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.08),
          borderRadius: BorderRadius.circular(AppConstants.largeBorderRadius),
          border: Border.all(
            color: Colors.white.withOpacity(0.15),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: AppConstants.defaultPadding),
            Text(
              'Oops! Something went wrong',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppConstants.smallPadding),
            Text(
              message,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.white70,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppConstants.largePadding),
            Row(
              children: [
                Expanded(
                  child: AnimatedButton(
                    onPressed: _generateRecipe,
                    gradient: const LinearGradient(
                      colors: [Color(0xFFFF6B6B), Color(0xFFFF8E8E)],
                    ),
                    child: const Text(
                      'Try Again',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppConstants.defaultPadding),
                Expanded(
                  child: AnimatedButton(
                    onPressed: () => context.goBack(),
                    gradient: LinearGradient(
                      colors: [
                        Colors.white.withOpacity(0.1),
                        Colors.white.withOpacity(0.05),
                      ],
                    ),
                    child: const Text(
                      'Go Back',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  MarkdownStyleSheet _getMarkdownStyleSheet() {
    return MarkdownStyleSheet(
      p: Theme.of(context).textTheme.bodyLarge?.copyWith(
        color: Colors.white.withOpacity(0.9),
        height: 1.6,
      ),
      h1: Theme.of(context).textTheme.headlineMedium?.copyWith(
        color: const Color(0xFF4ECDC4),
        fontWeight: FontWeight.bold,
      ),
      h2: Theme.of(context).textTheme.headlineSmall?.copyWith(
        color: const Color(0xFF4ECDC4),
        fontWeight: FontWeight.bold,
      ),
      h3: Theme.of(context).textTheme.titleLarge?.copyWith(
        color: const Color(0xFF4ECDC4),
        fontWeight: FontWeight.bold,
      ),
      listBullet: Theme.of(context).textTheme.bodyLarge?.copyWith(
        color: Colors.white.withOpacity(0.9),
      ),
      tableCellsDecoration: BoxDecoration(
        border: Border.all(
          color: Colors.white.withOpacity(0.3),
        ),
      ),
      tableHead: Theme.of(context).textTheme.titleMedium?.copyWith(
        color: const Color(0xFF4ECDC4),
        fontWeight: FontWeight.bold,
      ),
      tableBody: Theme.of(context).textTheme.bodyMedium?.copyWith(
        color: Colors.white.withOpacity(0.9),
      ),
      code: Theme.of(context).textTheme.bodyMedium?.copyWith(
        color: const Color(0xFF4ECDC4),
        backgroundColor: Colors.black.withOpacity(0.3),
        fontFamily: 'monospace',
      ),
      strong: Theme.of(context).textTheme.bodyLarge?.copyWith(
        color: const Color(0xFF4ECDC4),
        fontWeight: FontWeight.bold,
      ),
    );
  }
} 