import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Linking,
  Alert,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { getColors, spacing, typography, borderRadius, shadows } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ChevronLeft, Search, MessageCircle, Mail, Phone, ChevronDown, ChevronUp, Info, Code, FileText, Shield } from 'lucide-react-native';
import Toast from '@/components/Toast';
import PrivacyPolicyModal from '@/components/PrivacyPolicyModal';
import TermsModal from '@/components/TermsModal';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  title: string;
  icon: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    title: 'Búsqueda de Inmuebles',
    icon: 'search',
    items: [
      {
        question: '¿Cómo puedo buscar inmuebles?',
        answer: 'Puedes buscar inmuebles usando nuestra barra de búsqueda en la pantalla principal. Describe lo que buscas en lenguaje natural, por ejemplo: "Casa de 3 habitaciones en Santa Rita".',
      },
      {
        question: '¿Qué significa el porcentaje de afinidad?',
        answer: 'El porcentaje de afinidad indica qué tan bien un inmueble coincide con tus criterios de búsqueda. Entre más alto el porcentaje, mejor se ajusta a lo que buscas.',
      },
      {
        question: '¿Puedo guardar mis búsquedas favoritas?',
        answer: 'Sí, todas tus búsquedas se guardan automáticamente en el historial y puedes marcar propiedades como favoritas para acceder a ellas rápidamente.',
      },
    ],
  },
  {
    title: 'Citas y Visitas',
    icon: 'calendar',
    items: [
      {
        question: '¿Cómo pre agendar una visita a un inmueble?',
        answer: 'En la página de detalles del inmueble, presiona el botón "Pre Agendar Visita". Selecciona tu fecha preferida y hora, y completa tus datos de contacto. Te contactaremos para confirmar la cita.',
      },
      {
        question: '¿Puedo cambiar o cancelar una cita?',
        answer: 'Sí, puedes gestionar tus citas desde la sección "Mis Citas" en tu perfil. Contáctanos si necesitas hacer cambios.',
      },
      {
        question: '¿Cuánto tiempo antes debo pre agendar una visita?',
        answer: 'Recomendamos pre agendar con al menos 24 horas de anticipación para garantizar disponibilidad.',
      },
    ],
  },
  {
    title: 'Cuenta y Perfil',
    icon: 'user',
    items: [
      {
        question: '¿Necesito crear una cuenta para buscar inmuebles?',
        answer: 'No es necesario crear una cuenta para buscar inmuebles, pero sí necesitas una cuenta para guardar favoritos y pre agendar visitas.',
      },
      {
        question: '¿Cómo actualizo mi información personal?',
        answer: 'Ve a tu perfil y presiona "Editar Perfil". Desde allí puedes actualizar tu nombre, teléfono y otros datos.',
      },
      {
        question: '¿Es segura mi información personal?',
        answer: 'Sí, toda tu información está protegida con encriptación y cumplimos con las normas de privacidad y protección de datos.',
      },
    ],
  },
  {
    title: 'Inmuebles y Precios',
    icon: 'home',
    items: [
      {
        question: '¿Los precios mostrados son finales?',
        answer: 'Los precios mostrados son los precios de venta o arriendo. Pueden estar sujetos a negociación y no incluyen gastos adicionales como notaría o registro.',
      },
      {
        question: '¿Puedo negociar el precio?',
        answer: 'Sí, puedes negociar el precio directamente con el propietario o agente durante la visita al inmueble.',
      },
      {
        question: '¿Qué incluye el precio del inmueble?',
        answer: 'El precio incluye el inmueble y los elementos fijos. Los muebles y electrodomésticos se negocian por separado salvo que se indique lo contrario.',
      },
    ],
  },
  {
    title: 'Seguridad y Privacidad',
    icon: 'shield',
    items: [
      {
        question: '¿Se verifican los inmuebles publicados?',
        answer: 'Sí, todos los inmuebles pasan por un proceso de verificación antes de ser publicados en nuestra plataforma.',
      },
      {
        question: '¿Cómo protegen mis datos personales?',
        answer: 'Usamos encriptación de última generación y nunca compartimos tu información con terceros sin tu consentimiento.',
      },
      {
        question: '¿Puedo reportar un inmueble sospechoso?',
        answer: 'Sí, si encuentras algún inmueble que te parezca sospechoso, puedes reportarlo a través de nuestro formulario de contacto.',
      },
    ],
  },
  {
    title: 'Soporte Técnico',
    icon: 'settings',
    items: [
      {
        question: '¿La plataforma funciona en dispositivos móviles?',
        answer: 'Sí, nuestra plataforma está optimizada para funcionar en dispositivos móviles iOS y Android.',
      },
      {
        question: '¿Qué navegadores son compatibles?',
        answer: 'Nuestra plataforma es compatible con las versiones recientes de Chrome, Safari, Firefox y Edge.',
      },
      {
        question: '¿Qué hago si encuentro un error?',
        answer: 'Si encuentras algún error, por favor contáctanos a través del formulario al final de esta página describiendo el problema.',
      },
    ],
  },
];

