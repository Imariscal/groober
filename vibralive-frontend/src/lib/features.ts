/**
 * Feature Flags Configuration
 * Controls rollout of the evolved client profile system
 */

/**
 * Feature flags for the client profile evolution
 * These allow gradual rollout and can be controlled via environment variables
 */
export const featureFlags = {
  // Client Preferences System
  ENABLE_CLIENT_PREFERENCES: process.env.NEXT_PUBLIC_ENABLE_CLIENT_PREFERENCES === 'true',
  
  // Client Tags System
  ENABLE_CLIENT_TAGS: process.env.NEXT_PUBLIC_ENABLE_CLIENT_TAGS === 'true',
  
  // Grooming-specific features
  ENABLE_GROOMING_FEATURES: process.env.NEXT_PUBLIC_ENABLE_GROOMING_FEATURES === 'true',
  
  // WhatsApp integration
  ENABLE_WHATSAPP_INTEGRATION: process.env.NEXT_PUBLIC_ENABLE_WHATSAPP_INTEGRATION === 'true',
};

/**
 * Check if a feature is enabled
 * @param feature - Feature flag name
 * @returns Whether the feature is enabled
 */
export function isFeatureEnabled(feature: keyof typeof featureFlags): boolean {
  return featureFlags[feature] ?? false;
}

/**
 * Feature descriptions for debugging and documentation
 */
export const featureDescriptions = {
  ENABLE_CLIENT_PREFERENCES:
    'Permite gestionar preferencias de contacto, horarios y tipo de vivienda del cliente',
  ENABLE_CLIENT_TAGS:
    'Habilita el sistema de etiquetado para segmentación y organización de clientes',
  ENABLE_GROOMING_FEATURES:
    'Activa características específicas para servicios de grooming de mascotas',
  ENABLE_WHATSAPP_INTEGRATION:
    'Integración con WhatsApp para comunicación directa y preferencias de contacto',
};

/**
 * Feature rollout strategy (for documentation and tracking)
 */
export const rolloutStrategy = {
  phase: process.env.NEXT_PUBLIC_ROLLOUT_PHASE || 'beta',
  targetAudience: process.env.NEXT_PUBLIC_ROLLOUT_AUDIENCE || 'internal',
  releaseDate: process.env.NEXT_PUBLIC_RELEASE_DATE || 'TBD',
};

/**
 * Get all enabled features for debugging
 */
export function getEnabledFeatures(): Array<{
  name: string;
  enabled: boolean;
  description: string;
}> {
  return Object.entries(featureFlags).map(([name, enabled]) => ({
    name,
    enabled,
    description: featureDescriptions[name as keyof typeof featureDescriptions] || 'No description',
  }));
}

/**
 * Log feature flags for debugging (only in development)
 */
export function logFeatureFlags(): void {
  if (process.env.NODE_ENV === 'development') {
    console.group('[Feature Flags]');
    getEnabledFeatures().forEach(({ name, enabled, description }) => {
      const status = enabled ? '✅' : '❌';
      console.log(`${status} ${name}: ${description}`);
    });
    console.log(`Rollout Phase: ${rolloutStrategy.phase} | Audience: ${rolloutStrategy.targetAudience}`);
    console.groupEnd();
  }
}
