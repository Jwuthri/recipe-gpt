import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {Provider as PaperProvider} from 'react-native-paper';
import {StatusBar} from 'react-native';

import CameraScreen from './src/screens/CameraScreen';
import IngredientsScreen from './src/screens/IngredientsScreen';
import AddIngredientsScreen from './src/screens/AddIngredientsScreen';
import RecipeScreen from './src/screens/RecipeScreen';
import ChatScreen from './src/screens/ChatScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <PaperProvider>
      <NavigationContainer>
        <StatusBar barStyle="dark-content" backgroundColor="#fff" />
        <Stack.Navigator
          initialRouteName="Camera"
          screenOptions={{
            headerShown: false,
          }}>
          <Stack.Screen
            name="Camera"
            component={CameraScreen}
            options={{title: 'Recipe GPT'}}
          />
          <Stack.Screen
            name="Ingredients"
            component={IngredientsScreen}
            options={{title: 'Detected Ingredients'}}
          />
          <Stack.Screen
            name="AddIngredients"
            component={AddIngredientsScreen}
            options={{title: 'Add More Ingredients'}}
          />
          <Stack.Screen
            name="Recipe"
            component={RecipeScreen}
            options={{title: 'Your Recipe'}}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{title: 'Recipe Assistant'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </PaperProvider>
  );
};

export default App; 