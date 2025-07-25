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
  FAB,
} from 'react-native-paper';

const IngredientsScreen = ({route, navigation}) => {
  const {ingredients: initialIngredients} = route.params;
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editValues, setEditValues] = useState({});

  const updateIngredient = (index, field, value) => {
    setEditValues({
      ...editValues,
      [`${index}_${field}`]: value,
    });
  };

  const saveEdit = (index) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = {
      ...newIngredients[index],
      name: editValues[`${index}_name`] || newIngredients[index].name,
      quantity: editValues[`${index}_quantity`] || newIngredients[index].quantity,
      unit: editValues[`${index}_unit`] || newIngredients[index].unit,
    };
    setIngredients(newIngredients);
    setEditingIndex(-1);
    setEditValues({});
  };

  const cancelEdit = () => {
    setEditingIndex(-1);
    setEditValues({});
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

  const proceedToAddMore = () => {
    navigation.navigate('AddIngredients', {ingredients});
  };

  const generateRecipe = () => {
    if (ingredients.length === 0) {
      Alert.alert('No ingredients', 'Please add at least one ingredient');
      return;
    }
    navigation.navigate('Recipe', {ingredients});
  };

  const renderIngredient = (ingredient, index) => {
    const isEditing = editingIndex === index;

    return (
      <Card key={index} style={styles.ingredientCard}>
        <Card.Content>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                label="Ingredient Name"
                value={editValues[`${index}_name`] || ingredient.name}
                onChangeText={(text) => updateIngredient(index, 'name', text)}
                style={styles.editInput}
                mode="outlined"
              />
              <View style={styles.quantityRow}>
                <TextInput
                  label="Quantity"
                  value={editValues[`${index}_quantity`] || ingredient.quantity}
                  onChangeText={(text) => updateIngredient(index, 'quantity', text)}
                  style={[styles.editInput, styles.quantityInput]}
                  mode="outlined"
                  keyboardType="numeric"
                />
                <TextInput
                  label="Unit"
                  value={editValues[`${index}_unit`] || ingredient.unit}
                  onChangeText={(text) => updateIngredient(index, 'unit', text)}
                  style={[styles.editInput, styles.unitInput]}
                  mode="outlined"
                />
              </View>
              <View style={styles.editActions}>
                <Button mode="outlined" onPress={cancelEdit} style={styles.actionButton}>
                  Cancel
                </Button>
                <Button mode="contained" onPress={() => saveEdit(index)} style={styles.actionButton}>
                  Save
                </Button>
              </View>
            </View>
          ) : (
            <View style={styles.ingredientContent}>
              <View style={styles.ingredientInfo}>
                <Text style={styles.ingredientName}>{ingredient.name}</Text>
                <View style={styles.quantityContainer}>
                  <Chip icon="scale" style={styles.quantityChip}>
                    {ingredient.quantity} {ingredient.unit}
                  </Chip>
                </View>
              </View>
              <View style={styles.actions}>
                <IconButton
                  icon="pencil"
                  onPress={() => setEditingIndex(index)}
                  size={20}
                />
                <IconButton
                  icon="delete"
                  onPress={() => removeIngredient(index)}
                  size={20}
                  iconColor="#f44336"
                />
              </View>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollContainer}>
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text style={styles.title}>Detected Ingredients</Text>
            <Text style={styles.subtitle}>
              Review and edit the ingredients we found. Tap the pencil icon to edit any item.
            </Text>
          </Card.Content>
        </Card>

        {ingredients.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text style={styles.emptyText}>No ingredients detected.</Text>
              <Text style={styles.emptySubtext}>
                Try taking another photo or add ingredients manually.
              </Text>
            </Card.Content>
          </Card>
        ) : (
          ingredients.map((ingredient, index) => renderIngredient(ingredient, index))
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={proceedToAddMore}
            style={styles.button}
            icon="plus">
            Add More Ingredients
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

      <FAB
        icon="camera"
        style={styles.fab}
        onPress={() => navigation.goBack()}
        label="Take More Photos"
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
  ingredientCard: {
    margin: 8,
    marginHorizontal: 16,
    elevation: 2,
  },
  ingredientContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ingredientInfo: {
    flex: 1,
  },
  ingredientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
  },
  quantityChip: {
    backgroundColor: '#E8F5E8',
  },
  actions: {
    flexDirection: 'row',
  },
  editContainer: {
    gap: 12,
  },
  editInput: {
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
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    minWidth: 80,
  },
  emptyCard: {
    margin: 16,
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#666',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    color: '#999',
    marginTop: 4,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
    paddingBottom: 80, // Space for FAB
  },
  button: {
    paddingVertical: 8,
  },
  generateButton: {
    backgroundColor: '#FF6B35',
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: '#4CAF50',
  },
});

export default IngredientsScreen; 