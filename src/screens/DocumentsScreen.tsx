// src/screens/DocumentsScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Animatable from 'react-native-animatable';

interface DocumentProps {
  title: string;
  type: string;
  date: string;
  size: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  onPress: () => void;
}

const DocumentItem: React.FC<DocumentProps> = ({
  title,
  type,
  date,
  size,
  icon,
  color,
  onPress,
}) => (
  <TouchableOpacity onPress={onPress} style={styles.documentItem}>
    <View style={[styles.documentIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color="white" />
    </View>
    <View style={styles.documentInfo}>
      <Text style={styles.documentTitle}>{title}</Text>
      <Text style={styles.documentMeta}>{type} • {size} • {date}</Text>
    </View>
    <TouchableOpacity style={styles.documentOptions}>
      <Ionicons name="ellipsis-vertical" size={16} color="#999" />
    </TouchableOpacity>
  </TouchableOpacity>
);

interface FilterChipProps {
  label: string;
  active: boolean;
  onPress: () => void;
}

const FilterChip: React.FC<FilterChipProps> = ({ label, active, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.filterChipWrapper}>
    {active ? (
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.filterChipActive}>
        <Text style={styles.filterChipTextActive}>{label}</Text>
      </LinearGradient>
    ) : (
      <View style={styles.filterChip}>
        <Text style={styles.filterChipText}>{label}</Text>
      </View>
    )}
  </TouchableOpacity>
);

const DocumentsScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  const filters = ['All', 'PDF', 'Word', 'Excel', 'Image', 'Recent'];

  const documents = [
    {
      title: 'Q4 Business Report.pdf',
      type: 'PDF',
      date: '2 days ago',
      size: '2.4 MB',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      color: '#e74c3c',
    },
    {
      title: 'Marketing Analysis.xlsx',
      type: 'Excel',
      date: '1 week ago',
      size: '856 KB',
      icon: 'grid' as keyof typeof Ionicons.glyphMap,
      color: '#27ae60',
    },
    {
      title: 'Project Proposal.docx',
      type: 'Word',
      date: '3 days ago',
      size: '1.2 MB',
      icon: 'document' as keyof typeof Ionicons.glyphMap,
      color: '#3498db',
    },
    {
      title: 'Team Meeting Notes.pdf',
      type: 'PDF',
      date: '5 days ago',
      size: '512 KB',
      icon: 'document-text' as keyof typeof Ionicons.glyphMap,
      color: '#e74c3c',
    },
    {
      title: 'Budget Overview.xlsx',
      type: 'Excel',
      date: '1 week ago',
      size: '2.1 MB',
      icon: 'grid' as keyof typeof Ionicons.glyphMap,
      color: '#27ae60',
    },
    {
      title: 'Client Presentation.pptx',
      type: 'PowerPoint',
      date: '4 days ago',
      size: '5.3 MB',
      icon: 'easel' as keyof typeof Ionicons.glyphMap,
      color: '#f39c12',
    },
  ];

  const handleDocumentPress = (title: string) => {
    console.log('Open document:', title);
  };

  const handleCreateNew = () => {
    console.log('Create new document');
  };

  const handleUpload = () => {
    console.log('Upload document');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Animatable.View animation="fadeInDown" style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Documents</Text>
          <TouchableOpacity style={styles.headerAction}>
            <Ionicons name="search" size={24} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search documents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </Animatable.View>

      {/* Quick Actions */}
      <Animatable.View animation="fadeInUp" delay={200} style={styles.quickActions}>
        <TouchableOpacity onPress={handleCreateNew} style={styles.actionButton}>
          <LinearGradient colors={['#667eea', '#764ba2']} style={styles.actionButtonGradient}>
            <Ionicons name="add" size={20} color="white" />
            <Text style={styles.actionButtonText}>Create New</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleUpload} style={styles.actionButton}>
          <View style={styles.actionButtonOutline}>
            <Ionicons name="cloud-upload" size={20} color="#667eea" />
            <Text style={styles.actionButtonTextOutline}>Upload</Text>
          </View>
        </TouchableOpacity>
      </Animatable.View>

      {/* Filters */}
      <Animatable.View animation="fadeInLeft" delay={400} style={styles.filtersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter) => (
            <FilterChip
              key={filter}
              label={filter}
              active={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
            />
          ))}
        </ScrollView>
      </Animatable.View>

      {/* Documents List */}
      <ScrollView style={styles.documentsContainer} showsVerticalScrollIndicator={false}>
        <Animatable.View animation="fadeInUp" delay={600}>
          <Text style={styles.sectionTitle}>
            {activeFilter === 'All' ? 'All Documents' : `${activeFilter} Files`} ({documents.length})
          </Text>
          
          {documents.map((document, index) => (
            <Animatable.View
              key={index}
              animation="fadeInUp"
              delay={700 + index * 50}
            >
              <DocumentItem
                {...document}
                onPress={() => handleDocumentPress(document.title)}
              />
            </Animatable.View>
          ))}
        </Animatable.View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9ff',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerAction: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowColor: 'black',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionButtonOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#667eea',
    backgroundColor: 'white',
  },
  actionButtonTextOutline: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  filtersContainer: {
    marginBottom: 20,
  },
  filters: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChipWrapper: {
    marginRight: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterChipActive: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterChipTextActive: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  documentsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    shadowColor: 'black',
    shadowOpacity: 0.05,
    elevation: 2,
  },
  documentIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  documentMeta: {
    fontSize: 12,
    color: '#666',
  },
  documentOptions: {
    padding: 8,
  },
});

export default DocumentsScreen;