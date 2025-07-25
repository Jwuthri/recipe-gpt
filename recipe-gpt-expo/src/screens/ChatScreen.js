import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  LinearGradient,
} from 'react-native';
import {
  TextInput,
  Button,
  Card,
  ActivityIndicator,
  IconButton,
  Avatar,
} from 'react-native-paper';
import Markdown from 'react-native-markdown-display';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import AIService from '../services/AIService';

const ChatScreen = ({route, navigation}) => {
  const {ingredients} = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasGeneratedInitial, setHasGeneratedInitial] = useState(false);
  const flatListRef = useRef(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Initial message with ingredients and automatic recipe suggestion  
    const ingredientList = ingredients
      .map(ing => `- ${ing.quantity} ${ing.unit} ${ing.name}`)
      .join('\n');
    
    const initialMessage = {
      id: '1',
      text: `I found these ingredients:\n\n${ingredientList}\n\nLet me suggest a quick recipe for you! 👨‍🍳`,
      isAI: true,
      timestamp: new Date().toISOString(),
    };
    
    setMessages([initialMessage]);
    
    // Auto-generate initial recipe suggestion
    if (!hasGeneratedInitial) {
      setTimeout(() => {
        generateInitialRecipe();
      }, 1500); // Small delay for better UX
    }
  }, [ingredients, hasGeneratedInitial]);

  const generateInitialRecipe = async () => {
    if (hasGeneratedInitial) return;
    setHasGeneratedInitial(true);
    
    const ingredientList = ingredients
      .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`)
      .join(', ');
    
          const prompt = `You are a helpful cooking assistant. The user has these ingredients: ${ingredientList}

Create a detailed recipe using these ingredients. Format your response EXACTLY as follows using proper markdown:

# 🍳 [Creative Recipe Name]

⏱️ **Prep Time:** X minutes | 🔥 **Cook Time:** X minutes | 🍽️ **Serves:** X people

## 🥘 Ingredients
- List all ingredients with specific measurements
- Include both user's ingredients and any common additions needed
- Use bullet points with quantities

## 📝 Instructions
1. Provide detailed, step-by-step cooking instructions
2. Include cooking techniques and temperatures
3. Add timing for each major step
4. Make it 6-10 clear, actionable steps
5. Include plating/presentation tips

## 💡 Chef's Tips
- Share 2-3 professional cooking tips
- Mention ingredient substitutions
- Storage or leftover suggestions

## 🌟 Variations
- Suggest 1-2 creative variations of the recipe
- Different flavor profiles or dietary modifications

Make it comprehensive but approachable. Use emojis and make it visually appealing!`;

    const aiMessage = {
      id: 'initial-recipe',
      text: '',
      isAI: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, aiMessage]);

    try {
      await AIService.generateChatResponse(
        prompt,
        (chunk, fullContent) => {
          setInitialLoading(false);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? {...msg, text: fullContent}
                : msg
            )
          );
        },
        (finalContent) => {
          setInitialLoading(false);
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }, 100);
        },
        (error) => {
          console.error('Initial recipe error:', error);
          setInitialLoading(false);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? {...msg, text: 'Sorry, I had trouble generating a recipe. Please ask me what you\'d like to cook!'}
                : msg
            )
          );
        }
      );
    } catch (error) {
      console.error('Error generating initial recipe:', error);
      setInitialLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessage = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isAI: false,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      // Create context with ingredients and conversation history
      const ingredientList = ingredients
        .map(ing => `${ing.quantity} ${ing.unit} ${ing.name}`)
        .join(', ');
      
      const conversationContext = messages
        .map(msg => `${msg.isAI ? 'AI' : 'User'}: ${msg.text}`)
        .join('\n');

      const prompt = `You are a helpful cooking assistant. The user has these ingredients: ${ingredientList}

Previous conversation:
${conversationContext}

User's new message: ${inputText.trim()}

Respond helpfully using proper markdown formatting:
- Use **bold** for emphasis and key points
- Use bullet points (- or •) for lists
- Use ## for section headers when giving structured info
- Include relevant emojis to make responses engaging
- If suggesting a recipe, use full markdown format with sections
- Keep responses focused, helpful but not too long
- Make it visually appealing with proper formatting
- Use emojis to make it more engaging

Provide helpful, comprehensive responses using markdown formatting!`;

      let aiResponseText = '';
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        text: '',
        isAI: true,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      await AIService.generateChatResponse(
        prompt,
        (chunk, fullContent) => {
          aiResponseText = fullContent;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? {...msg, text: fullContent}
                : msg
            )
          );
        },
        (finalContent) => {
          // Scroll to bottom when complete
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }, 100);
        },
        (error) => {
          console.error('Chat AI error:', error);
          setMessages(prev => 
            prev.map(msg => 
              msg.id === aiMessage.id 
                ? {...msg, text: 'Sorry, I encountered an error. Please try again.'}
                : msg
            )
          );
        }
      );

    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
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
    ).start();
  };

  useEffect(() => {
    if (initialLoading) {
      startPulseAnimation();
    }
  }, [initialLoading]);

  const renderMessage = ({item}) => (
    <View style={[
      styles.messageContainer,
      item.isAI ? styles.aiMessage : styles.userMessage,
    ]}>
      {item.isAI && (
        <ExpoLinearGradient
          colors={['#4ECDC4', '#44A08D']}
          style={styles.aiAvatar}
        >
          <Text style={styles.avatarIcon}>🤖</Text>
        </ExpoLinearGradient>
      )}
      <View style={[
        styles.messageBubble,
        item.isAI ? styles.aiMessageBubble : styles.userMessageBubble,
      ]}>
        {item.isAI ? (
          <ExpoLinearGradient
            colors={['#2C3E50', '#34495E']}
            style={styles.aiGradient}
          >
            <Markdown style={markdownStyles}>
              {item.text || ' '}
            </Markdown>
          </ExpoLinearGradient>
        ) : (
          <ExpoLinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.userGradient}
          >
            <Text style={styles.userText}>
              {item.text}
            </Text>
          </ExpoLinearGradient>
        )}
      </View>
      {!item.isAI && (
        <ExpoLinearGradient
          colors={['#FF6B6B', '#FF8E8E']}
          style={styles.userAvatar}
        >
          <Text style={styles.avatarIcon}>👤</Text>
        </ExpoLinearGradient>
      )}
    </View>
  );

  return (
    <ExpoLinearGradient
      colors={['#1a1a2e', '#16213e', '#0f3460']}
      style={styles.container}
    >
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Header */}
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.05)']}
          style={styles.chatHeader}
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
              colors={['#FF6B6B', '#4ECDC4']}
              style={styles.headerIcon}
            >
              <Text style={styles.headerIconText}>🤖</Text>
            </ExpoLinearGradient>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Recipe Assistant</Text>
              <Text style={styles.headerSubtitle}>Your AI cooking companion</Text>
            </View>
          </View>
        </ExpoLinearGradient>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
          showsVerticalScrollIndicator={false}
        />
        
        {initialLoading && (
          <View style={styles.initialLoadingContainer}>
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
                <ActivityIndicator size="large" color="#4ECDC4" />
                <Text style={styles.initialLoadingText}>
                  🧠 AI Chef at Work
                </Text>
                <Text style={styles.initialLoadingSubtext}>
                  Analyzing your ingredients and crafting the perfect recipe...
                </Text>
              </ExpoLinearGradient>
            </Animated.View>
          </View>
        )}
        
        <ExpoLinearGradient
          colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)']}
          style={styles.inputContainer}
        >
          <View style={styles.inputWrapper}>
            <ExpoLinearGradient
              colors={['#34495E', '#2C3E50']}
              style={styles.textInputContainer}
            >
              <TextInput
                style={styles.textInput}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask about recipes, cooking tips, or substitutions..."
                placeholderTextColor="rgba(255,255,255,0.6)"
                multiline
                maxLength={500}
                disabled={loading || initialLoading}
                onSubmitEditing={sendMessage}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
              />
            </ExpoLinearGradient>
            <ExpoLinearGradient
              colors={(loading || initialLoading || !inputText.trim()) ? ['#555', '#333'] : ['#4ECDC4', '#44A08D']}
              style={styles.sendButtonGradient}
            >
              <IconButton
                icon="send"
                iconColor="white"
                size={24}
                onPress={sendMessage}
                disabled={loading || initialLoading || !inputText.trim()}
                style={styles.sendButton}
              />
            </ExpoLinearGradient>
          </View>
          
          {loading && (
            <View style={styles.loadingContainer}>
              <ExpoLinearGradient
                colors={['rgba(78, 205, 196, 0.2)', 'rgba(78, 205, 196, 0.1)']}
                style={styles.typingIndicator}
              >
                <ActivityIndicator size="small" color="#4ECDC4" />
                <Text style={styles.loadingText}>AI Chef is cooking up a response...</Text>
              </ExpoLinearGradient>
            </View>
          )}
        </ExpoLinearGradient>
      </KeyboardAvoidingView>
    </ExpoLinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  chatHeader: {
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
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-end',
  },
  aiMessage: {
    justifyContent: 'flex-start',
  },
  userMessage: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 4,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    marginBottom: 4,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarIcon: {
    fontSize: 18,
  },
  messageBubble: {
    maxWidth: '75%',
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  aiMessageBubble: {
    borderBottomLeftRadius: 8,
  },
  userMessageBubble: {
    borderBottomRightRadius: 8,
  },
  aiGradient: {
    padding: 18,
  },
  userGradient: {
    padding: 18,
  },
  userText: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '400',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInputContainer: {
    flex: 1,
    borderRadius: 25,
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  textInput: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    maxHeight: 100,
    fontSize: 16,
    backgroundColor: 'transparent',
    color: '#fff',
  },
  sendButtonGradient: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  sendButton: {
    margin: 0,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingTop: 12,
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  loadingText: {
    marginLeft: 10,
    color: '#4ECDC4',
    fontSize: 14,
    fontWeight: '600',
  },
  initialLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 26, 46, 0.8)',
  },
  loadingBubble: {
    marginHorizontal: 32,
  },
  loadingBubbleGradient: {
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
  },
  initialLoadingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  initialLoadingSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
});

const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#ECF0F1',
  },
  heading1: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4ECDC4',
    marginTop: 20,
    marginBottom: 12,
  },
  heading2: {
    fontSize: 20,
    fontWeight: '600',
    color: '#4ECDC4',
    marginTop: 16,
    marginBottom: 10,
  },
  heading3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4ECDC4',
    marginTop: 12,
    marginBottom: 8,
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
    marginBottom: 6,
  },
  ordered_list: {
    marginBottom: 12,
  },
  bullet_list: {
    marginBottom: 12,
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
  code_block: {
    backgroundColor: 'rgba(78, 205, 196, 0.15)',
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
    padding: 16,
    borderRadius: 8,
    marginVertical: 12,
    fontSize: 14,
    fontFamily: 'monospace',
    color: '#ECF0F1',
  },
  blockquote: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
    paddingLeft: 16,
    marginVertical: 12,
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    paddingVertical: 12,
    borderRadius: 8,
  },
};

export default ChatScreen; 