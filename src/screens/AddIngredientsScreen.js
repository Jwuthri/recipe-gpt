import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Button,
  Card,
  TextInput,
  IconButton,
  Chip,
  HelperText,
} from 'react-native-paper';

const AddIngredientsScreen = ({route, navigation}) => {
  const {ingredients: existingIngredients} = route.params;
  const [ingredients, setIngredients] = useState(existingIngredients);
  const [newIngredient, setNewIngredient] = useState({
    name: '',
    quantity: '',
    unit: '',
  });

  const commonUnits = ['g', 'kg', 'ml', 'l', 'cups', 'tbsp', 'tsp', 'pieces', 'cloves'];

  const addIngredient = () => {
    if (!newIngredient.name.trim()) {
      Alert.alert('Error', 'Please enter an ingredient name');
      return;
    }

    if (!newIngredient.quantity.trim()) {
      Alert.alert('Error', 'Please enter a quantity');
      return;
    }

    if (!newIngredient.unit.trim()) {
      Alert.alert('Error', 'Please select or enter a unit');
      return;
    }

    // Check for duplicates
    const duplicate = ingredients.find(
      ing => ing.name.toLowerCase() === newIngredient.name.toLowerCase()
    );

    if (duplicate) {
      Alert.alert(
        'Duplicate Ingredient',
        `${newIngredient.name} is already in your list. Do you want to update the quantity?`,
        [
          {text: 'Cancel', style: 'cancel'},
          {
            text: 'Update',
            onPress: () => {
              const updatedIngredients = ingredients.map(ing =>
                ing.name.toLowerCase() === newIngredient.name.toLowerCase()
                  ? {...ing, quantity: newIngredient.quantity, unit: newIngredient.unit}
                  : ing
              );
              setIngredients(updatedIngredients);
              setNewIngredient({name: '', quantity: '', unit: ''});
            },
          },
        ]
      );
      return;
    }

    setIngredients([...ingredients, {...newIngredient}]);
    setNewIngredient({name: '', quantity: '', unit: ''});
  };

  const removeIngredient = (index) => {
    Alert.alert(
      'Remove Ingredient',
      'Are you sure you want to remove this ingredient?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setIngredients(ingredients.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const selectUnit = (unit) => {
    setNewIngredient({...newIngredient, unit});
  };

  const generateRecipe = () => {
    if (ingredients.length === 0) {
      Alert.alert('No ingredients', 'Please add at least one ingredient');
      return;
    }
    navigation.navigate('Recipe', {ingredients});
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.headerCard}>
        <Card.Content>
          <Text style={styles.title}>Add More Ingredients</Text>
          <Text style={styles.subtitle}>
            Add any additional ingredients you have that weren't detected in the photos.
          </Text>
        </Card.Content>
      </Card>

      <Card style={styles.addCard}>
        <Card.Content>
          <Text style={styles.sectionTitle}>Add New Ingredient</Text>
          
          <TextInput
            label="Ingredient Name"
            value={newIngredient.name}
            onChangeText={(text) => setNewIngredient({...newIngredient, name: text})}
            style={styles.input}
            mode="outlined"
            placeholder="e.g., Tomatoes, Chicken breast, Olive oil"
          />

          <View style={styles.quantityRow}>
            <TextInput
              label="Quantity"
              value={newIngredient.quantity}
              onChangeText={(text) => setNewIngredient({...newIngredient, quantity: text})}
              style={[styles.input, styles.quantityInput]}
              mode="outlined"
              keyboardType="numeric"
              placeholder="e.g., 2, 500, 1.5"
            />
            <TextInput
              label="Unit"
              value={newIngredient.unit}
              onChangeText={(text) => setNewIngredient({...newIngredient, unit: text})}
              style={[styles.input, styles.unitInput]}
              mode="outlined"
              placeholder="e.g., g, cups, pieces"
            />
          </View>

          <Text style={styles.unitsLabel}>Common Units:</Text>
          <View style={styles.unitsContainer}>
            {commonUnits.map((unit) => (
              <Chip
                key={unit}
                selected={newIngredient.unit === unit}
                onPress={() => selectUnit(unit)}
                style={styles.unitChip}>
                {unit}
              </Chip>
            ))}
          </View>

          <Button
            mode="contained"
            onPress={addIngredient}
            style={styles.addButton}
            icon="plus">
            Add Ingredient
          </Button>
        </Card.Content>
      </Card>

      {ingredients.length > 0 && (
        <Card style={styles.listCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>
              Your Ingredients ({ingredients.length})
            </Text>
            
            {ingredients.map((ingredient, index) => (
              <View key={index} style={styles.ingredientItem}>
                <View style={styles.ingredientInfo}>
                  <Text style={styles.ingredientName}>{ingredient.name}</Text>
                  <Text style={styles.ingredientQuantity}>
                    {ingredient.quantity} {ingredient.unit}
                  </Text>
                </View>
                <IconButton
                  icon="delete"
                  onPress={() => removeIngredient(index)}
                  size={20}
                  iconColor="#f44336"
                />
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      <View style={styles.buttonContainer}>
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
          icon="arrow-left">
          Back to Detected
        </Button>
        
        <Button
          mode="contained"
          onPress={generateRecipe}
          style={[styles.button, styles.generateButton]}
          icon="chef-hat"
          disabled={ingredients.length === 0}>
          Generate Recipe
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  addCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  listCard: {
    margin: 16,
    marginBottom: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  input: {
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  quantityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quantityInput: {
    flex: 1,
  },
  unitInput: {
    flex: 1,
  },
  unitsLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: '#666',
  },
  unitsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  unitChip: {
    marginRight: 4,
    marginBottom: 4,
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
  },
  ingredientItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  ingredientQuantity: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 8,
  },
  generateButton: {
    backgroundColor: '#FF6B35',
  },
});

export default AddIngredientsScreen; 