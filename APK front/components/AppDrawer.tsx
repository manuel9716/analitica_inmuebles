import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { BRAND_COLORS, spacing, borderRadius } from '@/constants/theme';
import { searchHistoryService } from '@/services/searchHistoryService';
import { SearchHistory } from '@/types';
import { Skeleton } from '@/components/Skeleton';
import {
  MessageSquare,
  Clock,
  User,
  Heart,
  Calendar,
  Settings,
  HelpCircle,
  LogOut,
  X,
  LogIn,
  UserPlus,
} from 'lucide-react-native';

interface AppDrawerProps {
  onClose: () => void;
  onNewConversation: () => void;
  onSearchHistoryClick?: (search: SearchHistory) => void;
  onShowLogin?: () => void;
  onShowRegister?: () => void;
}

export default function AppDrawer({ onClose, onNewConversation, onSearchHistoryClick, onShowLogin, onShowRegister }: AppDrawerProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { isDark } = useTheme();
  const [recentSearches, setRecentSearches] = useState<SearchHistory[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isLoadingSearches, setIsLoadingSearches] = useState(true);

  useEffect(() => {
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    setIsLoadingSearches(true);
    try {
      const searches = await searchHistoryService.getSearchHistory();
      setRecentSearches(searches.slice(0, 5));
    } finally {
      setIsLoadingSearches(false);
    }
  };

  const handleNavigation = (path: string) => {
    onClose();
    router.push(path as any);
  };

  const handleNewConversation = () => {
    onClose();
    onNewConversation();
  };

  const handleSignOut = async () => {
    setShowUserMenu(false);
    await signOut();
    onClose();
  };

  const handleSearchClick = (search: SearchHistory) => {
    onClose();
    if (onSearchHistoryClick) {
      onSearchHistoryClick(search);
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Image
          source={require('@/assets/images/fblanco.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color={BRAND_COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.newChatButton}
          onPress={handleNewConversation}
        >
          <MessageSquare size={20} color={BRAND_COLORS.white} />
          <Text style={styles.newChatText}>Nuevo Chat</Text>
        </TouchableOpacity>

        <ScrollView
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={16} color={BRAND_COLORS.white} />
              <Text style={styles.sectionTitle}>BÚSQUEDAS RECIENTES</Text>
            </View>
            {isLoadingSearches ? (
              <>
                {[1, 2, 3].map((i) => (
                  <View key={i} style={styles.searchItem}>
                    <Skeleton width="80%" height={16} />
                  </View>
                ))}
              </>
            ) : recentSearches.length > 0 ? (
              <>
                {recentSearches.map((search) => (
                  <TouchableOpacity
                    key={search.id}
                    style={styles.searchItem}
                    onPress={() => handleSearchClick(search)}
                  >
                    <Text style={styles.searchText} numberOfLines={1}>
                      {search.query}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.viewAllButton}
                  onPress={() => handleNavigation('/(main)/history')}
                >
                  <Text style={styles.viewAllText}>Ver todas</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.emptyText}>No hay búsquedas recientes</Text>
            )}
          </View>
        </ScrollView>
      </View>

      {!user && (
        <View style={styles.footer}>
          <View style={styles.accountSection}>
            <Text style={styles.accountTitle}>CUENTA</Text>
            <TouchableOpacity
              style={styles.accountButton}
              onPress={() => {
                onClose();
                onShowLogin?.();
              }}
            >
              <LogIn size={20} color={BRAND_COLORS.white} />
              <Text style={styles.accountButtonText}>Ingresar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.accountButton}
              onPress={() => {
                onClose();
                onShowRegister?.();
              }}
            >
              <UserPlus size={20} color={BRAND_COLORS.white} />
              <Text style={styles.accountButtonText}>Registrarse</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {user && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.userButton}
            onPress={() => setShowUserMenu(!showUserMenu)}
          >
            <View style={styles.avatarContainer}>
              <User size={24} color={BRAND_COLORS.white} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName} numberOfLines={1}>
                {user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'}
              </Text>
              <Text style={styles.userEmail} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          </TouchableOpacity>

          <Modal
            visible={showUserMenu}
            transparent
            animationType="fade"
            onRequestClose={() => setShowUserMenu(false)}
          >
            <TouchableOpacity
              style={styles.menuOverlay}
              activeOpacity={1}
              onPress={() => setShowUserMenu(false)}
            >
              <View style={styles.userMenuContainer}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowUserMenu(false);
                    handleNavigation('/(main)/profile');
                  }}
                >
                  <User size={20} color={BRAND_COLORS.primary} />
                  <Text style={styles.menuItemText}>Mi Perfil</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowUserMenu(false);
                    handleNavigation('/(main)/favorites');
                  }}
                >
                  <Heart size={20} color={BRAND_COLORS.primary} />
                  <Text style={styles.menuItemText}>Mis Favoritos</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowUserMenu(false);
                    handleNavigation('/appointments');
                  }}
                >
                  <Calendar size={20} color={BRAND_COLORS.primary} />
                  <Text style={styles.menuItemText}>Mis Citas</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowUserMenu(false);
                    handleNavigation('/settings');
                  }}
                >
                  <Settings size={20} color={BRAND_COLORS.primary} />
                  <Text style={styles.menuItemText}>Configuración</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowUserMenu(false);
                    handleNavigation('/help-center');
                  }}
                >
                  <HelpCircle size={20} color={BRAND_COLORS.primary} />
                  <Text style={styles.menuItemText}>Ayuda y Soporte</Text>
                </TouchableOpacity>

                <View style={styles.menuDivider} />

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={handleSignOut}
                >
                  <LogOut size={20} color={BRAND_COLORS.error} />
                  <Text style={[styles.menuItemText, { color: BRAND_COLORS.error }]}>
                    Cerrar Sesión
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.primary,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logo: {
    width: 200,
    height: 60,
  },
  closeButton: {
    padding: spacing.sm,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  newChatText: {
    color: BRAND_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: BRAND_COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  searchItem: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  searchText: {
    color: BRAND_COLORS.white,
    fontSize: 15,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    paddingVertical: spacing.md,
    textAlign: 'center',
  },
  viewAllButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  viewAllText: {
    color: BRAND_COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  userButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: BRAND_COLORS.white,
    fontSize: 15,
    fontWeight: '600',
  },
  userEmail: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
    paddingBottom: 80,
    paddingLeft: spacing.md,
  },
  userMenuContainer: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 300,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  menuItemText: {
    color: BRAND_COLORS.primary,
    fontSize: 15,
    fontWeight: '500',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.sm,
  },
  accountSection: {
    gap: spacing.md,
  },
  accountTitle: {
    color: BRAND_COLORS.white,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  accountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  accountButtonText: {
    color: BRAND_COLORS.white,
    fontSize: 15,
    fontWeight: '500',
  },
});
