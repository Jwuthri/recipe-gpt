import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  StatusBar,
  Alert,
  Animated,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {Button, Card, Chip, IconButton} from 'react-native-paper';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';

const {width, height} = Dimensions.get('window');

const RECIPE_STYLES = [
  {
    id: 'high-protein',
    title: 'High Protein',
    icon: '💪',
    description: 'Muscle-building recipes with protein focus',
    color: ['#FF6B6B', '#FF8E8E'],
    bgColor: ['rgba(255, 107, 107, 0.2)', 'rgba(255, 142, 142, 0.1)'],
  },
  {
    id: 'vegan',
    title: 'Vegan',
    icon: '🌱',
    description: 'Plant-based, no animal products',
    color: ['#4ECDC4', '#44A08D'],
    bgColor: ['rgba(78, 205, 196, 0.2)', 'rgba(68, 160, 141, 0.1)'],
  },
  {
    id: 'keto',
    title: 'Keto',
    icon: '🥓',
    description: 'Low-carb, high-fat ketogenic',
    color: ['#667eea', '#764ba2'],
    bgColor: ['rgba(102, 126, 234, 0.2)', 'rgba(118, 75, 162, 0.1)'],
  },
  {
    id: 'mediterranean',
    title: 'Mediterranean',
    icon: '🫒',
    description: 'Fresh, healthy Mediterranean style',
    color: ['#f093fb', '#f5576c'],
    bgColor: ['rgba(240, 147, 251, 0.2)', 'rgba(245, 87, 108, 0.1)'],
  },
  {
    id: 'comfort',
    title: 'Comfort Food',
    icon: '🍲',
    description: 'Hearty, satisfying comfort meals',
    color: ['#ffecd2', '#fcb69f'],
    bgColor: ['rgba(255, 236, 210, 0.3)', 'rgba(252, 182, 159, 0.1)'],
  },
  {
    id: 'quick',
    title: 'Quick & Easy',
    icon: '⚡',
    description: 'Fast recipes under 30 minutes',
    color: ['#a8edea', '#fed6e3'],
    bgColor: ['rgba(168, 237, 234, 0.3)', 'rgba(254, 214, 227, 0.1)'],
  },
];

