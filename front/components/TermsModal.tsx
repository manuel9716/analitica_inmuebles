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

interface TermsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function TermsModal({ visible, onClose }: TermsModalProps) {
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
          <Text style={styles.headerTitle}>Términos y Condiciones</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            Última actualización: 17 de noviembre de 2025
          </Text>

          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Bienvenido a Fácil Inmobiliaria. Al acceder y usar nuestra plataforma, aceptas cumplir con los siguientes términos y condiciones. Por favor, léelos cuidadosamente.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            1. Aceptación de los Términos
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Al acceder y utilizar Fácil Inmobiliaria, aceptas estar legalmente vinculado por estos Términos y Condiciones. Si no estás de acuerdo con alguno de estos términos, no debes usar nuestra plataforma.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            2. Descripción del Servicio
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Fácil Inmobiliaria es una plataforma en línea que facilita la búsqueda de propiedades inmobiliarias. Ofrecemos:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Motor de búsqueda inteligente de propiedades{'\n'}
            • Sistema de búsqueda por voz{'\n'}
            • Agendamiento de visitas a propiedades{'\n'}
            • Comparación de propiedades{'\n'}
            • Guardar favoritos y búsquedas{'\n'}
            • Compartir propiedades con otros usuarios
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            3. Registro y Cuenta de Usuario
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Para acceder a ciertas funcionalidades, debes crear una cuenta. Te comprometes a:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Proporcionar información verdadera, precisa y actualizada{'\n'}
            • Mantener la seguridad de tu contraseña{'\n'}
            • Notificarnos inmediatamente sobre cualquier uso no autorizado{'\n'}
            • Ser responsable de todas las actividades en tu cuenta{'\n'}
            • No compartir tu cuenta con terceros
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            4. Uso Aceptable
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Te comprometes a no usar nuestra plataforma para:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Publicar contenido falso, engañoso o fraudulento{'\n'}
            • Violar derechos de propiedad intelectual{'\n'}
            • Acosar, amenazar o difamar a otros usuarios{'\n'}
            • Distribuir virus o código malicioso{'\n'}
            • Intentar acceder a sistemas no autorizados{'\n'}
            • Usar la plataforma para fines ilegales{'\n'}
            • Realizar scraping o extracción automatizada de datos{'\n'}
            • Interferir con el funcionamiento normal de la plataforma
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            5. Contenido de Usuario
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Al publicar contenido en nuestra plataforma:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Retienes todos los derechos sobre tu contenido{'\n'}
            • Nos otorgas una licencia mundial, no exclusiva y libre de regalías para usar, reproducir y distribuir tu contenido{'\n'}
            • Garantizas que tienes todos los derechos necesarios sobre el contenido{'\n'}
            • Aceptas que tu contenido puede ser visible para otros usuarios{'\n'}
            • Nos reservamos el derecho de eliminar contenido que viole estos términos
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            6. Información de Propiedades
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            La información de propiedades es proporcionada por terceros. Hacemos nuestro mejor esfuerzo para verificar su exactitud, pero:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • No garantizamos la exactitud, completitud o actualidad de la información{'\n'}
            • No somos responsables de errores u omisiones{'\n'}
            • Las fotos pueden no reflejar el estado actual de la propiedad{'\n'}
            • Los precios están sujetos a cambios sin previo aviso{'\n'}
            • Recomendamos verificar toda la información directamente con el propietario o agente
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            7. Transacciones y Contratos
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Fácil Inmobiliaria es solo una plataforma de conexión. No somos parte de ninguna transacción entre usuarios y propietarios:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • No garantizamos que se complete ninguna transacción{'\n'}
            • No somos responsables de disputas entre partes{'\n'}
            • Los contratos se realizan directamente entre las partes{'\n'}
            • Recomendamos asesoría legal para cualquier transacción{'\n'}
            • No somos responsables de pérdidas o daños resultantes de transacciones
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            8. Limitación de Responsabilidad
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            En la máxima medida permitida por la ley:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • No somos responsables de daños directos, indirectos, incidentales o consecuentes{'\n'}
            • No garantizamos que el servicio esté libre de errores o interrupciones{'\n'}
            • No somos responsables de la conducta de otros usuarios{'\n'}
            • El servicio se proporciona "tal cual" sin garantías de ningún tipo{'\n'}
            • Tu único recurso en caso de insatisfacción es dejar de usar la plataforma
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            9. Propiedad Intelectual
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Todo el contenido de la plataforma, incluyendo texto, gráficos, logos, código y diseño, es propiedad de Fácil Inmobiliaria o sus licenciantes y está protegido por leyes de propiedad intelectual.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            10. Modificaciones al Servicio
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Nos reservamos el derecho de:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Modificar o descontinuar el servicio en cualquier momento{'\n'}
            • Cambiar tarifas o introducir nuevos servicios de pago{'\n'}
            • Actualizar estos términos y condiciones{'\n'}
            • Suspender o terminar cuentas que violen estos términos
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            11. Ley Aplicable y Jurisdicción
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Estos términos se rigen por las leyes de Colombia. Cualquier disputa será resuelta en los tribunales de Cali, Colombia.
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            12. Contacto
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Si tienes preguntas sobre estos Términos y Condiciones, puedes contactarnos:
          </Text>
          <Text style={[styles.text, { color: colors.textPrimary }]}>
            • Email: legal@facilinmobiliaria.com{'\n'}
            • Teléfono: +57 (2) 555 0123{'\n'}
            • Dirección: Calle 10 #5-50, Cali, Colombia
          </Text>

          <Text style={[styles.text, { color: colors.textPrimary }]}>
            Al continuar usando Fácil Inmobiliaria, confirmas que has leído, entendido y aceptado estos Términos y Condiciones.
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
