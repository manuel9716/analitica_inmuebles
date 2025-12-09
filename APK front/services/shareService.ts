import { Listing } from '@/types';
import * as Clipboard from 'expo-clipboard';
import { Share, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';

const generateShareToken = (): string => {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

export const shareService = {
  async createShareLink(property: Listing, userId?: string): Promise<string> {
    try {
      const shareToken = generateShareToken();

      const { data, error } = await supabase
        .from('shared_properties')
        .insert({
          property_id: property.id,
          property_data: property,
          share_token: shareToken,
          shared_by: userId || null,
        })
        .select()
        .single();

      if (error) throw error;

      const shareUrl = `https://buscofacil.com/propiedad/${shareToken}`;
      return shareUrl;
    } catch (error) {
      console.error('Error creating share link:', error);
      const fallbackUrl = `https://buscofacil.com/propiedad/${property.id}`;
      return fallbackUrl;
    }
  },

  async getSharedProperty(token: string): Promise<Listing | null> {
    try {
      const { data, error } = await supabase
        .from('shared_properties')
        .select('property_data, view_count, id')
        .eq('share_token', token)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      await supabase
        .from('shared_properties')
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', data.id);

      return data.property_data as Listing;
    } catch (error) {
      console.error('Error getting shared property:', error);
      return null;
    }
  },

  async shareProperty(property: Listing, userId?: string): Promise<{ success: boolean; message: string }> {
    try {
      const formatPrice = (price: number) => {
        return new Intl.NumberFormat('es-CO', {
          style: 'currency',
          currency: 'COP',
          minimumFractionDigits: 0,
        }).format(price);
      };

      const shareUrl = await this.createShareLink(property, userId);

      const features = [];
      features.push(`🛌️ ${property.bedrooms} habitaciones`);
      features.push(`🚿 ${property.bathrooms} baños`);
      features.push(`📏 ${property.area}m²`);
      if (property.parking && property.parking > 0) {
        features.push(`🚗 ${property.parking} parqueaderos`);
      }
      if (property.estrato) {
        features.push(`🏛️ Estrato ${property.estrato}`);
      }

      const shareTitle = `${property.title} - ${formatPrice(property.price)}`;
      const imageUrl = property.images && property.images.length > 0 ? property.images[0] : '';

      const shareMessage = `🏠 ${property.title}

💰 ${formatPrice(property.price)}
📍 ${property.location}
${property.city ? `🌆 ${property.city}` : ''}${property.neighborhood ? ` - ${property.neighborhood}` : ''}

✨ Características:
${features.join('\n')}

📝 ${property.description.substring(0, 200)}${property.description.length > 200 ? '...' : ''}
${imageUrl ? `\n📷 Ver foto: ${imageUrl}` : ''}

🔗 Ver propiedad completa con más fotos:
${shareUrl}

🏢 Fácil Inmobiliaria - Tu inmueble ideal`;

      if (Platform.OS === 'web') {
        await Clipboard.setStringAsync(shareUrl);
        return { success: true, message: 'Enlace copiado al portapapeles' };
      } else {
        const shareOptions: any = {
          title: shareTitle,
          message: Platform.OS === 'ios' ? shareMessage : `${shareMessage}`,
        };

        if (Platform.OS === 'android') {
          shareOptions.message = shareMessage;
        }

        if (Platform.OS === 'ios' && shareUrl) {
          shareOptions.url = shareUrl;
        }

        const result = await Share.share(shareOptions, {
          subject: shareTitle,
          dialogTitle: 'Compartir propiedad',
        });

        if (result.action === Share.sharedAction) {
          await Clipboard.setStringAsync(shareUrl);

          let sharedApp = 'una aplicación';
          if (result.activityType) {
            const activityMap: Record<string, string> = {
              'com.apple.UIKit.activity.Message': 'Mensajes',
              'com.apple.UIKit.activity.Mail': 'Correo',
              'net.whatsapp.WhatsApp.ShareExtension': 'WhatsApp',
              'com.burbn.instagram.shareextension': 'Instagram',
              'com.facebook.Facebook.ShareExtension': 'Facebook',
              'com.atebits.Tweetie2.ShareExtension': 'Twitter',
              'com.linkedin.LinkedIn.ShareExtension': 'LinkedIn',
              'com.telegram.Telegraph.Share': 'Telegram',
            };
            sharedApp = activityMap[result.activityType] || 'una aplicación';
          }

          return {
            success: true,
            message: `Propiedad compartida en ${sharedApp}. Enlace copiado al portapapeles.`
          };
        } else if (result.action === Share.dismissedAction) {
          await Clipboard.setStringAsync(shareUrl);
          return { success: true, message: 'Enlace copiado al portapapeles' };
        }
      }

      return { success: true, message: 'Propiedad compartida' };
    } catch (error) {
      console.error('Error sharing property:', error);
      return { success: false, message: 'No se pudo compartir la propiedad' };
    }
  },

  async getUserSharedLinks(userId: string) {
    try {
      const { data, error } = await supabase
        .from('shared_properties')
        .select('*')
        .eq('shared_by', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user shared links:', error);
      return [];
    }
  },

  async deleteSharedLink(shareToken: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('shared_properties')
        .delete()
        .eq('share_token', shareToken);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting shared link:', error);
      return false;
    }
  },
};
