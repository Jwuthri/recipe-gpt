# Session Management in Recipe GPT

## Current Behavior

### ✅ "Analyze & Cook" Button
- **Always creates a new session** each time you click it
- Fresh conversation for each image analysis
- Perfect for analyzing different sets of ingredients

### 🔄 Recipe Generation 
- **Reuses the current session** by default
- Maintains conversation context with the AI
- AI remembers the ingredients from image analysis

## Advanced Options

If you want recipe generation to also create new sessions, you can modify the code:

### In RecipeScreen.js or similar:
```javascript
// Force new session for recipe generation
await AIService.generateRecipeStream(ingredients, onChunk, onComplete, onError, true);

// Or for non-streaming:
await AIService.generateRecipe(ingredients, true);
```

### Session Control Methods Available:
```javascript
// Clear current session (force new one next time)
BackendService.clearCurrentSession();

// Force new session in recipe generation
BackendService.generateRecipe(ingredients, true);
```

## User Experience

1. **Take photos** → Click "Analyze & Cook" → **New session created**
2. **Continue chatting** → Same session (AI remembers context)
3. **Take new photos** → Click "Analyze & Cook" → **Another new session created**

This gives you fresh analysis each time while maintaining conversation flow within each session. 