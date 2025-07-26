import 'package:flutter/material.dart';

/// Container with gradient background
class GradientContainer extends StatelessWidget {
  const GradientContainer({
    super.key,
    required this.child,
    this.gradient,
    this.begin = Alignment.topLeft,
    this.end = Alignment.bottomRight,
  });

  final Widget child;
  final Gradient? gradient;
  final AlignmentGeometry begin;
  final AlignmentGeometry end;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: gradient ??
            const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1a1a2e), // Dark blue
                Color(0xFF16213e), // Darker blue
                Color(0xFF0f3460), // Darkest blue
              ],
            ),
      ),
      child: child,
    );
  }
} 