export default function HelpCenterScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);
  const [expandedQuestions, setExpandedQuestions] = useState<string[]>([]);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });

  const toggleCategory = (index: number) => {
    if (expandedCategories.includes(index)) {
      setExpandedCategories(expandedCategories.filter(i => i !== index));
    } else {
      setExpandedCategories([...expandedCategories, index]);
    }
  };

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const key = `${categoryIndex}-${questionIndex}`;
    if (expandedQuestions.includes(key)) {
      setExpandedQuestions(expandedQuestions.filter(q => q !== key));
    } else {
      setExpandedQuestions([...expandedQuestions, key]);
    }
  };

  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });

  const handleChat = () => {
    setToast({ visible: true, message: 'Función de chat en desarrollo. Próximamente disponible.', type: 'info' });
  };

  const handleEmail = () => {
    Linking.openURL('mailto:soporte@buscofacil.com').catch(() => {
      setToast({ visible: true, message: 'No se pudo abrir el cliente de email', type: 'error' });
    });
  };

  const handlePhone = () => {
    Linking.openURL('tel:+5725550123').catch(() => {
      setToast({ visible: true, message: 'No se pudo realizar la llamada', type: 'error' });
    });
  };

  const handleSubmitContact = () => {
    if (!contactForm.name || !contactForm.email || !contactForm.subject) {
      setToast({ visible: true, message: 'Por favor completa todos los campos requeridos', type: 'error' });
      return;
    }
    setToast({ visible: true, message: 'Mensaje enviado correctamente. Te responderemos pronto.', type: 'success' });
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  const filteredFAQs = faqData.map(category => ({
    ...category,
    items: category.items.filter(
      item =>
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.items.length > 0);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Centro de Ayuda',
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerBackTitle: '',
        }}
      />
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={() => setToast({ ...toast, visible: false })}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          <View style={styles.hero}>
            <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
              ¿En qué podemos ayudarte hoy?
            </Text>
            <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Search size={20} color={colors.textSecondary} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Buscar en la ayuda..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <View style={styles.contactOptions}>
            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: colors.surface }]}
              onPress={handleChat}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#4F46E5' }]}>
                <MessageCircle size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Chat en Vivo</Text>
              <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                Chatea con nuestro equipo
              </Text>
              <TouchableOpacity style={styles.contactButton} onPress={handleChat}>
                <Text style={styles.contactButtonText}>Iniciar Chat</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: colors.surface }]}
              onPress={handleEmail}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#10B981' }]}>
                <Mail size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Email</Text>
              <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                soporte@buscofacil.com
              </Text>
              <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
                <Text style={styles.contactButtonText}>Enviar Email</Text>
              </TouchableOpacity>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.contactCard, { backgroundColor: colors.surface }]}
              onPress={handlePhone}
            >
              <View style={[styles.contactIcon, { backgroundColor: '#8B5CF6' }]}>
                <Phone size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.contactTitle, { color: colors.textPrimary }]}>Teléfono</Text>
              <Text style={[styles.contactSubtitle, { color: colors.textSecondary }]}>
                +57 (2) 555 0123
              </Text>
              <TouchableOpacity style={styles.contactButton} onPress={handlePhone}>
                <Text style={styles.contactButtonText}>Llamar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          <View style={styles.faqSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Preguntas Frecuentes</Text>

            {(searchQuery ? filteredFAQs : faqData).map((category, categoryIndex) => (
              <View key={categoryIndex} style={styles.categoryContainer}>
                <TouchableOpacity
                  style={[styles.categoryHeader, { backgroundColor: colors.surface }]}
                  onPress={() => toggleCategory(categoryIndex)}
                >
                  <Text style={[styles.categoryTitle, { color: colors.textPrimary }]}>
                    {category.title}
                  </Text>
                  {expandedCategories.includes(categoryIndex) ? (
                    <ChevronUp size={20} color={colors.textPrimary} />
                  ) : (
                    <ChevronDown size={20} color={colors.textPrimary} />
                  )}
                </TouchableOpacity>

                {expandedCategories.includes(categoryIndex) && (
                  <View style={[styles.categoryContent, { backgroundColor: colors.surface }]}>
                    {category.items.map((item, questionIndex) => (
                      <View key={questionIndex}>
                        <TouchableOpacity
                          style={styles.questionHeader}
                          onPress={() => toggleQuestion(categoryIndex, questionIndex)}
                        >
                          <Text style={[styles.questionText, { color: colors.textPrimary }]}>
                            {item.question}
                          </Text>
                          {expandedQuestions.includes(`${categoryIndex}-${questionIndex}`) ? (
                            <ChevronUp size={16} color={colors.textSecondary} />
                          ) : (
                            <ChevronDown size={16} color={colors.textSecondary} />
                          )}
                        </TouchableOpacity>

                        {expandedQuestions.includes(`${categoryIndex}-${questionIndex}`) && (
                          <Text style={[styles.answerText, { color: colors.textSecondary }]}>
                            {item.answer}
                          </Text>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>

          <View style={[styles.aboutSection, { backgroundColor: colors.surface }]}>
            <View style={styles.aboutHeader}>
              <Info size={24} color={colors.primary} />
              <Text style={[styles.aboutTitle, { color: colors.textPrimary }]}>Acerca de</Text>
            </View>

            <View style={styles.aboutContent}>
              <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Aplicación</Text>
              <Text style={[styles.aboutValue, { color: colors.textPrimary }]}>Fácil Inmobiliaria</Text>
              <Text style={[styles.aboutDescription, { color: colors.textSecondary }]}>
                Tu asistente inteligente para encontrar el inmueble perfecto.
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutContent}>
              <View style={styles.developedByHeader}>
                <Code size={20} color={colors.textSecondary} />
                <Text style={[styles.aboutLabel, { color: colors.textSecondary }]}>Desarrollado por</Text>
              </View>
              <TouchableOpacity
                onPress={() => Linking.openURL('https://softnexus.io/')}
                style={styles.developerLink}
              >
                <Text style={styles.developerName}>Softnexus</Text>
                <View style={styles.dotsContainer}>
                  <View style={[styles.dot, styles.dotGreen]} />
                  <View style={[styles.dot, styles.dotCyan]} />
                  <View style={[styles.dot, styles.dotAmber]} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.legalSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.legalTitle, { color: colors.textPrimary }]}>Legal</Text>

            <TouchableOpacity
              style={[styles.legalButton, { borderColor: colors.border }]}
              onPress={() => setShowPrivacyModal(true)}
            >
              <Shield size={20} color={colors.primary} />
              <Text style={[styles.legalButtonText, { color: colors.textPrimary }]}>Política de Privacidad</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.legalButton, { borderColor: colors.border }]}
              onPress={() => setShowTermsModal(true)}
            >
              <FileText size={20} color={colors.primary} />
              <Text style={[styles.legalButtonText, { color: colors.textPrimary }]}>Términos y Condiciones</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.contactFormSection, { backgroundColor: colors.surface }]}>
            <Text style={[styles.formTitle, { color: colors.textPrimary }]}>
              ¿No encontraste lo que buscabas?
            </Text>
            <Text style={[styles.formSubtitle, { color: colors.textSecondary }]}>
              Envíanos un mensaje y te responderemos lo antes posible
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Nombre"
              placeholderTextColor={colors.textSecondary}
              value={contactForm.name}
              onChangeText={(text) => setContactForm({ ...contactForm, name: text })}
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={contactForm.email}
              onChangeText={(text) => setContactForm({ ...contactForm, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Asunto"
              placeholderTextColor={colors.textSecondary}
              value={contactForm.subject}
              onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
            />

            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              placeholder="Mensaje"
              placeholderTextColor={colors.textSecondary}
              value={contactForm.message}
              onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
              multiline
              numberOfLines={4}
            />

            <TouchableOpacity
              style={[styles.submitButton, { backgroundColor: colors.primary }]}
              onPress={handleSubmitContact}
            >
              <Text style={styles.submitButtonText}>Enviar Mensaje</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <PrivacyPolicyModal
        visible={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
      />

      <TermsModal
        visible={showTermsModal}
        onClose={() => setShowTermsModal(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: spacing.xl,
  },
  hero: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    width: '100%',
    borderWidth: 1,
    ...shadows.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
  },
  contactOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  contactCard: {
    minWidth: 140,
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.md,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  contactTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  contactSubtitle: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  contactButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  contactButtonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: '600',
    color: '#1E40AF',
  },
  faqSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  categoryContainer: {
    marginBottom: spacing.sm,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  categoryTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
  },
  categoryContent: {
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
    padding: spacing.md,
    ...shadows.sm,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  questionText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    fontWeight: '500',
  },
  answerText: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  contactFormSection: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  formSubtitle: {
    fontSize: typography.fontSize.sm,
    marginBottom: spacing.lg,
  },
  input: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  textArea: {
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSize.base,
    marginBottom: spacing.md,
    borderWidth: 1,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadows.md,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  aboutSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  aboutTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
  },
  aboutContent: {
    marginBottom: spacing.md,
  },
  aboutLabel: {
    fontSize: typography.fontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  aboutValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  aboutDescription: {
    fontSize: typography.fontSize.sm,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginVertical: spacing.md,
  },
  developedByHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  developerLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  developerName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: 'bold',
    color: '#48D271',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#48D271',
  },
  dotCyan: {
    backgroundColor: '#29C5F6',
  },
  dotAmber: {
    backgroundColor: '#FFC107',
  },
  footer: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    textAlign: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerLink: {
    fontSize: typography.fontSize.xs,
    textDecorationLine: 'underline',
  },
  footerDivider: {
    fontSize: typography.fontSize.xs,
  },
  legalSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.md,
  },
  legalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    marginBottom: spacing.md,
  },
  legalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  legalButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: '500',
  },
});
