import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import {Button, Card, ActivityIndicator} from 'react-native-paper';
import {launchImageLibrary, launchCamera} from 'react-native-image-picker';
import {request, PERMISSIONS, RESULTS} from 'react-native-permissions';
import AIService from '../services/AIService';

const {width} = Dimensions.get('window');

const CameraScreen = ({navigation}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const requestCameraPermission = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Permission error:', error);
      return false;
    }
  };

  const showImagePicker = () => {
    if (images.length >= 3) {
      Alert.alert('Maximum Photos Reached', 'You can analyze up to 3 photos at once. Please remove some photos or analyze the current ones.');
      return;
    }
    
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {text: 'Camera', onPress: openCamera},
        {text: 'Gallery', onPress: openGallery},
        {text: 'Cancel', style: 'cancel'},
      ],
      {cancelable: true}
    );
  };

  const openCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Camera permission is required');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [4, 3],
      allowsEditing: false,
    });

    handleImageResponse(result);
  };

  const openGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Media library permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      aspect: [4, 3],
      allowsEditing: false,
      allowsMultipleSelection: true,
      selectionLimit: 3 - images.length,
    });

    handleImageResponse(result);
  };

  const handleImageResponse = (result) => {
    if (result.canceled) {
      return;
    }

    if (result.assets && result.assets.length > 0) {
      setImages(prevImages => {
        const newImages = [...prevImages, ...result.assets];
        // Ensure we don't exceed 3 images
        return newImages.slice(0, 3);
      });
    }
  };

  const removeImage = (index) => {
    setImages(prevImages => prevImages.filter((_, i) => i !== index));
  };

  const analyzeImages = async () => {
    if (images.length === 0) {
      Alert.alert('No images', 'Please add at least one image first');
      return;
    }

    setLoading(true);
    try {
      // Extract URIs from image objects
      const imageUris = images.map(image => image.uri);
      
      // Analyze all images at once (Gemini will combine ingredients)
      const ingredients = await AIService.analyzeImages(imageUris);

      navigation.navigate('Ingredients', {ingredients});
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze images. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.title}>Take Photos of Your Fridge</Text>
          <Text style={styles.subtitle}>
            Take 1-3 photos of your fridge, pantry, or ingredients to get recipe suggestions!
          </Text>
        </Card.Content>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          mode="contained"
          onPress={showImagePicker}
          style={styles.button}
          icon="camera"
          disabled={loading || images.length >= 3}>
          {images.length >= 3 ? 'Max Photos (3)' : 'Add Photo'}
        </Button>
      </View>

      {images.length > 0 && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageTitle}>Selected Photos ({images.length})</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {images.map((image, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{uri: image.uri}} style={styles.image} />
                <Button
                  mode="outlined"
                  compact
                  onPress={() => removeImage(index)}
                  style={styles.removeButton}>
                  Remove
                </Button>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {images.length > 0 && (
        <View style={styles.analyzeContainer}>
          <Button
            mode="contained"
            onPress={analyzeImages}
            style={[styles.button, styles.analyzeButton]}
            icon="magic-staff"
            loading={loading}
            disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Ingredients'}
          </Button>
        </View>
      )}

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>
            Analyzing your {images.length} photo{images.length > 1 ? 's' : ''} with AI...
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
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
  buttonContainer: {
    padding: 16,
  },
  button: {
    paddingVertical: 8,
  },
  imageContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  imageWrapper: {
    marginRight: 12,
    alignItems: 'center',
  },
  image: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: 8,
    marginBottom: 8,
  },
  removeButton: {
    backgroundColor: '#fff',
  },
  analyzeContainer: {
    padding: 16,
  },
  analyzeButton: {
    backgroundColor: '#FF6B35',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
});

export default CameraScreen; 