const IngredientsScreen = ({route, navigation}) => {
  const {ingredients} = route.params;
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [editedIngredients, setEditedIngredients] = useState(ingredients);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const removeIngredient = (index) => {
    setEditedIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const generateRecipe = () => {
    if (!selectedStyle) {
      Alert.alert('Select Style', 'Please choose a recipe style first');
      return;
    }

    if (editedIngredients.length === 0) {
      Alert.alert('No Ingredients', 'Please keep at least one ingredient');
      return;
    }

    navigation.navigate('Recipe', {
      ingredients: editedIngredients,
      recipeStyle: selectedStyle,
    });
  };

  const renderStyleCard = (style, index) => {
    const isSelected = selectedStyle?.id === style.id;
    
    return (
      <Animated.View
        key={style.id}
        style={[
          styles.styleCardContainer,
          {
            transform: [
              {
                scale: scaleAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable
          onPress={() => setSelectedStyle(style)}
          style={({ pressed }) => [
            styles.styleCardPressable,
            pressed && styles.styleCardPressed,
          ]}
        >
          <ExpoLinearGradient
            colors={isSelected ? style.color : style.bgColor}
            style={[
              styles.styleCard,
              isSelected && styles.selectedStyleCard,
            ]}
          >
            <View style={styles.styleCardContent}>
              <View style={[
                styles.iconContainer,
                { backgroundColor: isSelected ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)' }
              ]}>
                                 <Text style={[
                   styles.styleIcon,
                   { fontSize: isSelected ? 30 : 28 }
                 ]}>{style.icon}</Text>
              </View>
              
              <Text style={[
                styles.styleTitle,
                { color: isSelected ? '#fff' : '#fff' }
              ]}>
                {style.title}
              </Text>
              
              <Text style={[
                styles.styleDescription,
                { color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.7)' }
              ]}>
                {style.description}
              </Text>
              
              {isSelected && (
                <Animated.View style={styles.selectedIndicator}>
                  <ExpoLinearGradient
                    colors={['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.7)']}
                    style={styles.checkmarkContainer}
                  >
                    <Text style={styles.checkmark}>✓</Text>
                  </ExpoLinearGradient>
                </Animated.View>
              )}
            </View>
          </ExpoLinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  return (
    <ExpoLinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Header */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          }
        ]}
      >
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
          style={styles.headerGradient}
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
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Your Ingredients</Text>
              <Text style={styles.headerSubtitle}>Choose your cooking style</Text>
            </View>
            <View style={styles.headerDecoration}>
              <ExpoLinearGradient
                colors={['#FF6B6B', '#4ECDC4']}
                style={styles.decorationCircle}
              >
                <Text style={styles.decorationIcon}>🍳</Text>
              </ExpoLinearGradient>
            </View>
          </View>
        </ExpoLinearGradient>
      </Animated.View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Ingredients Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <ExpoLinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
            style={styles.ingredientsSection}
          >
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <ExpoLinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  style={styles.sectionIconBg}
                >
                  <Text style={styles.sectionIcon}>🥬</Text>
                </ExpoLinearGradient>
                <Text style={styles.sectionTitle}>Detected Ingredients</Text>
              </View>
              <View style={styles.ingredientCounter}>
                <Text style={styles.counterText}>{editedIngredients.length}</Text>
              </View>
            </View>
            
            <View style={styles.ingredientsList}>
              {editedIngredients.map((ingredient, index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.ingredientItem,
                    {
                      opacity: fadeAnim,
                      transform: [
                        {
                          translateX: slideAnim.interpolate({
                            inputRange: [0, 50],
                            outputRange: [0, -20],
                          }),
                        },
                      ],
                    }
                  ]}
                >
                  <ExpoLinearGradient
                    colors={['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.06)']}
                    style={styles.ingredientCard}
                  >
                    <View style={styles.ingredientContent}>
                      <View style={styles.ingredientInfo}>
                        <Text style={styles.ingredientName}>{ingredient.name}</Text>
                        <Text style={styles.ingredientQuantity}>
                          {ingredient.quantity} {ingredient.unit}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => removeIngredient(index)}
                        style={styles.removeButtonContainer}
                      >
                        <ExpoLinearGradient
                          colors={['#FF6B6B', '#FF8E8E']}
                          style={styles.removeButton}
                        >
                          <Text style={styles.removeButtonText}>×</Text>
                        </ExpoLinearGradient>
                      </TouchableOpacity>
                    </View>
                  </ExpoLinearGradient>
                </Animated.View>
              ))}
            </View>
          </ExpoLinearGradient>
        </Animated.View>

        {/* Recipe Style Section */}
        <Animated.View
          style={[
            styles.section,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          <View style={styles.stylesSectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <ExpoLinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.sectionIconBg}
              >
                <Text style={styles.sectionIcon}>🍳</Text>
              </ExpoLinearGradient>
              <Text style={styles.sectionTitle}>Choose Recipe Style</Text>
            </View>
            {selectedStyle && (
              <Animated.View style={styles.selectedStyleIndicator}>
                <ExpoLinearGradient
                  colors={selectedStyle.color}
                  style={styles.selectedChip}
                >
                  <Text style={styles.selectedChipIcon}>{selectedStyle.icon}</Text>
                  <Text style={styles.selectedChipText}>{selectedStyle.title}</Text>
                </ExpoLinearGradient>
              </Animated.View>
            )}
          </View>
          
          <View style={styles.stylesGrid}>
            {RECIPE_STYLES.map(renderStyleCard)}
          </View>
        </Animated.View>

        {/* Generate Button */}
        {selectedStyle && (
          <Animated.View
            style={[
              styles.generateContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              }
            ]}
          >
            <ExpoLinearGradient
              colors={selectedStyle.color}
              style={styles.generateButton}
            >
              <TouchableOpacity
                onPress={generateRecipe}
                style={styles.generateButtonTouch}
              >
                <View style={styles.generateButtonContent}>
                  <ExpoLinearGradient
                    colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
                    style={styles.generateIconBg}
                  >
                    <Text style={styles.generateIcon}>✨</Text>
                  </ExpoLinearGradient>
                  <Text style={styles.generateButtonText}>
                    Generate {selectedStyle.title} Recipe
                  </Text>
                </View>
              </TouchableOpacity>
            </ExpoLinearGradient>
          </Animated.View>
        )}
      </ScrollView>
    </ExpoLinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 0,
  },
  headerGradient: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  backButtonIcon: {
    margin: 0,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
  headerDecoration: {
    marginLeft: 16,
  },
  decorationCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  decorationIcon: {
    fontSize: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  ingredientsSection: {
    borderRadius: 30,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionIcon: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  ingredientCounter: {
    backgroundColor: 'rgba(78, 205, 196, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  counterText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  ingredientsList: {
    gap: 16,
  },
  ingredientItem: {
    // Removed individual styling, handled by animation
  },
  ingredientCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  ingredientContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 6,
  },
  ingredientQuantity: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  removeButtonContainer: {
    marginLeft: 16,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  removeButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  stylesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  selectedStyleIndicator: {
    // Animation container
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedChipIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  selectedChipText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  stylesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  styleCardContainer: {
    width: (width - 56) / 2, // Accounting for margins and gap
  },
  styleCardPressable: {
    width: '100%',
  },
  styleCardPressed: {
    transform: [{ scale: 0.96 }],
  },
  styleCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  selectedStyleCard: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  styleCardContent: {
    padding: 20,
    alignItems: 'center',
    height: 160,
    justifyContent: 'space-between',
    position: 'relative',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  styleIcon: {
    fontSize: 28,
  },
  styleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 6,
    textAlign: 'center',
    lineHeight: 20,
  },
  styleDescription: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
    flex: 1,
  },
  selectedIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1a2e',
  },
  generateContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  generateButton: {
    borderRadius: 30,
    backgroundColor: 'rgba(78, 205, 196, 0.9)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 12,
  },
  generateButtonTouch: {
    width: '100%',
  },
  generateButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  generateIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  generateIcon: {
    fontSize: 20,
  },
  generateButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
});

export default IngredientsScreen; 