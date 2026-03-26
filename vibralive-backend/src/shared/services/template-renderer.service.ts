import { Injectable, BadRequestException } from '@nestjs/common';

/**
 * TemplateRendererService - Shared variable rendering engine
 * 
 * Supports both message_templates (event-driven) and campaign_templates (bulk send).
 * Handles variable detection, validation, and replacement.
 * 
 * Supported variables:
 * - Client: {{clientName}}, {{clientEmail}}, {{clientPhone}}, {{clientFirstName}}
 * - Pet: {{petName}}, {{petBreed}}, {{petAge}}, {{petSpecies}}, {{petSize}}, {{petSterilized}}
 * - Service: {{serviceName}}, {{servicePrice}}, {{stylistName}}
 * - Appointment: {{appointmentDate}}, {{appointmentTime}}, {{appointmentStatus}}
 * - Clinic: {{clinicName}}, {{clinicPhone}}, {{clinicAddress}}, {{clinicCity}}, {{clinicCountry}}
 * - Links: {{confirmationLink}}, {{cancellationLink}}, {{reviewLink}}, {{unsubscribeLink}}
 */
@Injectable()
export class TemplateRendererService {
  // All supported variable names
  private readonly SUPPORTED_VARIABLES = [
    // Client variables
    'clientName',
    'clientFirstName',
    'clientLastName',
    'clientEmail',
    'clientPhone',

    // Pet variables
    'petName',
    'petBreed',
    'petAge',
    'petSpecies',
    'petSize',
    'petSterilized',
    'petColor',
    'petWeight',

    // Service variables
    'serviceName',
    'servicePrice',
    'stylistName',

    // Appointment variables
    'appointmentDate',
    'appointmentTime',
    'appointmentStatus',
    'appointmentId',

    // Clinic variables
    'clinicName',
    'clinicPhone',
    'clinicAddress',
    'clinicCity',
    'clinicCountry',
    'clinicEmail',

    // Links
    'confirmationLink',
    'cancellationLink',
    'reviewLink',
    'unsubscribeLink',

    // Special variables
    'currentDate',
    'currentTime',
  ];

  /**
   * Detects all variables in a template string
   * Variables are in format: {{variableName}}
   * 
   * @returns Array of unique variable names found
   */
  detectVariables(template: string): string[] {
    if (!template) return [];

    const variableRegex = /\{\{(\w+)\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = variableRegex.exec(template)) !== null) {
      variables.add(match[1]);
    }

    return Array.from(variables);
  }

  /**
   * Validates that all variables in template are supported
   * @throws BadRequestException if unsupported variables found
   */
  validateVariables(template: string): void {
    const variables = this.detectVariables(template);
    const unsupported = variables.filter(
      (v) => !this.SUPPORTED_VARIABLES.includes(v),
    );

    if (unsupported.length > 0) {
      throw new BadRequestException(
        `Unsupported variables: ${unsupported.join(', ')}. Supported: ${this.SUPPORTED_VARIABLES.join(', ')}`,
      );
    }
  }

  /**
   * Replaces variables in template with values from context
   * 
   * @param template - Template string with {{variables}}
   * @param context - Object with variable values
   * @returns Rendered string with variables replaced
   */
  render(template: string, context: Record<string, any>): string {
    if (!template) return '';

    let result = template;
    const variables = this.detectVariables(template);

    for (const variable of variables) {
      const value = context[variable];
      const placeholder = `{{${variable}}}`;

      if (value === undefined || value === null) {
        // Leave placeholder if value not provided
        // This allows partial rendering for preview
        result = result.replace(new RegExp(placeholder, 'g'), '');
      } else {
        // Convert to string and escape special characters
        const stringValue = String(value).replace(/[&<>"']/g, (char) => {
          const escapeMap: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          };
          return escapeMap[char];
        });

        result = result.replace(new RegExp(placeholder, 'g'), stringValue);
      }
    }

