'use client';

import { useState } from 'react';

interface DemoFormData {
  nombre: string;
  email: string;
  telefono: string;
}

interface FormTouched {
  nombre: boolean;
  email: boolean;
  telefono: boolean;
}

interface FormErrors {
  nombre: string;
  email: string;
  telefono: string;
}

export function DemoRequestForm() {
  const [formData, setFormData] = useState<DemoFormData>({
    nombre: '',
    email: '',
    telefono: '',
  });
  const [touched, setTouched] = useState<FormTouched>({
    nombre: false,
    email: false,
    telefono: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  // Validaciones
  const validateField = (name: keyof DemoFormData, value: string): string => {
    switch (name) {
      case 'nombre':
        if (!value.trim()) return 'El nombre es obligatorio';
        if (value.trim().length < 3) return 'El nombre debe tener al menos 3 caracteres';
        return '';
      
      case 'email':
        if (!value.trim()) return 'El correo es obligatorio';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) return 'Ingresa un correo válido';
        return '';
      
      case 'telefono':
        if (!value.trim()) return 'El teléfono es obligatorio';
        const phoneRegex = /^[0-9\+\-\(\)\s]{7,}$/;
        if (!phoneRegex.test(value)) return 'Ingresa un teléfono válido';
        return '';
      
      default:
        return '';
    }
  };

  // Calcular errores
  const errors: FormErrors = {
    nombre: validateField('nombre', formData.nombre),
    email: validateField('email', formData.email),
    telefono: validateField('telefono', formData.telefono),
  };

  // Determinar si mostrar error (solo si fue tocado)
  const showError = (field: keyof FormErrors): boolean => {
    return touched[field] && !!errors[field];
  };

  // Determinar si el formulario es válido
  const isFormValid =
    formData.nombre.trim() !== '' &&
    formData.email.trim() !== '' &&
    formData.telefono.trim() !== '' &&
    !errors.nombre &&
    !errors.email &&
    !errors.telefono;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched(prev => ({
      ...prev,
      [name]: true,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marcar todos los campos como tocados
    setTouched({
      nombre: true,
      email: true,
      telefono: true,
    });

    // Validar que no haya errores
    if (errors.nombre || errors.email || errors.telefono) {
      setSubmitMessage('Por favor completa todos los campos correctamente');
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitMessage('¡Gracias! Pronto nos pondremos en contacto contigo.');
        setFormData({ nombre: '', email: '', telefono: '' });
        setTouched({ nombre: false, email: false, telefono: false });
      } else {
        setSubmitMessage('Hubo un error. Por favor intenta de nuevo.');
      }
    } catch (error) {
      console.error('Error:', error);
      setSubmitMessage('Hubo un error. Por favor intenta de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Nombre */}
      <div>
        <label htmlFor="nombre" className="block text-sm font-medium text-gray-700 mb-2">
          Nombre Completo <span className="text-red-500">*</span>
        </label>
        <input
          id="nombre"
          name="nombre"
          type="text"
          value={formData.nombre}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Tu nombre"
          className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
            showError('nombre')
              ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          }`}
        />
        {showError('nombre') && (
          <p className="text-red-500 text-xs mt-1">{errors.nombre}</p>
        )}
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          Correo Electrónico <span className="text-red-500">*</span>
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="tu@clinica.com"
          className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
            showError('email')
              ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          }`}
        />
        {showError('email') && (
          <p className="text-red-500 text-xs mt-1">{errors.email}</p>
        )}
      </div>

      {/* Teléfono */}
      <div>
        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 mb-2">
          Teléfono <span className="text-red-500">*</span>
        </label>
        <input
          id="telefono"
          name="telefono"
          type="tel"
          value={formData.telefono}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="+34 600 123 456"
          className={`w-full px-4 py-2 border rounded-lg outline-none transition ${
            showError('telefono')
              ? 'border-red-500 bg-red-50 focus:ring-2 focus:ring-red-500 focus:border-red-500'
              : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
          }`}
        />
        {showError('telefono') && (
          <p className="text-red-500 text-xs mt-1">{errors.telefono}</p>
        )}
      </div>

      {/* Mensaje de respuesta */}
      {submitMessage && (
        <div className={`p-3 rounded-lg text-sm text-center ${
          submitMessage.includes('Gracias') 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          {submitMessage}
        </div>
      )}

      {/* Botón Enviar */}
      <button
        type="submit"
        disabled={!isFormValid || isSubmitting}
        className={`w-full font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2 text-white ${
          !isFormValid || isSubmitting
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
        {!isSubmitting && <span>→</span>}
      </button>
    </form>
  );
}
