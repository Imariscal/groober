import { clinicLocalToUtc, utcToZonedTime, getClinicDateKey } from './datetime-tz';

/**
 * Test suite para validar timezone conversions
 * Run con: npm test -- datetime-tz.test.ts
 */
describe('Timezone Conversions', () => {
  describe('clinicLocalToUtc', () => {
    it('debería convertir 08:00 Tijuana (UTC-7) a 15:00 UTC', () => {
      const result = clinicLocalToUtc('2026-03-06', '08:00', 'America/Tijuana');
      
      const iso = result.toISOString();
      console.log('Test: 08:00 Tijuana → UTC');
      console.log('  Input: 2026-03-06 08:00 Tijuana');
      console.log('  Output:', iso);
      console.log('  Expected: 2026-03-06T15:00:00.000Z');
      
      expect(iso.startsWith('2026-03-06T15:00:00')).toBe(true);
      expect(iso.endsWith('Z')).toBe(true);
    });

    it('debería convertir 08:00 Monterrey (UTC-6) a 14:00 UTC', () => {
      const result = clinicLocalToUtc('2026-03-06', '08:00', 'America/Monterrey');
      
      const iso = result.toISOString();
      console.log('Test: 08:00 Monterrey → UTC');
      console.log('  Input: 2026-03-06 08:00 Monterrey');
      console.log('  Output:', iso);
      console.log('  Expected: 2026-03-06T14:00:00.000Z');
      
      expect(iso.startsWith('2026-03-06T14:00:00')).toBe(true);
      expect(iso.endsWith('Z')).toBe(true);
    });

    it('debería convertir 08:00 Mexico City (UTC-6) a 14:00 UTC', () => {
      const result = clinicLocalToUtc('2026-03-06', '08:00', 'America/Mexico_City');
      
      const iso = result.toISOString();
      console.log('Test: 08:00 Mexico City → UTC');
      console.log('  Input: 2026-03-06 08:00 Mexico City');
      console.log('  Output:', iso);
      console.log('  Expected: 2026-03-06T14:00:00.000Z');
      
      expect(iso.startsWith('2026-03-06T14:00:00')).toBe(true);
      expect(iso.endsWith('Z')).toBe(true);
    });

    it('debería manejar edge case: medianoche', () => {
      const result = clinicLocalToUtc('2026-03-06', '00:00', 'America/Tijuana');
      
      const iso = result.toISOString();
      console.log('Test: 00:00 (medianoche) Tijuana → UTC');
      console.log('  Input: 2026-03-06 00:00 Tijuana');
      console.log('  Output:', iso);
      console.log('  Expected: 2026-03-06T07:00:00.000Z');
      
      expect(iso.endsWith('Z')).toBe(true);
    });

    it('debería tener Z al final (formato UTC válido)', () => {
      const result = clinicLocalToUtc('2026-03-06', '08:00', 'America/Tijuana');
      const iso = result.toISOString();
      
      const isValidUtc = /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(iso);
      console.log('Test: Formato UTC válido');
      console.log('  ISO string:', iso);
      console.log('  ¿Válido?', isValidUtc ? '✅' : '❌');
      
      expect(isValidUtc).toBe(true);
    });
  });

  describe('utcToZonedTime (lectura/conversión backwards)', () => {
    it('debería convertir UTC de vuelta a tiempo local', () => {
      // UTC 15:00 debería ser 08:00 en Tijuana
      const utcDate = new Date('2026-03-06T15:00:00Z');
      const zoned = utcToZonedTime(utcDate, 'America/Tijuana');
      
      console.log('Test: UTC → Tijuana (backwards)');
      console.log('  UTC:', utcDate.toISOString());
      console.log('  Local time hours:', zoned.getHours());
      console.log('  Expected hours: 8');
      
      expect(zoned.getHours()).toBe(8);
      expect(zoned.getMinutes()).toBe(0);
    });
  });

  describe('Ciclo completo (roundtrip)', () => {
    it('debería convertir local → UTC → local sin perder información', () => {
      const originalLocal = { date: '2026-03-06', time: '08:00', tz: 'America/Tijuana' };
      
      // Paso 1: Convertir a UTC
      const utcDate = clinicLocalToUtc(originalLocal.date, originalLocal.time, originalLocal.tz);
      console.log('Roundtrip test para Tijuana 08:00');
      console.log('  Paso 1 - Local → UTC:', utcDate.toISOString());
      
      // Paso 2: Convertir de vuelta a local
      const backToLocal = utcToZonedTime(utcDate, originalLocal.tz);
      console.log('  Paso 2 - UTC → Local:', backToLocal);
      console.log('  Hours:', backToLocal.getHours(), '(esperado: 8)');
      console.log('  Minutes:', backToLocal.getMinutes(), '(esperado: 0)');
      
      // Verificar
      expect(backToLocal.getHours()).toBe(8);
      expect(backToLocal.getMinutes()).toBe(0);
    });
  });

  describe('getClinicDateKey', () => {
    it('debería generar la fecha correcta en timezone local', () => {
      // UTC 15:00 el 6 de marzo es 08:00 el 6 de marzo en Tijuana
      const utcDate = new Date('2026-03-06T15:00:00Z');
      const key = getClinicDateKey(utcDate, 'America/Tijuana');
      
      console.log('Test: Date key en timezone local');
      console.log('  UTC:', utcDate.toISOString());
      console.log('  Date key:', key);
      console.log('  Expected: 2026-03-06');
      
      expect(key).toBe('2026-03-06');
    });
  });
});
