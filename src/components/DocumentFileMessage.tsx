// src/components/DocumentFileMessage.tsx - Telegram-style File Message
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DocumentFileMessageProps {
  title: string;
  format: 'markdown' | 'text';
  timestamp: string;
  onPress: () => void;
  size?: string;
}

const DocumentFileMessage: React.FC<DocumentFileMessageProps> = ({
  title,
  format,
  timestamp,
  onPress,
  size = "Unknown size"
}) => {
  
  const formatMessageTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  const getFileIcon = () => {
    if (format === 'markdown') {
      return 'document-text';
    }
    return 'document';
  };

  const getFileTypeLabel = () => {
    if (format === 'markdown') {
      return 'Markdown Document';
    }
    return 'Text Document';
  };

  return (
    <TouchableOpacity style={styles.fileContainer} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.fileContent}>
        {/* File Icon */}
        <View style={styles.fileIcon}>
          <Ionicons name={getFileIcon()} size={24} color="#667eea" />
        </View>
        
        {/* File Info */}
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={2}>
            {title}
          </Text>
          <View style={styles.fileMetaContainer}>
            <Text style={styles.fileType}>
              {getFileTypeLabel()}
            </Text>
            <Text style={styles.fileDot}>•</Text>
            <Text style={styles.fileSize}>
              {size}
            </Text>
          </View>
        </View>
        
        {/* Download/Open Icon */}
        <View style={styles.actionIcon}>
          <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
        </View>
      </View>
      
      {/* Timestamp */}
      <View style={styles.timestampContainer}>
        <Text style={styles.timestamp}>
          {formatMessageTime(timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fileContainer: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
    maxWidth: '85%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  fileContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    minWidth: 0, // Allow text to truncate properly
  },
  fileName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 4,
    lineHeight: 20,
  },
  fileMetaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  fileType: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  fileDot: {
    fontSize: 13,
    color: '#94a3b8',
    marginHorizontal: 6,
  },
  fileSize: {
    fontSize: 13,
    color: '#64748b',
  },
  actionIcon: {
    marginLeft: 8,
    padding: 4,
  },
  timestampContainer: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  timestamp: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
});

export default DocumentFileMessage;