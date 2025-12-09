import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { getColors, spacing, typography, borderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { X } from 'lucide-react-native';

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PrivacyPolicyModal({ visible, onClose }: PrivacyPolicyModalProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Política de Privacidad</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            Última actualización: 17 de noviembre de 2025
          </Text>

          <Text style={[styles.text, { color: colors.textPrimary }]}>
            En Fácil Inmobiliaria nos tomamos muy en serio la privacidad de nuestros usuarios. Esta Política de Privacidad describe cómo recopilamos, usamos y protegemos tu información personal cuando utilizas nuestra plataforma.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            1. Información que Recopilamos
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Recopilamos la siguiente información:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Información de cuenta: nombre, correo electrónico, teléfono{'\n'}
            • Información de búsqueda: consultas, preferencias y filtros aplicados{'\n'}
            • Información de navegación: páginas visitadas, propiedades vistas{'\n'}
            • Datos técnicos: dirección IP, tipo de navegador, sistema operativo
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            2. Cómo Usamos tu Información
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Utilizamos tu información para:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Proporcionar y mejorar nuestros servicios{'\n'}
            • Personalizar tu experiencia de búsqueda{'\n'}
            • Procesar tus solicitudes de visitas a propiedades{'\n'}
            • Enviarte notificaciones sobre tus búsquedas y citas{'\n'}
            • Mantener la seguridad de nuestra plataforma{'\n'}
            • Cumplir con obligaciones legales
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            3. Compartir Información
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            No vendemos ni alquilamos tu información personal a terceros. Compartimos tu información solo cuando:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Es necesario para procesar tus solicitudes (ej: pre agendar visitas){'\n'}
            • Lo requiere la ley o autoridades competentes{'\n'}
            • Has dado tu consentimiento explícito{'\n'}
            • Es necesario para proteger nuestros derechos o seguridad
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            4. Seguridad de los Datos
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Implementamos medidas de seguridad técnicas y organizativas para proteger tu información personal:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Encriptación de datos en tránsito y en reposo{'\n'}
            • Autenticación segura de usuarios{'\n'}
            • Acceso restringido a información personal{'\n'}
            • Monitoreo continuo de seguridad{'\n'}
            • Auditorías regulares de seguridad
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            5. Tus Derechos
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Tienes derecho a:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Acceder a tu información personal{'\n'}
            • Corregir información inexacta{'\n'}
            • Solicitar la eliminación de tu información{'\n'}
            • Oponerte al procesamiento de tus datos{'\n'}
            • Exportar tu información en formato legible{'\n'}
            • Retirar tu consentimiento en cualquier momento
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            6. Cookies y Tecnologías Similares
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Utilizamos cookies y tecnologías similares para:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Mantener tu sesión activa{'\n'}
            • Recordar tus preferencias{'\n'}
            • Analizar el uso de nuestra plataforma{'\n'}
            • Mejorar el rendimiento y la experiencia del usuario
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Puedes configurar tu navegador para rechazar cookies, pero esto puede afectar la funcionalidad de nuestra plataforma.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            7. Retención de Datos
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Conservamos tu información personal solo durante el tiempo necesario para cumplir con los fines descritos en esta política, salvo que la ley requiera o permita un período de retención más largo.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            8. Menores de Edad
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos intencionalmente información de menores. Si descubrimos que hemos recopilado información de un menor, la eliminaremos inmediatamente.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            9. Cambios a Esta Política
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Podemos actualizar esta Política de Privacidad ocasionalmente. Te notificaremos sobre cambios significativos publicando la nueva política en esta página y actualizando la fecha de "Última actualización".
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            10. Contacto
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Si tienes preguntas sobre esta Política de Privacidad, puedes contactarnos:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Email: privacidad@facilinmobiliaria.com{'\n'}
            • Teléfono: +57 (2) 555 0123{'\n'}
            • Dirección: Calle 10 #5-50, Cali, Colombia
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  date: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  text: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
});
