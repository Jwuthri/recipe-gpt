import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';

const BACKEND_URL = __DEV__ ? 'http://localhost:8000' : 'https://your-production-url.com';

class BackendService {
  constructor() {
    this.currentUser = null;
    this.currentSession = null;
    this.baseURL = BACKEND_URL;
  }

  async initializeUser() {
    try {
      // Get or create device ID
      let deviceId = await AsyncStorage.getItem('deviceId');
      if (!deviceId) {
        deviceId = Device.deviceName || 'unknown_device' + '_' + Date.now();
        await AsyncStorage.setItem('deviceId', deviceId);
      }

      // Get or create user
      const response = await fetch(`${this.baseURL}/users/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          device_id: deviceId,
          username: Device.deviceName,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.currentUser = await response.json();
      await AsyncStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      
      return this.currentUser;
    } catch (error) {
      console.error('Error initializing user:', error);
      throw error;
    }
  }

  async createSession(ingredients = null) {
    try {
      if (!this.currentUser) {
        await this.initializeUser();
      }

      const response = await fetch(`${this.baseURL}/sessions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: this.currentUser.id,
          title: ingredients ? 'Recipe Session' : 'Chat Session',
          ingredients: ingredients,
          session_type: ingredients ? 'recipe_generation' : 'chat',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this.currentSession = await response.json();
      return this.currentSession;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getUserSessions() {
    try {
      if (!this.currentUser) {
        await this.initializeUser();
      }

      const response = await fetch(`${this.baseURL}/users/${this.currentUser.id}/sessions`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting user sessions:', error);
      throw error;
    }
  }

  async getSessionMessages(sessionId) {
    try {
      const response = await fetch(`${this.baseURL}/sessions/${sessionId}/messages`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting session messages:', error);
      throw error;
    }
  }

  async analyzeImages(imageUris, onProgress = null) {
    try {
      if (!this.currentUser) {
        await this.initializeUser();
      }

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('user_id', this.currentUser.id.toString());

      for (let i = 0; i < imageUris.length; i++) {
        const uri = imageUris[i];

        // Get file extension and determine file name
        const extension = uri.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `image_${i}.${extension}`;
        
        // Create proper file object for React Native
        const fileData = {
          uri: uri,
          type: this._detectMimeType(extension),
          name: fileName,
        };
        
        formData.append('files', fileData);
      }

      // Use streaming endpoint for real-time progress
      const response = await fetch(`${this.baseURL}/analyze-images/stream`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'text/event-stream',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend error: ${response.status} - ${errorText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let ingredients = null;

      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                // Send progress updates
                if (data.progress && onProgress) {
                  onProgress(data.progress);
                }
                
                // Handle completion
                if (data.done && data.ingredients) {
                  ingredients = data.ingredients;
                }
                
                // Handle errors
                if (data.error) {
                  throw new Error(data.error);
                }
              } catch (parseError) {
                console.warn('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }

      if (!ingredients) {
        throw new Error('No ingredients received from analysis');
      }

      return ingredients;
    } catch (error) {
      console.error('Error analyzing images:', error);
      throw error;
    }
  }

  async sendChatMessage(message, context = null, ingredients = null, onChunk = null, onComplete = null, onError = null) {
    try {
      if (!this.currentSession) {
        await this.createSession(ingredients);
      }

      const requestBody = {
        session_id: this.currentSession.id,
        message: message,
        context: context,
        ingredients: ingredients,
      };

      if (onChunk) {
        // Use streaming endpoint for real-time responses
        const response = await fetch(`${this.baseURL}/chat/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullResponse = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  if (data.chunk) {
                    fullResponse += data.chunk;
                    if (onChunk) {
                      onChunk(data.chunk, fullResponse);
                    }
                  }
                  
                  if (data.done && onComplete) {
                    onComplete(fullResponse);
                  }
                } catch (parseError) {
                  console.warn('Error parsing SSE data:', parseError);
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
      } else {
        // Use non-streaming endpoint
        const response = await fetch(`${this.baseURL}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Backend error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        
        if (onComplete) {
          onComplete(result.response);
        }
        
        return result.response;
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      if (onError) {
        onError(error);
      }
      throw error;
    }
  }

  // Recipe generation methods
  async generateRecipeStream(ingredients, onChunk, onComplete, onError) {
    const ingredientList = ingredients
      .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`)
      .join('\n- ');

    const prompt = `Create a delicious recipe using these ingredients:\n\n- ${ingredientList}`;

    return this.sendChatMessage(prompt, null, ingredients, onChunk, onComplete, onError);
  }

  async generateRecipe(ingredients) {
    return new Promise((resolve, reject) => {
      let fullContent = '';
      
      this.generateRecipeStream(
        ingredients,
        (chunk, content) => {
          fullContent = content;
        },
        (finalContent) => {
          resolve(finalContent);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  // Chat methods
  async generateChatResponse(prompt, onChunk, onComplete, onError) {
    return this.sendChatMessage(prompt, null, null, onChunk, onComplete, onError);
  }

  _detectMimeType(extension) {
    /**
     * Helper method to detect MIME type from file extension
     */
    const mimeMap = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'heic': 'image/heic',
      'heif': 'image/heif',
      'bmp': 'image/bmp',
      'tiff': 'image/tiff',
      'tif': 'image/tiff'
    };
    
    return mimeMap[extension.toLowerCase()] || 'image/jpeg';
  }
}

export default new BackendService(); 