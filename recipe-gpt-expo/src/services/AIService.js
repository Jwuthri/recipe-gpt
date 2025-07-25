/**
 * AI Service - Proxy to Backend Service
 * All LLM functionality is handled by the FastAPI backend
 */

import BackendService from './BackendService';

class AIService {
  // Image analysis
  async analyzeImages(imageUris, onProgress = null) {
    // Validate input
    if (!Array.isArray(imageUris)) {
      imageUris = [imageUris];
    }
    
    if (imageUris.length === 0) {
      throw new Error('No images provided');
    }
    
    if (imageUris.length > 3) {
      throw new Error('Maximum 3 images allowed');
    }
    
    return await BackendService.analyzeImages(imageUris, onProgress);
  }

  // Backward compatibility method for single image
  async analyzeImage(imageUri) {
    return this.analyzeImages([imageUri]);
  }

  // Recipe generation
  async generateRecipeStream(ingredients, onChunk, onComplete, onError) {
    return await BackendService.generateRecipeStream(ingredients, onChunk, onComplete, onError);
  }

  async generateRecipe(ingredients) {
    return await BackendService.generateRecipe(ingredients);
  }

  // Chat functionality
  async generateChatResponse(prompt, onChunk, onComplete, onError) {
    return await BackendService.generateChatResponse(prompt, onChunk, onComplete, onError);
  }
}

export default new AIService(); 