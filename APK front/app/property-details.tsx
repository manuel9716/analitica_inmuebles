import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Pressable,
  Dimensions,
  Share,
  Modal,
  BackHandler,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { Listing } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useVoice } from '@/contexts/VoiceContext';
import { useTheme } from '@/contexts/ThemeContext';
import { analyticsService } from '@/services/analyticsService';
import { recentlyViewedService } from '@/services/recentlyViewedService';
import { shareService } from '@/services/shareService';
import { X, Heart, Share as ShareIcon, Calendar, Bed, Bath, Home as HomeIcon, MapPin, Volume2, Car, Building2, Layers, ChevronLeft, ChevronRight, Minimize2 } from 'lucide-react-native';
import MapView from '@/components/MapView';
import AuthPromptModal from '@/components/AuthPromptModal';
import LoginModal from '@/components/LoginModal';
import RegisterModal from '@/components/RegisterModal';
import ForgotPasswordModal from '@/components/ForgotPasswordModal';
import Toast from '@/components/Toast';

const { width } = Dimensions.get('window');

export default function PropertyDetailsModal() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { isFavorite, addFavorite, removeFavorite } = useFavorites();
  const { speak } = useVoice();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const listing: Listing = params.listing ? JSON.parse(params.listing as string) : null;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeModalId, setActiveModalId] = useState<string | null>(null);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const scrollViewRef = React.useRef<ScrollView>(null);

  const isImageZoomed = activeModalId === 'image-zoom';
  const showAuthPromptModal = activeModalId === 'auth-prompt';
  const showLoginModal = activeModalId === 'login';
  const showRegisterModal = activeModalId === 'register';
  const showForgotPasswordModal = activeModalId === 'forgot-password';

  const openModal = (modalId: string) => {
    setActiveModalId(modalId);
  };

  const closeModal = (modalId: string) => {
    if (activeModalId === modalId) {
      setActiveModalId(null);
    }
  };

  const handlePreviousImage = () => {
    if (!listing) return;
    if (currentImageIndex > 0 && listing.images && listing.images.length > 0) {
      const newIndex = currentImageIndex - 1;
      setCurrentImageIndex(newIndex);
      scrollViewRef.current?.scrollTo({ x: width * newIndex, animated: true });
    }
  };

  const handleNextImage = () => {
    if (!listing) return;
    if (listing.images && currentImageIndex < listing.images.length - 1) {
      const newIndex = currentImageIndex + 1;
      setCurrentImageIndex(newIndex);
      scrollViewRef.current?.scrollTo({ x: width * newIndex, animated: true });
    }
  };

  const handleImagePress = () => {
    openModal('image-zoom');
  };

  useEffect(() => {
    if (listing) {
      trackView();
    }
  }, [listing?.id]);

  useEffect(() => {
    if (Platform.OS === 'android') {
      const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isImageZoomed) {
          closeModal('image-zoom');
          return true;
        }
        return false;
      });

      return () => backHandler.remove();
    }
  }, [isImageZoomed]);

  const trackView = async () => {
    if (!user) {
      return;
    }

    try {
      await recentlyViewedService.trackView(
        listing.id,
        listing,
        user.id,
        null
      );
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  if (!listing) {
    return null;
  }

  const isFav = user ? isFavorite(listing.id) : false;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleFavoriteToggle = async () => {
    if (!user) {
      openModal('auth-prompt');
      return;
    }

    if (isFav) {
      await removeFavorite(listing.id);
    } else {
      await addFavorite(listing);
    }
  };

  const handleShare = async () => {
    try {
      await analyticsService.trackShare(listing.id, listing, 'native', user?.id);
      const result = await shareService.shareProperty(listing, user?.id);

      if (result.success) {
        setToast({ visible: true, message: result.message, type: 'success' });
      } else {
        setToast({ visible: true, message: result.message, type: 'error' });
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setToast({ visible: true, message: 'Error al compartir la propiedad', type: 'error' });
    }
  };

  const handleScheduleVisit = () => {
    router.push({
      pathname: '/schedule-visit',
      params: { listing: JSON.stringify(listing) },
    });
  };

  const handlePlayDescription = () => {
    speak(listing.description);
  };

  return (
    <>
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: false,
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <ScrollView>
          <View style={styles.imageContainer}>
            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentImageIndex(index);
              }}
              scrollEventThrottle={16}
            >
              {listing.images && listing.images.length > 0 ? (
                listing.images.map((image, index) => (
                  <TouchableOpacity key={index} activeOpacity={1} onPress={handleImagePress}>
                    <Image
                      source={{ uri: image }}
                      style={styles.image}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))
              ) : (
                <View style={[styles.image, styles.noImageContainer, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                  <HomeIcon size={64} color={colors.textSecondary} />
                  <Text style={[styles.noImageText, { color: colors.textSecondary }]}>Sin imágenes</Text>
                </View>
              )}
            </ScrollView>

            {listing.images && listing.images.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonLeft]}
                  onPress={handlePreviousImage}
                  disabled={currentImageIndex === 0}
                >
                  <ChevronLeft size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.navButton, styles.navButtonRight]}
                  onPress={handleNextImage}
                  disabled={currentImageIndex === listing.images.length - 1}
                >
                  <ChevronRight size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.bulletsContainer}>
                  {listing.images.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.bullet,
                        index === currentImageIndex && styles.bulletActive,
                      ]}
                    />
                  ))}
                </View>
              </>
            )}

            {listing.images && listing.images.length > 0 && (
              <View style={styles.imageIndicator}>
                <Text style={styles.imageIndicatorText}>
                  {currentImageIndex + 1} / {listing.images.length}
                </Text>
              </View>
            )}

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleFavoriteToggle}
              >
                <Heart
                  size={24}
                  color={isFav ? colors.error : '#FFFFFF'}
                  fill={isFav ? colors.error : 'transparent'}
                />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
                <ShareIcon size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.content}>
            <Text style={[styles.price, { color: isDark ? '#FFFFFF' : colors.primary }]}>{formatPrice(listing.price)}</Text>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{listing.title}</Text>

            <View style={styles.locationRow}>
              <MapPin size={20} color={colors.textSecondary} />
              <Text style={[styles.location, { color: colors.textSecondary }]}>{listing.location}</Text>
            </View>

            <View style={styles.featuresGrid}>
              <View style={styles.featureItem}>
                <Bed size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>{listing.bedrooms} hab.</Text>
              </View>

              <View style={styles.featureItem}>
                <Bath size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>{listing.bathrooms} baños</Text>
              </View>

              <View style={styles.featureItem}>
                <HomeIcon size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>{listing.area} m²</Text>
              </View>

              {listing.parking && listing.parking > 0 && (
                <View style={styles.featureItem}>
                  <Car size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>{listing.parking} parq.</Text>
                </View>
              )}

              {listing.estrato && (
                <View style={styles.featureItem}>
                  <Layers size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.featureText, { color: colors.textPrimary }]}>Estrato {listing.estrato}</Text>
                </View>
              )}

              <View style={styles.featureItem}>
                <Building2 size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>{listing.propertyType}</Text>
              </View>
            </View>

            {listing.city && listing.neighborhood && (
              <View style={[styles.infoCard, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Ciudad:</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.city}</Text>
                </View>
                {listing.neighborhood && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Barrio:</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.neighborhood}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Tipo de negocio:</Text>
                  <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.transactionType === 'venta' ? 'Venta' : 'Arriendo'}</Text>
                </View>
                {listing.source && (
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Fuente:</Text>
                    <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{listing.source}</Text>
                  </View>
                )}
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Descripción</Text>
                <TouchableOpacity onPress={handlePlayDescription}>
                  <Volume2 size={20} color={isDark ? '#FFFFFF' : colors.primary} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.description, { color: colors.textSecondary }]}>{listing.description}</Text>
            </View>

            {listing.features && listing.features.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Características</Text>
                <View style={styles.featuresChips}>
                  {listing.features.map((feature, index) => (
                    <View key={index} style={[styles.featureChip, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
                      <Text style={[styles.featureChipText, { color: colors.textPrimary }]}>{feature}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {listing.coordinates && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Ubicación</Text>
                <View style={styles.locationInfo}>
                  <MapPin size={20} color={colors.textSecondary} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]}>{listing.location}</Text>
                </View>
                <View style={styles.mapContainer}>
                  <MapView
                    latitude={listing.coordinates.lat}
                    longitude={listing.coordinates.lng}
                    title={listing.title}
                  />
                </View>
              </View>
            )}

            <View style={styles.ctaButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                onPress={handleScheduleVisit}
              >
                <Calendar size={20} color="#FFFFFF" />
                <Text style={[styles.primaryButtonText, { color: '#FFFFFF' }]}>Pre Agendar Visita</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      <Modal
        visible={isImageZoomed}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveModalId(null)}
      >
        <View style={styles.zoomModalContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: width * currentImageIndex, y: 0 }}
          >
            {listing.images && listing.images.map((image, index) => (
              <View key={index} style={styles.zoomImageContainer}>
                <Image
                  source={{ uri: image }}
                  style={styles.zoomImage}
                  resizeMode="contain"
                />
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.zoomCloseButton}
            onPress={() => setActiveModalId(null)}
          >
            <Minimize2 size={28} color="#FFFFFF" />
            <Text style={styles.zoomCloseButtonText}>Cerrar</Text>
          </TouchableOpacity>

          <View style={styles.zoomIndicatorWrapper}>
            <View style={styles.zoomIndicator}>
              <Text style={styles.zoomIndicatorText}>
                {currentImageIndex + 1} / {listing.images?.length || 0}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      <AuthPromptModal
        visible={showAuthPromptModal}
        onClose={() => closeModal('auth-prompt')}
        onLogin={() => openModal('login')}
        onRegister={() => openModal('register')}
      />

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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: spacing.md,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
  },
  imageContainer: {
    width,
    height: 300,
  },
  image: {
    width,
    height: 300,
  },
  imageIndicator: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  imageIndicatorText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
  },
  actionButtons: {
    position: 'absolute',
    top: 50,
    left: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
  },
  content: {
    padding: spacing.lg,
  },
  price: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  location: {
    fontSize: typography.fontSize.base,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minWidth: '30%',
  },
  featureText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  infoCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  featuresChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  featureChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  featureChipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    fontSize: typography.fontSize.base,
    marginTop: spacing.md,
  },
  navButton: {
    position: 'absolute',
    top: '50%',
    transform: [{ translateY: -22 }],
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: borderRadius.full,
    padding: spacing.sm,
    zIndex: 5,
  },
  navButtonLeft: {
    left: spacing.md,
  },
  navButtonRight: {
    right: spacing.md,
  },
  bulletsContainer: {
    position: 'absolute',
    bottom: spacing.xl + 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    zIndex: 5,
  },
  bullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  bulletActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  zoomModalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseButton: {
    position: 'absolute',
    top: 50,
    right: spacing.lg,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  zoomCloseButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  zoomImageContainer: {
    width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomImage: {
    width: width,
    height: '80%',
  },
  zoomIndicatorWrapper: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  zoomIndicator: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: borderRadius.full,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  zoomIndicatorText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  description: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  locationText: {
    fontSize: typography.fontSize.base,
  },
  mapContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.md,
  },
  ctaButtons: {
    gap: spacing.md,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    ...shadows.md,
  },
  primaryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
});
