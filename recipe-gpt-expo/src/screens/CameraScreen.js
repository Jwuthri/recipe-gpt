import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Image,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import {Button, Card, ActivityIndicator, IconButton} from 'react-native-paper';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import AIService from '../services/AIService';

const {width} = Dimensions.get('window');

const CameraScreen = ({navigation}) => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    try {
      // Request camera permissions
      const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
      const mediaLibraryResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      return cameraResult.status === 'granted' && mediaLibraryResult.status === 'granted';
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
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Camera permission is required');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      handleImageResponse(result);
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission denied', 'Media library permission is required');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        allowsMultipleSelection: false, // Expo Go limitation
      });

      handleImageResponse(result);
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  const handleImageResponse = (result) => {
    if (result.canceled || !result.assets) {
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

  const [analysisProgress, setAnalysisProgress] = useState('');

  const analyzeImages = async () => {
    if (images.length === 0) {
      Alert.alert('No images', 'Please add at least one image first');
      return;
    }

    setLoading(true);
    setAnalysisProgress('');
    try {
      // Extract URIs from image objects
      const imageUris = images.map(image => image.uri);
      
      // Analyze all images at once (Gemini will combine ingredients) with progress
      const ingredients = await AIService.analyzeImages(imageUris, (progress) => {
        setAnalysisProgress(progress);
      });

      navigation.navigate('Ingredients', {ingredients});
    } catch (error) {
      Alert.alert('Error', 'Failed to analyze images. Please try again.');
      console.error('Analysis error:', error);
    } finally {
      setLoading(false);
      setAnalysisProgress('');
    }
  };

  return (
    <ExpoLinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <ExpoLinearGradient
            colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
            style={styles.glassCard}
          >
            <View style={styles.iconContainer}>
              <ExpoLinearGradient
                colors={['#FF6B6B', '#4ECDC4']}
                style={styles.iconGradient}
              >
                <Text style={styles.heroIcon}>🍳</Text>
              </ExpoLinearGradient>
            </View>
            <Text style={styles.heroTitle}>Recipe GPT</Text>
            <Text style={styles.heroSubtitle}>
              Transform your ingredients into culinary masterpieces
            </Text>
          </ExpoLinearGradient>
        </View>

        {/* Instructions Card */}
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.instructionsCard}
        >
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>1</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Capture Your Ingredients</Text>
              <Text style={styles.instructionDesc}>Take photos of your fridge or pantry</Text>
            </View>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>2</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>AI Analysis</Text>
              <Text style={styles.instructionDesc}>Smart recognition of all ingredients</Text>
            </View>
          </View>
          <View style={styles.instructionItem}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepText}>3</Text>
            </View>
            <View style={styles.instructionContent}>
              <Text style={styles.instructionTitle}>Personalized Recipes</Text>
              <Text style={styles.instructionDesc}>Get custom recipes & cooking assistance</Text>
            </View>
          </View>
        </ExpoLinearGradient>

        {/* Camera Button */}
        <View style={styles.buttonContainer}>
          <ExpoLinearGradient
            colors={images.length >= 3 ? ['#555', '#333'] : ['#FF6B6B', '#FF8E8E']}
            style={styles.modernButton}
          >
            <Button
              mode="text"
              onPress={showImagePicker}
              style={styles.cameraButton}
              labelStyle={styles.cameraButtonText}
              icon="camera-plus-outline"
              disabled={loading || images.length >= 3}
            >
              {images.length >= 3 ? 'Maximum Reached' : '📸 Add Photo'}
            </Button>
          </ExpoLinearGradient>
        </View>

        {/* Selected Images */}
        {images.length > 0 && (
          <ExpoLinearGradient
            colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.03)']}
            style={styles.imageSection}
          >
            <View style={styles.imageSectionHeader}>
              <Text style={styles.imageTitle}>
                📷 Selected Photos
              </Text>
              <View style={styles.photoCounter}>
                <Text style={styles.photoCounterText}>{images.length}/3</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
              {images.map((image, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <ExpoLinearGradient
                    colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
                    style={styles.imageFrame}
                  >
                    <Image source={{uri: image.uri}} style={styles.image} />
                    <ExpoLinearGradient
                      colors={['#FF6B6B', '#FF8E8E']}
                      style={styles.removeButton}
                    >
                      <IconButton
                        icon="close"
                        iconColor="#fff"
                        size={16}
                        onPress={() => removeImage(index)}
                        style={styles.removeIcon}
                      />
                    </ExpoLinearGradient>
                  </ExpoLinearGradient>
                </View>
              ))}
            </ScrollView>
          </ExpoLinearGradient>
        )}

        {/* Analyze Button */}
        {images.length > 0 && (
          <View style={styles.analyzeContainer}>
            <ExpoLinearGradient
              colors={loading ? ['#555', '#333'] : ['#4ECDC4', '#44A08D']}
              style={styles.modernButton}
            >
              <Button
                mode="text"
                onPress={analyzeImages}
                style={styles.analyzeButton}
                labelStyle={styles.analyzeButtonText}
                icon="creation"
                loading={loading}
                disabled={loading}
              >
                {loading ? 'Analyzing Magic...' : '✨ Analyze & Cook'}
              </Button>
            </ExpoLinearGradient>
          </View>
        )}

        {/* Loading Animation */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ExpoLinearGradient
              colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.08)']}
              style={styles.loadingCard}
            >
              <View style={styles.loadingIconContainer}>
                <ActivityIndicator size="large" color="#4ECDC4" />
              </View>
              <Text style={styles.loadingTitle}>
                🧠 AI Chef at Work
              </Text>
              <Text style={styles.loadingText}>
                {analysisProgress || 'Analyzing ingredients and crafting your perfect recipe...'}
              </Text>
            </ExpoLinearGradient>
          </View>
        )}
      </ScrollView>
    </ExpoLinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  glassCard: {
    padding: 30,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(10px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  heroIcon: {
    fontSize: 40,
  },
  heroTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 1,
  },
  heroSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '300',
  },
  instructionsCard: {
    marginHorizontal: 20,
    marginBottom: 30,
    marginTop: 20,
    borderRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    borderWidth: 2,
    borderColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  instructionContent: {
    flex: 1,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  instructionDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  modernButton: {
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  cameraButton: {
    paddingVertical: 16,
  },
  cameraButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  imageSection: {
    marginHorizontal: 20,
    marginBottom: 25,
    borderRadius: 25,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  imageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  photoCounter: {
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  photoCounterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  imageScroll: {
    marginHorizontal: -5,
  },
  imageWrapper: {
    marginHorizontal: 5,
  },
  imageFrame: {
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    position: 'relative',
  },
  image: {
    width: width * 0.35,
    height: width * 0.35,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  removeIcon: {
    margin: 0,
  },
  analyzeContainer: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  analyzeButton: {
    paddingVertical: 16,
  },
  analyzeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
  },
  loadingCard: {
    padding: 40,
    borderRadius: 25,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    width: '100%',
  },
  loadingIconContainer: {
    marginBottom: 20,
  },
  loadingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default CameraScreen; 