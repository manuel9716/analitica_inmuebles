import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  Animated,
  Alert,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { getColors, spacing, BRAND_COLORS, typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { PanelLeft } from 'lucide-react-native';
import AppDrawer from '@/components/AppDrawer';
import MessageBubble from '@/components/MessageBubble';
import Composer from '@/components/Composer';
import SuggestionChips from '@/components/SuggestionChips';
import VoiceRecordingOverlay from '@/components/VoiceRecordingOverlay';
import CurrentSelectionPanel from '@/components/CurrentSelectionPanel';
import LoginModal from '@/components/LoginModal';
import RegisterModal from '@/components/RegisterModal';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import AuthPromptModal from '@/components/AuthPromptModal';
import { Message, Listing } from '@/types';
import { nlpService } from '@/services/nlpService';
import { apiClient } from '@/services/apiClient';
import { searchHistoryService } from '@/services/searchHistoryService';
import { generateSearchSummary } from '@/utils/generateSummary';
import { speechRecognitionService } from '@/services/speechRecognitionService';

export default function HomeScreen() {
  const params = useLocalSearchParams();
  const { isDark } = useTheme();
  const { user } = useAuth();
  const colors = getColors(isDark);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  const showLoginModal = activeModalId === 'login';
  const showRegisterModal = activeModalId === 'register';
  const showForgotPasswordModal = activeModalId === 'forgot-password';
  const showAuthPromptModal = activeModalId === 'auth-prompt';

  const openModal = (modalId: string) => {
    setActiveModalId(modalId);
  };

  const closeModal = (modalId: string) => {
    if (activeModalId === modalId) {
      setActiveModalId(null);
    }
  };
  const [isLoading, setIsLoading] = useState(false);
  const [selectedListings, setSelectedListings] = useState<string[]>([]);
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [listingsData, setListingsData] = useState<Listing[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [isToggling, setIsToggling] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const durationInterval = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(-400)).current;

  useEffect(() => {
    speechRecognitionService.initialize();
  }, []);

  useEffect(() => {
    if (drawerVisible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: -400,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [drawerVisible]);

  useEffect(() => {
    if (params.historyItem) {
      try {
        const item = JSON.parse(params.historyItem as string);
        setTimeout(() => {
          handleSearchHistoryClick(item);
        }, 100);
      } catch (error) {
        console.error('Error parsing history item:', error);
      }
    }
  }, [params.historyItem]);

  useEffect(() => {
    if (currentMessageId) {
      const currentMessage = messages.find(m => m.id === currentMessageId);
      if (currentMessage?.selectedListingIds) {
        setSelectedListings(currentMessage.selectedListingIds);
      }
    }
  }, [messages, currentMessageId]);

  const handleNewConversation = () => {
    setMessages([]);
    setSelectedListings([]);
    setCurrentMessageId(null);
    setListingsData([]);
    setDrawerVisible(false);
  };

  const handleSearchHistoryClick = (item: any) => {
    if (!item.results || !item.filters) {
      handleSendMessage(item.query);
      return;
    }

    const normalizedResults = item.results.map((listing: any) => ({
      ...listing,
      features: listing.features || [],
      images: listing.images || [],
    }));

    const now = new Date();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: item.query,
      timestamp: now,
      createdAt: now.toISOString(),
    };

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `Encontré ${normalizedResults.length} inmuebles para ti:`,
      timestamp: now,
      createdAt: now.toISOString(),
      filters: item.filters,
      selectedListingIds: [],
      frozenSelection: false,
      availableListingIds: normalizedResults.map((p: any) => p.id),
    };

    setMessages([userMessage, assistantMessage]);
    setListingsData(normalizedResults);
    setSelectedListings([]);
    setCurrentMessageId(assistantMessage.id);
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    if (!user) {
      openModal('auth-prompt');
    }

    const previousSelectedIds = [...selectedListings];
    const previousMessageId = currentMessageId;
    let baseListingsToFilter: Listing[] | null = null;

    if (previousMessageId && previousSelectedIds.length > 0) {
      setMessages(prev => prev.map(msg => {
        if (msg.id === previousMessageId) {
          const uniqueIds = Array.from(new Set(previousSelectedIds));
          return {
            ...msg,
            selectedListingIds: uniqueIds,
            frozenSelection: true
          };
        }
        return msg;
      }));

      const uniquePreviousIds = Array.from(new Set(previousSelectedIds));
      baseListingsToFilter = listingsData.filter(listing =>
        uniquePreviousIds.includes(listing.id)
      );
    }

    setSelectedListings([]);
    setCurrentMessageId(null);

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const { filters, listings, message: nlpMessage } = await nlpService.processQueryWithResults(text);

      let resultListings = listings || [];

      if (baseListingsToFilter && baseListingsToFilter.length > 0) {
        resultListings = baseListingsToFilter.filter(listing => {
          if (filters.propertyType && listing.propertyType !== filters.propertyType) {
            return false;
          }

          if (filters.location) {
            const searchLoc = filters.location.toLowerCase();
            const matchesLocation = listing.location?.toLowerCase().includes(searchLoc);
            const matchesNeighborhood = listing.neighborhood?.toLowerCase().includes(searchLoc);
            if (!matchesLocation && !matchesNeighborhood) {
              return false;
            }
          }

          if (filters.bedrooms && listing.bedrooms !== filters.bedrooms) {
            return false;
          }

          if (filters.bathrooms && listing.bathrooms !== filters.bathrooms) {
            return false;
          }

          if (filters.minPrice && listing.price < filters.minPrice) {
            return false;
          }

          if (filters.maxPrice && listing.price > filters.maxPrice) {
            return false;
          }

          if (filters.minArea && listing.area < filters.minArea) {
            return false;
          }

          if (filters.maxArea && listing.area > filters.maxArea) {
            return false;
          }

          if (filters.features && filters.features.length > 0) {
            const hasAllFeatures = filters.features.every(feature =>
              listing.features?.some(f =>
                f.toLowerCase().includes(feature.toLowerCase())
              )
            );
            if (!hasAllFeatures) {
              return false;
            }
          }

          return true;
        });
      }

      const summary = baseListingsToFilter
        ? `De los ${baseListingsToFilter.length} inmuebles seleccionados, ${resultListings.length} cumplen con los criterios:`
        : nlpMessage || generateSearchSummary(filters, resultListings.length);

      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: summary,
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
        filters,
        selectedListingIds: [],
        frozenSelection: false,
        availableListingIds: resultListings.map((p) => p.id),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setListingsData(resultListings);
      setCurrentMessageId(assistantMessage.id);
      setSelectedListings([]);

      await searchHistoryService.saveSearch(
        text,
        filters,
        resultListings
      );
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Lo siento, hubo un error procesando tu solicitud. Por favor intenta de nuevo.',
        timestamp: new Date(),
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSelect = async (listing: Listing) => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para seleccionar inmuebles');
      return;
    }

    if (!currentMessageId) {
      return;
    }

    const currentMessage = messages.find(m => m.id === currentMessageId);
    if (currentMessage?.frozenSelection) {
      return;
    }

    setIsToggling(true);
    const isSelected = selectedListings.includes(listing.id);

    try {
      if (isSelected) {
        const newSelection = Array.from(
          new Set(selectedListings.filter((id) => id !== listing.id))
        );
        setSelectedListings(newSelection);

        setMessages(prev => prev.map(msg => {
          if (msg.id === currentMessageId && !msg.frozenSelection) {
            return { ...msg, selectedListingIds: newSelection };
          }
          return msg;
        }));
      } else {
        const newSelection = Array.from(
          new Set([...selectedListings, listing.id])
        );
        setSelectedListings(newSelection);

        setMessages(prev => prev.map(msg => {
          if (msg.id === currentMessageId && !msg.frozenSelection) {
            return { ...msg, selectedListingIds: newSelection };
          }
          return msg;
        }));
      }
    } catch (error) {
      console.error('Error toggling selection:', error);
    } finally {
      setIsToggling(false);
    }
  };

  const handleRemoveFromSelection = (listingId: string) => {
    if (!currentMessageId) return;

    setMessages(prev => prev.map(msg => {
      if (msg.id === currentMessageId && msg.selectedListingIds && !msg.frozenSelection) {
        const newSelection = msg.selectedListingIds.filter(id => id !== listingId);
        return { ...msg, selectedListingIds: newSelection };
      }
      return msg;
    }));

    setSelectedListings(prev => prev.filter(id => id !== listingId));
  };

  const handleVoiceStart = async () => {
    setIsRecording(true);
    setRecordingDuration(0);
    setTranscript('');

    durationInterval.current = setInterval(() => {
      setRecordingDuration((prev) => prev + 1);
    }, 1000);

    const success = await speechRecognitionService.start(
      (text: string, isFinal: boolean) => {
        setTranscript(text);
      },
      (error: string) => {
        console.error('Speech recognition error:', error);
        handleVoiceCancel();
      }
    );

    if (!success) {
      if (Platform.OS === 'web') {
        console.error('Failed to start speech recognition');
      }
      handleVoiceCancel();
    }
  };

  const handleVoiceCancel = () => {
    speechRecognitionService.stop();
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    setIsRecording(false);
    setRecordingDuration(0);
    setTranscript('');
  };

  const handleVoiceSend = () => {
    speechRecognitionService.stop();
    if (durationInterval.current) {
      clearInterval(durationInterval.current);
    }
    const finalTranscript = transcript;
    setIsRecording(false);
    setRecordingDuration(0);
    setTranscript('');

    if (finalTranscript) {
      handleSendMessage(finalTranscript);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  const getListingsForMessage = (message: Message): Listing[] => {
    const idsToShow = message.availableListingIds || [];
    if (idsToShow.length === 0) return [];
    return listingsData.filter(l => idsToShow.includes(l.id));
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    const listings = !item.frozenSelection ? getListingsForMessage(item) : [];
    return (
      <MessageBubble
        message={item}
        isUser={isUser}
        listings={listings}
        onToggleSelect={handleToggleSelect}
        selectedListings={selectedListings}
        currentMessageId={currentMessageId}
        onRemoveFromSelection={handleRemoveFromSelection}
        onAuthRequired={() => openModal('auth-prompt')}
      />
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={[styles.header, { backgroundColor: BRAND_COLORS.primary }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.menuButton}
            onPress={() => setDrawerVisible(true)}
          >
            <PanelLeft size={24} color={BRAND_COLORS.white} />
          </TouchableOpacity>

          <Image
            source={require('@/assets/images/fblanco.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
      </SafeAreaView>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
              ¿Qué inmueble estás buscando?
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
              Encuentra tu propiedad ideal de manera rápida y sencilla
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messagesContainer}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {messages.length === 0 && (
          <View style={styles.suggestionsWrapper}>
            <SuggestionChips onSelect={handleSuggestionPress} />
          </View>
        )}

        <CurrentSelectionPanel
          selectedListings={selectedListings}
          listings={listingsData}
          onRemove={handleRemoveFromSelection}
        />

        <Composer
          onSend={handleSendMessage}
          onVoiceStart={handleVoiceStart}
          disabled={isLoading}
        />
      </KeyboardAvoidingView>

      {isRecording && (
        <VoiceRecordingOverlay
          onCancel={handleVoiceCancel}
          onSend={handleVoiceSend}
          duration={recordingDuration}
          transcript={transcript}
        />
      )}

      <Modal
        visible={drawerVisible}
        transparent
        animationType="none"
        onRequestClose={() => setDrawerVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setDrawerVisible(false)}
        >
          <Animated.View
            style={[
              styles.drawerContainer,
              {
                transform: [{ translateX: slideAnim }],
              },
            ]}
            onStartShouldSetResponder={() => true}
          >
            <AppDrawer
              onClose={() => setDrawerVisible(false)}
              onNewConversation={handleNewConversation}
              onSearchHistoryClick={handleSearchHistoryClick}
              onShowLogin={() => openModal('login')}
              onShowRegister={() => openModal('register')}
            />
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      <LoginModal
        visible={showLoginModal}
        onClose={() => closeModal('login')}
        onSwitchToRegister={() => openModal('register')}
        onForgotPassword={() => openModal('forgot-password')}
      />

      <RegisterModal
        visible={showRegisterModal}
        onClose={() => closeModal('register')}
        onSwitchToLogin={() => openModal('login')}
      />

      <ForgotPasswordModal
        visible={showForgotPasswordModal}
        onClose={() => closeModal('forgot-password')}
      />

      <AuthPromptModal
        visible={showAuthPromptModal}
        onClose={() => closeModal('auth-prompt')}
        onLogin={() => openModal('login')}
        onRegister={() => openModal('register')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuButton: {
    padding: spacing.sm,
    position: 'absolute',
    left: spacing.md,
  },
  logo: {
    width: 180,
    height: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  welcomeTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  welcomeSubtitle: {
    fontSize: typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 24,
  },
  messagesContainer: {
    paddingVertical: spacing.md,
  },
  suggestionsWrapper: {
    paddingBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  drawerContainer: {
    width: '100%',
    height: '100%',
  },
});
