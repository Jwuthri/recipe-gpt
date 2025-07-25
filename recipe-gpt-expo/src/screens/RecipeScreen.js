import React, {useState, useEffect} from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import {
  Button,
  Card,
  ActivityIndicator,
  Text,
  FAB,
} from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import AIService from '../services/AIService';

const RecipeScreen = ({route, navigation}) => {
  const {ingredients} = route.params;
  const [recipe, setRecipe] = useState('');
  const [loading, setLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);

  useEffect(() => {
    generateRecipe();
  }, []);

  const generateRecipe = async () => {
    setLoading(true);
    setIsStreaming(false);
    setRecipe(''); // Clear previous recipe
    
    try {
      await AIService.generateRecipeStream(
        ingredients,
        // onChunk - called for each piece of content
        (chunk, fullContent) => {
          setRecipe(fullContent);
          // Hide loading spinner and show streaming once we start getting content
          if (loading) {
            setLoading(false);
            setIsStreaming(true);
          }
        },
        // onComplete - called when streaming is done
        (finalContent) => {
          setRecipe(finalContent);
          setLoading(false);
          setIsStreaming(false);
          console.log('Recipe generation complete');
        },
        // onError - called if streaming fails
        (error) => {
          console.error('Recipe generation error:', error);
          setLoading(false);
          setIsStreaming(false);
          Alert.alert(
            'Error',
            'Failed to generate recipe. Please check your internet connection and try again.',
            [
              {text: 'Retry', onPress: generateRecipe},
              {text: 'Go Back', onPress: () => navigation.goBack()},
            ]
          );
        }
      );
    } catch (error) {
      console.error('Recipe generation error:', error);
      setLoading(false);
      setIsStreaming(false);
      Alert.alert(
        'Error',
        'Failed to generate recipe. Please check your internet connection and try again.',
        [
          {text: 'Retry', onPress: generateRecipe},
          {text: 'Go Back', onPress: () => navigation.goBack()},
        ]
      );
    }
  };

  const shareRecipe = async () => {
    try {
      const ingredientsList = ingredients
        .map(ing => `• ${ing.quantity} ${ing.unit} ${ing.name}`)
        .join('\n');

      const shareContent = `🍳 Recipe GPT Generated Recipe\n\nIngredients Used:\n${ingredientsList}\n\n${recipe}`;

      await Share.share({
        message: shareContent,
        title: 'Recipe from Recipe GPT',
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const startOver = () => {
    Alert.alert(
      'Start Over',
      'This will take you back to the camera to start a new recipe. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Start Over',
          onPress: () => navigation.navigate('Camera'),
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingTitle}>Starting Recipe Generation</Text>
        <Text style={styles.loadingSubtitle}>
          Connecting to AI chef to create your delicious recipe...
        </Text>
        <Card style={styles.ingredientsCard}>
          <Card.Content>
            <Text style={styles.ingredientsTitle}>Using These Ingredients:</Text>
            {ingredients.map((ingredient, index) => (
              <Text key={index} style={styles.ingredientItem}>
                • {ingredient.quantity} {ingredient.unit} {ingredient.name}
              </Text>
            ))}
          </Card.Content>
        </Card>
      </View>
    );
  }

  const markdownStyles = {
    body: {
      fontSize: 16,
      lineHeight: 24,
      color: '#333',
    },
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FF6B35',
      marginBottom: 12,
      marginTop: 16,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#4CAF50',
      marginBottom: 10,
      marginTop: 16,
    },
    heading3: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333',
      marginBottom: 8,
      marginTop: 12,
    },
    paragraph: {
      marginBottom: 12,
      lineHeight: 22,
    },
    list_item: {
      marginBottom: 6,
    },
    bullet_list: {
      marginBottom: 12,
    },
    ordered_list: {
      marginBottom: 12,
    },
    code_inline: {
      backgroundColor: '#f0f0f0',
      padding: 4,
      borderRadius: 4,
      fontFamily: 'monospace',
    },
    code_block: {
      backgroundColor: '#f5f5f5',
      padding: 12,
      borderRadius: 8,
      marginBottom: 12,
      fontFamily: 'monospace',
    },
    blockquote: {
      backgroundColor: '#f9f9f9',
      borderLeftWidth: 4,
      borderLeftColor: '#4CAF50',
      paddingLeft: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.recipeCard}>
          <Card.Content>
            <Markdown style={markdownStyles}>
              {recipe || 'No recipe generated'}
            </Markdown>
            {isStreaming && (
              <View style={styles.streamingIndicator}>
                <ActivityIndicator size="small" color="#FF6B35" />
                <Text style={styles.streamingText}>Generating recipe...</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={generateRecipe}
            style={styles.button}
            icon="refresh"
            loading={loading}
            disabled={loading || isStreaming}>
            {isStreaming ? 'Generating...' : 'Generate New Recipe'}
          </Button>
          
          <Button
            mode="contained"
            onPress={shareRecipe}
            style={[styles.button, styles.shareButton]}
            icon="share">
            Share Recipe
          </Button>

          <Button
            mode="text"
            onPress={startOver}
            style={styles.button}
            icon="camera">
            Start Over
          </Button>
        </View>
      </ScrollView>

      <FAB
        icon="share"
        style={styles.fab}
        onPress={shareRecipe}
        label="Share"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
    color: '#333',
  },
  loadingSubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  ingredientsCard: {
    marginTop: 24,
    width: '100%',
    elevation: 2,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  ingredientItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recipeCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 4,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 80, // Space for FAB
  },
  button: {
    paddingVertical: 8,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  streamingText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
});

export default RecipeScreen; 