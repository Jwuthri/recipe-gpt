import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
  Share,
  Alert,
} from 'react-native';
import {Button, IconButton, ActivityIndicator} from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import AIService from '../services/AIService';

const {width} = Dimensions.get('window');

const RecipeScreen = ({route, navigation}) => {
  const {ingredients, recipeStyle} = route.params;
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef(null);

  useEffect(() => {
    // Add a safety timeout in case something gets stuck
    const timeout = setTimeout(() => {
      if (loading) {
        console.log('Recipe generation timeout!');
        setLoading(false);
        setRecipe('Recipe generation timed out. Please try again.');
        Alert.alert('Timeout', 'Recipe generation is taking too long. Please try again.');
      }
    }, 60000); // 60 second timeout

    // Only generate recipe once when component mounts
    if (!recipe) {
      generateRecipe();
    }
    startPulseAnimation();

    return () => clearTimeout(timeout);
  }, []); // Empty dependency array - only run once

  const pulseAnimationRef = useRef(null);

  const startPulseAnimation = () => {
    if (loading) { // Only animate when loading
      pulseAnimationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimationRef.current.start();
    }
  };

  const stopPulseAnimation = () => {
    if (pulseAnimationRef.current) {
      pulseAnimationRef.current.stop();
      pulseAnimationRef.current = null;
    }
  };

  const generateRecipe = async () => {
    try {
      console.log('Starting recipe generation...');
      console.log('Ingredients:', ingredients);
      console.log('Recipe style:', recipeStyle);
      
      setLoading(true);
      setProgress('🤖 AI Chef is thinking...');

      // // Filter out potentially problematic ingredients that might trigger safety filters
      // const filteredIngredients = AIService.filterIngredients(ingredients);
      
      // if (filteredIngredients.length === 0) {
      //   setLoading(false);
      //   setRecipe('Sorry, I cannot create a recipe with the current ingredients due to content policy restrictions. Please try with different ingredients.');
      //   return;
      // }

      // if (filteredIngredients.length < ingredients.length) {
      //   const removedCount = ingredients.length - filteredIngredients.length;
      //   console.log(`⚠️ Filtered out ${removedCount} ingredients due to content policies`);
        
      //   // Show alert to user about filtered ingredients
      //   setTimeout(() => {
      //     Alert.alert(
      //       'Ingredients Filtered',
      //       `${removedCount} ingredient(s) containing alcohol or other restricted items were removed from your recipe to comply with content policies.`,
      //       [{text: 'OK'}]
      //     );
      //   }, 1000);
      // }

             const ingredientList = ingredients
         .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`)
         .join(', ');

       console.log('Ingredient list:', ingredientList);

      // Create a specialized prompt based on the selected style
      const stylePrompts = {
        'high-protein': `Focus on protein-rich preparation methods, include protein content per serving, and suggest high-protein variations.`,
        'vegan': `Use only plant-based ingredients and cooking methods. Ensure no animal products are used. Include nutritional info for vegans.`,
        'keto': `Create a low-carb, high-fat recipe. Limit carbs to under 20g per serving. Include net carb count.`,
        'mediterranean': `Use Mediterranean herbs, olive oil, and cooking techniques. Include fresh herbs and healthy fats.`,
        'comfort': `Create a hearty, satisfying comfort food recipe with rich flavors and warming spices.`,
        'quick': `Focus on quick cooking methods under 30 minutes. Include prep and cook times for each step.`,
      };

      const prompt = `Create a delicious ${recipeStyle.title.toLowerCase()} recipe with: ${ingredientList}

${stylePrompts[recipeStyle.id] || ''}

Format:
# ${recipeStyle.icon} [Recipe Name]
⏱️ Prep: X min | Cook: X min | Serves: X

## Ingredients
- List with measurements

## Instructions
1. Clear step-by-step directions (3-5 steps)
2. Include temperatures and timing

## 🍳Nutritional information:
| Nutrient | Amount |
|----------|--------|
| Calories | 450    |
| Protein  | 25g    |
| Carbs    | 35g    |
| Fat      | 20g    |
| Sugar    | 8g     |
| Fiber    | 5g     |
| Sodium   | 650mg  |

## Tips
- 2-3 cooking tips
- Substitutions if needed

Keep it concise but complete!`;

      let fullRecipe = '';
      
      console.log('About to call AIService.generateChatResponse...');
      
      await AIService.generateChatResponse(
        prompt,
        // onChunk callback - called multiple times during streaming
        (chunk, fullContent) => {
          console.log('Received chunk, full content length:', fullContent.length);
          setRecipe(fullContent);
          if (loading) setLoading(false); // Only update if still loading
        },
        // onComplete callback - called once when done
        (finalContent) => {
          console.log('Recipe generation complete, final content length:', finalContent.length);
          setLoading(false);
          setRecipe(finalContent);
          setProgress('');
          stopPulseAnimation(); // Stop animation when done
          // Scroll to top when complete
          setTimeout(() => {
            if (scrollViewRef.current) {
              scrollViewRef.current.scrollTo({y: 0, animated: true});
            }
          }, 200);
        },
        // onError callback
        (error) => {
          console.error('Recipe generation error:', error);
          setLoading(false);
          setRecipe('Sorry, I had trouble generating your recipe. Please try again!');
          setProgress('');
          stopPulseAnimation(); // Stop animation on error
          Alert.alert('Error', 'Failed to generate recipe. Please try again.');
        }
      );

    } catch (error) {
      console.error('Error generating recipe:', error);
      setLoading(false);
      setRecipe('Sorry, something went wrong. Please try again!');
      Alert.alert('Error', 'Failed to generate recipe. Please try again.');
    }
  };

  const shareRecipe = async () => {
    try {
      const result = await Share.share({
        message: `Check out this ${recipeStyle.title} recipe I generated with Recipe GPT!\n\n${recipe}`,
        title: `${recipeStyle.title} Recipe from Recipe GPT`,
      });
    } catch (error) {
      console.error('Error sharing recipe:', error);
    }
  };

  const regenerateRecipe = () => {
    Alert.alert(
      'Regenerate Recipe',
      'Generate a new recipe with the same ingredients and style?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Yes', onPress: () => {
          setRecipe(''); // Clear previous recipe
          setProgress('');
          generateRecipe();
        }},
      ]
    );
  };

  console.log('RecipeScreen render - loading:', loading, 'recipe length:', recipe.length);

  return (
    <ExpoLinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <ExpoLinearGradient
        colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <ExpoLinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.backButton}
          >
            <IconButton
              icon="arrow-left"
              iconColor="#fff"
              size={24}
              onPress={() => navigation.goBack()}
              style={styles.backButtonIcon}
            />
          </ExpoLinearGradient>
          
          <ExpoLinearGradient
            colors={recipeStyle?.color || ['#4ECDC4', '#44A08D']}
            style={styles.headerIcon}
          >
            <Text style={styles.headerIconText}>{recipeStyle?.icon || '🍳'}</Text>
          </ExpoLinearGradient>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>{recipeStyle?.title || 'Recipe'}</Text>
            <Text style={styles.headerSubtitle}>AI-generated recipe</Text>
          </View>
          
          {!loading && recipe && (
            <View style={styles.headerActions}>
              <ExpoLinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.actionButton}
              >
                <IconButton
                  icon="refresh"
                  iconColor="#fff"
                  size={20}
                  onPress={regenerateRecipe}
                  style={styles.actionButtonIcon}
                />
              </ExpoLinearGradient>
              
              <ExpoLinearGradient
                colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                style={styles.actionButton}
              >
                <IconButton
                  icon="share"
                  iconColor="#fff"
                  size={20}
                  onPress={shareRecipe}
                  style={styles.actionButtonIcon}
                />
              </ExpoLinearGradient>
            </View>
          )}
        </View>
      </ExpoLinearGradient>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <Animated.View 
            style={[
              styles.loadingBubble,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <ExpoLinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              style={styles.loadingBubbleGradient}
            >
              <View style={styles.loadingIconContainer}>
                <Text style={styles.loadingIcon}>{recipeStyle?.icon || '🤖'}</Text>
                <ActivityIndicator size="large" color="#4ECDC4" style={styles.loadingSpinner} />
              </View>
              <Text style={styles.loadingTitle}>
                🧠 AI Chef at Work
              </Text>
              <Text style={styles.loadingSubtext}>
                Creating your perfect {recipeStyle?.title.toLowerCase()} recipe...
              </Text>
              {progress && (
                <Text style={styles.progressText}>{progress}</Text>
              )}
            </ExpoLinearGradient>
          </Animated.View>
        </View>
      )}

      {/* Recipe Content */}
      {!loading && recipe && recipe.length > 0 && (
        <ScrollView 
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <ExpoLinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
            style={styles.recipeContainer}
          >
            <Markdown style={markdownStyles}>
              {recipe}
            </Markdown>
          </ExpoLinearGradient>

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <ExpoLinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.primaryActionButton}
            >
              <Button
                mode="text"
                onPress={() => navigation.navigate('Camera')}
                style={styles.actionButtonInner}
                labelStyle={styles.actionButtonText}
                icon="camera-plus-outline"
              >
                📸 Cook Another Recipe
              </Button>
            </ExpoLinearGradient>
            
            <View style={styles.secondaryActions}>
              <ExpoLinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={styles.secondaryActionButton}
              >
                <Button
                  mode="text"
                  onPress={regenerateRecipe}
                  style={styles.secondaryActionInner}
                  labelStyle={styles.secondaryActionText}
                  icon="refresh"
                >
                  🔄 Try Again
                </Button>
              </ExpoLinearGradient>
              
              <ExpoLinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={styles.secondaryActionButton}
              >
                <Button
                  mode="text"
                  onPress={shareRecipe}
                  style={styles.secondaryActionInner}
                  labelStyle={styles.secondaryActionText}
                  icon="share"
                >
                  📤 Share
                </Button>
              </ExpoLinearGradient>
            </View>
          </View>
        </ScrollView>
      )}

      {/* Error State - when not loading but no recipe */}
      {!loading && (!recipe || recipe.length === 0) && (
        <View style={styles.errorContainer}>
          <ExpoLinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
            style={styles.errorCard}
          >
            <Text style={styles.errorIcon}>😅</Text>
            <Text style={styles.errorTitle}>Oops! Something went wrong</Text>
            <Text style={styles.errorText}>
              We couldn't generate your recipe. Please check your internet connection and try again.
            </Text>
            <View style={styles.errorActions}>
              <ExpoLinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.errorButton}
              >
                <Button
                  mode="text"
                  onPress={() => {
                    setRecipe('');
                    setProgress('');
                    generateRecipe();
                  }}
                  style={styles.errorButtonInner}
                  labelStyle={styles.errorButtonText}
                  icon="refresh"
                >
                  🔄 Try Again
                </Button>
              </ExpoLinearGradient>
              
              <ExpoLinearGradient
                colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
                style={styles.errorButton}
              >
                <Button
                  mode="text"
                  onPress={() => navigation.goBack()}
                  style={styles.errorButtonInner}
                  labelStyle={styles.errorButtonText}
                  icon="arrow-left"
                >
                  ← Go Back
                </Button>
              </ExpoLinearGradient>
            </View>
          </ExpoLinearGradient>
        </View>
      )}
    </ExpoLinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backButtonIcon: {
    margin: 0,
  },
  headerIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  headerIconText: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '300',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionButtonIcon: {
    margin: 0,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  loadingBubble: {
    width: '100%',
  },
  loadingBubbleGradient: {
    padding: 40,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  loadingIconContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingSpinner: {
    position: 'absolute',
    bottom: -10,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
  progressText: {
    fontSize: 12,
    color: '#4ECDC4',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  recipeContainer: {
    margin: 20,
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  actionButtonsContainer: {
    paddingHorizontal: 20,
    gap: 16,
  },
  primaryActionButton: {
    borderRadius: 30,
    backgroundColor: 'rgba(78, 205, 196, 0.9)',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  actionButtonInner: {
    paddingVertical: 16,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  secondaryActions: {
    flexDirection: 'row',
    gap: 12,
  },
  secondaryActionButton: {
    flex: 1,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  secondaryActionInner: {
    paddingVertical: 12,
  },
  secondaryActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorCard: {
    width: '100%',
    borderRadius: 25,
    padding: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
    alignItems: 'center',
  },
  errorIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 10,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 25,
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  errorButton: {
    flex: 1,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  errorButtonInner: {
    paddingVertical: 12,
  },
  errorButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ECF0F1',
  },
  heading1: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4ECDC4',
    marginTop: 0,
    marginBottom: 16,
    textAlign: 'center',
  },
  heading2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4ECDC4',
    marginTop: 20,
    marginBottom: 12,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
    marginTop: 16,
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ECF0F1',
    marginBottom: 12,
  },
  list_item: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ECF0F1',
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 16,
  },
  bullet_list: {
    marginBottom: 16,
  },
  strong: {
    fontWeight: '700',
    color: '#4ECDC4',
  },
  em: {
    fontStyle: 'italic',
    color: '#BDC3C7',
  },
  code_inline: {
    backgroundColor: 'rgba(78, 205, 196, 0.3)',
    color: '#4ECDC4',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    fontSize: 14,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
    paddingLeft: 16,
    marginVertical: 12,
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    paddingVertical: 12,
    borderRadius: 8,
  },
};

export default RecipeScreen; 