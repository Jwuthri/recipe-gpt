import 'package:flutter/material.dart';

import '../../core/constants/app_constants.dart';

/// Animated button with gradient background and press effects
class AnimatedButton extends StatefulWidget {
  const AnimatedButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.gradient,
    this.padding,
    this.borderRadius,
    this.elevation = 8.0,
    this.pressScale = 0.95,
  });

  final VoidCallback? onPressed;
  final Widget child;
  final Gradient? gradient;
  final EdgeInsets? padding;
  final double? borderRadius;
  final double elevation;
  final double pressScale;

  @override
  State<AnimatedButton> createState() => _AnimatedButtonState();
}

class _AnimatedButtonState extends State<AnimatedButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _elevationAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 150),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.pressScale,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));

    _elevationAnimation = Tween<double>(
      begin: widget.elevation,
      end: widget.elevation * 0.5,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onTapDown(TapDownDetails details) {
    if (widget.onPressed != null) {
      _controller.forward();
    }
  }

  void _onTapUp(TapUpDetails details) {
    if (widget.onPressed != null) {
      _controller.reverse();
    }
  }

  void _onTapCancel() {
    _controller.reverse();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTapDown: _onTapDown,
      onTapUp: _onTapUp,
      onTapCancel: _onTapCancel,
      onTap: widget.onPressed,
      child: AnimatedBuilder(
        animation: _controller,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Container(
              width: double.infinity,
              padding: widget.padding ??
                  const EdgeInsets.symmetric(
                    vertical: AppConstants.defaultPadding,
                    horizontal: AppConstants.largePadding,
                  ),
              decoration: BoxDecoration(
                gradient: widget.onPressed == null
                    ? const LinearGradient(
                        colors: [Colors.grey, Colors.grey],
                      )
                    : widget.gradient ??
                        const LinearGradient(
                          colors: [Color(0xFF4ECDC4), Color(0xFF44A08D)],
                        ),
                borderRadius: BorderRadius.circular(
                  widget.borderRadius ?? AppConstants.largeBorderRadius,
                ),
                boxShadow: widget.onPressed == null
                    ? null
                    : [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.3),
                          blurRadius: _elevationAnimation.value,
                          offset: Offset(0, _elevationAnimation.value * 0.5),
                        ),
                      ],
              ),
              child: widget.child,
            ),
          );
        },
      ),
    );
  }
} 