# Betty Voice Features

## Overview
Betty now has voice capabilities that allow her to speak her responses using text-to-speech technology. This feature enhances the user experience by making conversations more natural and accessible.

## Features

### 🎤 Automatic Voice Responses
- Betty automatically speaks her responses when she replies to your messages
- Voice is enabled by default but can be toggled on/off
- Responses are spoken with a female voice optimized for clarity

### 🔊 Manual Voice Control
- Tap the audio icon (🔊) next to any of Betty's messages to hear them again
- The icon changes to show when Betty is currently speaking
- You can stop speech by tapping the icon while it's playing

### 🎛️ Voice Controls
- **Voice Toggle**: Tap the speaker icon in the chat header to enable/disable voice
- **Visual Indicators**: 
  - Blue speaker icon = Voice enabled
  - Muted speaker icon = Voice disabled
  - Animated icon = Currently speaking

### 🎯 Voice Settings
- **Pitch**: Set to 1.1 for a natural female voice
- **Speed**: Configurable rate (default: 0.9 for optimal clarity)
- **Volume**: Set to 0.8 for comfortable listening
- **Language**: English (US)

## Technical Implementation

### Dependencies
- `expo-speech`: Text-to-speech functionality
- Custom `useTextToSpeech` hook for voice management

### Key Components
1. **useTextToSpeech Hook** (`src/hooks/useTextToSpeech.ts`)
   - Manages speech state and controls
   - Handles text cleaning for better speech
   - Provides voice settings and controls

2. **ChatScreen Integration** (`src/screens/ChatScreen.tsx`)
   - Automatic speech on Betty's responses
   - Audio icons on messages
   - Voice toggle in header
   - Visual feedback during speech

### Text Processing
The system automatically cleans text for better speech:
- Removes markdown formatting (**, *, `, #)
- Converts links to plain text
- Replaces multiple newlines with periods
- Trims whitespace

## Usage Examples

### Basic Usage
1. Start a conversation with Betty
2. Betty will automatically speak her responses
3. Tap the audio icon to replay any message

### Voice Control
1. Tap the speaker icon in the header to toggle voice on/off
2. When disabled, Betty will respond silently
3. When enabled, Betty will speak all responses

### Accessibility
- Voice features make Betty more accessible to users with visual impairments
- Provides an alternative way to consume Betty's responses
- Can be used in hands-free scenarios

## Future Enhancements
- Voice speed controls in settings
- Multiple voice options
- Speech recognition for voice input
- Voice preferences per user
- Background music/sound effects

## Troubleshooting
- If voice doesn't work, check device volume
- Ensure microphone permissions are granted
- Restart the app if speech stops working
- Check internet connection for voice processing