    return result;
  }

  /**
   * Generates a preview of a template with sample data
   * Useful for template editors to show how variables will be rendered
   * 
   * @param template - Template string
   * @returns Preview with sample data filled in
   */
  preview(template: string): string {
    const sampleContext: Record<string, string> = {
      clientName: 'Juan Pérez',
      clientFirstName: 'Juan',
      clientLastName: 'Pérez',
      clientEmail: 'juan@example.com',
      clientPhone: '+52 5555555555',

      petName: 'Firulais',
      petBreed: 'Golden Retriever',
      petAge: '3 años',
      petSpecies: 'Perro',
      petSize: 'Grande',
      petSterilized: 'Sí',
      petColor: 'Dorado',
      petWeight: '30 kg',

      serviceName: 'Baño y Corte',
      servicePrice: '$500.00',
      stylistName: 'María García',

      appointmentDate: '15 de marzo de 2026',
      appointmentTime: '10:00 AM',
      appointmentStatus: 'Confirmada',
      appointmentId: 'APT-001',

      clinicName: 'Clínica Veterinaria VibraLive',
      clinicPhone: '+52 5555555555',
      clinicAddress: 'Calle Principal 123, México',
      clinicCity: 'Ciudad de México',
      clinicCountry: 'México',
      clinicEmail: 'info@vibralive.com',

      confirmationLink: 'https://app.vibralive.com/confirm/abc123',
      cancellationLink: 'https://app.vibralive.com/cancel/abc123',
      reviewLink: 'https://app.vibralive.com/review/abc123',
      unsubscribeLink: 'https://app.vibralive.com/unsubscribe',

      currentDate: new Date().toLocaleDateString('es-MX'),
      currentTime: new Date().toLocaleTimeString('es-MX'),
    };

    return this.render(template, sampleContext);
  }

  /**
   * Gets the list of all supported variables with descriptions
   */
  getSupportedVariables(): Array<{
    name: string;
    category: string;
    description: string;
  }> {
    const descriptions: Record<string, { category: string; description: string }> = {
      clientName: { category: 'Cliente', description: 'Nombre completo del cliente' },
      clientFirstName: { category: 'Cliente', description: 'Primer nombre' },
      clientLastName: { category: 'Cliente', description: 'Apellido' },
      clientEmail: { category: 'Cliente', description: 'Correo electrónico' },
      clientPhone: { category: 'Cliente', description: 'Número de teléfono' },

      petName: { category: 'Mascota', description: 'Nombre de la mascota' },
      petBreed: { category: 'Mascota', description: 'Raza' },
      petAge: { category: 'Mascota', description: 'Edad' },
      petSpecies: { category: 'Mascota', description: 'Especie (Perro, Gato, etc.)' },
      petSize: { category: 'Mascota', description: 'Tamaño' },
      petSterilized: { category: 'Mascota', description: 'Estado de esterilización' },
      petColor: { category: 'Mascota', description: 'Color' },
      petWeight: { category: 'Mascota', description: 'Peso' },

      serviceName: { category: 'Servicio', description: 'Nombre del servicio' },
      servicePrice: { category: 'Servicio', description: 'Precio formateado' },
      stylistName: { category: 'Servicio', description: 'Nombre del estilista' },

      appointmentDate: {
        category: 'Cita',
        description: 'Fecha de la cita',
      },
      appointmentTime: { category: 'Cita', description: 'Hora de la cita' },
      appointmentStatus: {
        category: 'Cita',
        description: 'Estado de la cita',
      },
      appointmentId: { category: 'Cita', description: 'ID de la cita' },

      clinicName: { category: 'Clínica', description: 'Nombre de la clínica' },
      clinicPhone: { category: 'Clínica', description: 'Teléfono' },
      clinicAddress: { category: 'Clínica', description: 'Dirección completa' },
      clinicCity: { category: 'Clínica', description: 'Ciudad' },
      clinicCountry: { category: 'Clínica', description: 'País' },
      clinicEmail: { category: 'Clínica', description: 'Correo electrónico' },

      confirmationLink: {
        category: 'Enlaces',
        description: 'Enlace para confirmar cita',
      },
      cancellationLink: {
        category: 'Enlaces',
        description: 'Enlace para cancelar cita',
      },
      reviewLink: { category: 'Enlaces', description: 'Enlace para dejar reseña' },
      unsubscribeLink: {
        category: 'Enlaces',
        description: 'Enlace para darse de baja',
      },

      currentDate: { category: 'Sistema', description: 'Fecha actual' },
      currentTime: { category: 'Sistema', description: 'Hora actual' },
    };

    return this.SUPPORTED_VARIABLES.map((variable) => {
      const desc = descriptions[variable] || { category: 'Otro', description: '' };
      return {
        name: variable,
        ...desc,
      };
    });
  }

  /**
   * Validates a complete context object for rendering
   * Returns warnings for missing variables that appear in template
   */
  validateContext(
    template: string,
    context: Record<string, any>,
  ): {
    valid: boolean;
    missing: string[];
    warnings: string[];
  } {
    const variables = this.detectVariables(template);
    const missing = variables.filter((v) => !context[v]);

    const warnings: string[] = [];

    if (missing.length > 0) {
      warnings.push(
        `Faltan valores para: ${missing.join(', ')}. Se renderizarán como vacías.`,
      );
    }

    return {
      valid: true,
      missing,
      warnings,
    };
  }
}
