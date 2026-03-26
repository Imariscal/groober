# 🚀 Testing Guide: Evolved Client Profile Integration

## Quick Start - Test in 5 Minutes

### 1. Start the Server
```bash
cd vibralive-frontend
npm run dev
```
✅ Server runs on `http://localhost:3000`

### 2. Navigate to Clients
- Click "Clientes" in sidebar
- Click "Nuevo Cliente" button

### 3. Look for 4 Color-Coded Sections:
- 🎨 **Blue** - Información Principal
- 🏠 **Amber** - Preferencias de Domicilio  
- 📱 **Violet** - **Contacto Avanzado** (NEW!)
- 💰 **Emerald** - Configuración Comercial

### 4. Test Advanced Contact Fields:
- ✅ Enter WhatsApp number
- ✅ Enter secondary phone
- ✅ Select `preferred_contact_method` (WhatsApp/Phone/Email/SMS)
- ✅ Set preferred contact hours (start/end time)
- ✅ Toggle "No Contactar" checkbox
- ✅ Type reason when toggle is ON
- ✅ Click Save

### 5. Open DevTools (F12)
- Go to **Network** tab
- Click the grey "Fetch/XHR" button to filter
- Save the client form
- Look for `POST /api/clients` request
- Click it and check **Payload** tab
- ✅ All fields should be present (including whatsapp_number, preferred_contact_method, etc.)

---

## Detailed Test Scenarios

### Scenario 1: Create New Client with All Fields

**Steps:**
1. Click "Nuevo Cliente"
2. Fill all sections:
   ```
   Información Principal:
   - Name: "Juan García García"
   - Phone: "+34 912 345 678"
   - Email: "juan@example.com"
   - WhatsApp: "+34 666 123 456"
   - Phone Secondary: "+34 912 987 654"
   - Address: "Calle Principal 123, Madrid"

   Preferencias de Domicilio:
   - Housing Type: "Departamento"
   - Access: "Portón rojo, departamento 3B, tocar timbre 2 veces"
   - Service Notes: "Perro pequeño, no le gusta estar solo, dar premio"

   Contacto Avanzado:
   - Preferred Contact Method: "WHATSAPP"
   - Start Time: "09:00"
   - End Time: "18:00"
   - Do Not Contact: ☐ (unchecked)

   Configuración Comercial:
   - Price List: "Por defecto de la clínica"
   ```
3. Click "Crear Cliente"
4. In DevTools Network, inspect `POST /api/clients` payload
5. Verify all fields are present

**Expected Result:**
- Client created successfully
- All fields shown in toast: "Cliente creado exitosamente"
- New client appears in table

---

### Scenario 2: Edit Existing Client

**Steps:**
1. Click on existing client in table
2. Click "Editar" button
3. Verify all fields pre-populate (including new ones)
4. Change WhatsApp number: "+34 666 999 888"
5. Change preferred_contact_method: "PHONE"
6. Clear End Time field (set to empty)
7. Click "Guardar Cambios"
8. Check Network tab for `PATCH /api/clients/{id}` payload

**Expected Result:**
- All changes persist
- Payload includes all fields (some with changed values, some with null)
- Client refreshes with new data

---

### Scenario 3: Toggle "Do Not Contactar"

**Steps:**
1. Create or edit a client
2. Scroll to "Contacto Avanzado" section
3. Leave "Do Not Contactar" ☐ **unchecked**
4. ✅ Verify "Razón de Bloqueo" textarea DOES NOT appear
5. Check "Do Not Contactar" ☑️
6. ✅ Verify "Razón de Bloqueo" textarea **appears**
7. Type: "Cliente bloqueado por comportamiento inapropiado"
8. Try to save without entering reason text:
   - ⚠️ Should show error (under development)
9. Uncheck "Do Not Contactar" ☐
10. ✅ Verify "Razón de Bloqueo" textarea **disappears**

**Expected Result:**
- Conditional field visibility works correctly
- Form requires reason when toggle is ON
- Form clears reason when toggle is OFF

---

### Scenario 4: Housing Type Selection

**Steps:**
1. Edit client profile or create new
2. Scroll to "Preferencias de Domicilio"
3. Click housing_type dropdown
4. ✅ Verify options are ONLY:
   - Seleccionar...
   - 🏡 Casa
   - 🏢 Departamento  
   - ❓ Otro
5. ❌ Verify "🏬 Comercial" is **NOT** present
6. Select "Casa"
7. Save

**Expected Result:**
- Only 3 housing types available (COMMERCIAL removed)
- Selection saves and persists on edit

---

### Scenario 5: Edit Mode Field Persistence

**Steps:**
1. Create client with name "Test Client"
2. Don't fill WhatsApp or other new fields
3. Click Save
4. Immediately re-open the client for edit
5. Scroll to "Contacto Avanzado"
6. ✅ All fields should be empty (but still visible in edit mode)
7. Modify:
   - WhatsApp: "+34 666 111 222"
   - Preferred Contact: "EMAIL"
8. Save
9. Re-open for edit again
10. ✅ Verify WhatsApp and Preferred Contact persisted

**Expected Result:**
- Fields round-trip to database correctly
- formData initialization loads all fields
- Changes persist between edits

---

### Scenario 6: Null Value Handling

**Steps:**
1. Create client with all fields populated
2. Save successfully
3. Re-open for edit
4. Clear WhatsApp field (set to empty)
5. Clear secondary phone (set to empty)
6. Clear access notes (set to empty)
7. Uncheck "Do Not Contactar" if it was checked
8. Save
9. In DevTools Network, check PATCH payload
10. ✅ Verify cleared fields show as `null` in payload (not `undefined`)

**Expected Result:**
```json
{
  "whatsapp_number": null,
  "phone_secondary": null,
  "access_notes": null,
  "do_not_contact": null,
  // ... other fields ...
}
```

---

### Scenario 7: Time Input Validation

**Steps:**
1. Scroll to "Contacto Avanzado" section
2. Set Start Time: "09:00"
3. Set End Time: "08:00" (earlier than start)
   - ⚠️ Note: Currently accepts this (no validation)
   - Future enhancement: Should reject or show warning
4. Set Start Time: "09:00"
5. Set End Time: "17:30" (later than start)
   - ✅ Should accept
6. Clear Start Time, keep End Time: "17:30"
   - ✅ Should accept (partial times OK)
7. Save and verify both values persist

**Expected Result:**
- Time inputs work correctly
- Time range validation not enforced (future enhancement)
- Partial times accepted

---

### Scenario 8: Price List Selection

**Steps:**
1. Create new client
2. Scroll to "Configuración Comercial"
3. ✅ Verify "Por defecto de la clínica" option visible
4. Select custom price list if available
5. Check border becomes blue (selected state)
6. See "Activo" badge on selected option
7. Switch back to default option
8. Save
9. Re-open to verify selection persisted

**Expected Result:**
- Price list selector is functional
- Visual states clear (selected vs unselected)
- Defaults work correctly
- Selection persists

---

## Browser DevTools Inspection

### Network Tab Payload Inspection

**When creating client**, expect **POST /api/clients** with:
```json
{
  "name": "..." (required, string),
  "phone": "..." (required, string),
  "email": "..." (string or null),
  "address": "..." (string or null),
  "notes": "..." (string or null),
  "price_list_id": "..." (string or null),
  "whatsapp_number": "..." (string or null),
  "phone_secondary": "..." (string or null),
  "preferred_contact_method": "WHATSAPP|PHONE|EMAIL|SMS|null",
  "preferred_contact_time_start": "HH:MM" (string or null),
  "preferred_contact_time_end": "HH:MM" (string or null),
  "housing_type": "HOUSE|APARTMENT|OTHER|null",
  "access_notes": "..." (string or null),
  "service_notes": "..." (string or null),
  "do_not_contact": boolean|null,
  "do_not_contact_reason": "..." (string or null),
  "status": "ACTIVE|INACTIVE|ARCHIVED|BLACKLISTED|null"
}
```

**When editing client**, expect **PATCH /api/clients/{id}** with:
- Subset of above fields (only changed ones)
- Same structure and types

### Console Inspector

Check for TypeScript errors:
```javascript
// Should see NO errors like:
// "Property 'whatsapp_number' does not exist on type 'Client'"
// "Cannot assign 'undefined' to type 'string | null'"

// If you see these, something is still misconfigured
```

---

## Common Issues & Troubleshooting

### Issue: "Contacto Avanzado" section not visible

**Check:**
1. ✅ Server restarted after git pull
2. ✅ Browser cache cleared (Ctrl+Shift+Del, check "All time")
3. ✅ No TypeScript errors in console (F12)
4. ✅ Check [SESSION_FINAL_SUMMARY.md](SESSION_FINAL_SUMMARY.md) - section was added

**Solution:**
- Hard refresh: `Ctrl+F5`
- Close DevTools: `F12`
- Restart server: `npm run dev`

---

### Issue: Fields don't persist when re-opening edit

**Check:**
1. ✅ useEffect in ClientFormModal reloaded all 13 fields (lines 90-130)
2. ✅ formData initialization includes all fields (lines 55-75)
3. ✅ API response includes all fields (check Network tab response)

**Solution:**
- Check Network tab response: does client object have whatsapp_number?
- Verify backend is returning all fields
- Check browser console for errors

---

### Issue: Form validation errors when saving

**Check:**
1. ✅ Name field has minimum 3 characters
2. ✅ Phone field matches regex `/^\+?[0-9\s\-()]{7,20}$/`
3. ✅ Email field (if filled) matches basic email format
4. ✅ If do_not_contact=true, reason field must have value

**Solution:**
- Check ClientFormModal.tsx validateField() function (lines 185-220)
- Ensure all required fields filled
- For do_not_contact_reason, check it only validates when parent is true

---

### Issue: Network request missing new fields

**Check:**
1. ✅ formData initialization has all 13 new fields
2. ✅ onChange handlers update formData correctly
3. ✅ handleSubmit sends formData as-is
4. ✅ API client sends axios.post(url, payload)

**Solution:**
- Log formData in browser console before submit
- Verify all fields are in formData
- Check Network tab "Payload" tab in request
- Ensure fields are not being filtered out

---

### Issue: TypeScript build errors

**Check:**
1. Run `npm run build`
2. Look for errors mentioning:
   - "Property '...' does not exist"
   - "Cannot assign"
   - "housing_type"

**Solution:**
- Check [src/types/index.ts](src/types/index.ts) lines 135-185
- Verify housing_type excludes COMMERCIAL
- Verify all 13 new fields present
- Run `npm install` if any files corrupted

---

## Performance Checklist

After testing, verify:

- [ ] Page loads in < 2 seconds
- [ ] Form sections scroll smoothly
- [ ] No console warnings (except @next/font warning)
- [ ] Network requests complete < 500ms
- [ ] State updates don't cause re-render lag
- [ ] Conditional rendering (do_not_contact) instant

---

## Final Verification Checklist

Print this and check off as you test:

```
🎨 Información Principal
⬜ Name input works
⬜ Phone input works  
⬜ Email input works
⬜ WhatsApp input works
⬜ Secondary Phone input works
⬜ Address input works

🏠 Preferencias de Domicilio
⬜ Housing Type dropdown shows 3 options only
⬜ COMMERCIAL option NOT present
⬜ Access Notes textarea works
⬜ Service Notes textarea works

📱 Contacto Avanzado (NEW)
⬜ Section visible in form
⬜ Preferred Contact Method dropdown works
⬜ Start Time picker works
⬜ End Time picker works
⬜ Do Not Contact toggle visible
⬜ Reason field visible when toggle ON
⬜ Reason field hidden when toggle OFF

💰 Comercación Comercial
⬜ Price list selector visible
⬜ Default option selectable
⬜ Custom price lists selectable  
⬜ "Activo" badge appears

🔄 Form Operations
⬜ Create client saves all fields
⬜ Edit client loads all fields
⬜ Field changes persist
⬜ Null values sent correctly
⬜ Form validation works

📊 Network Verification
⬜ POST payload has 13 new fields
⬜ PATCH payload includes all fields
⬜ No undefined values (only null)
⬜ HTTP status 200/201 on success
⬜ Response includes all fields
```

---

## Next Steps After Testing

1. **If All Tests Pass ✅**
   - Deploy to staging environment
   - Run backend integration tests
   - Test with real database data
   - Queue for production deployment

2. **If Tests Fail ❌**
   - Check CommonIssues section above
   - Review [SESSION_FINAL_SUMMARY.md](SESSION_FINAL_SUMMARY.md) for what was changed
   - Verify all 3 modified files saved correctly
   - Ask for clarification on specific error

3. **For Backend Team**
   - Share [FULL_STACK_INTEGRATION_COMPLETE.md](FULL_STACK_INTEGRATION_COMPLETE.md)
   - Verify API returns all 13 fields
   - Test PATCH endpoint with partial payloads
   - Confirm database migrations applied

---

## Resources

- **Architecture Doc**: [FULL_STACK_INTEGRATION_COMPLETE.md](FULL_STACK_INTEGRATION_COMPLETE.md)
- **Session Summary**: [SESSION_FINAL_SUMMARY.md](SESSION_FINAL_SUMMARY.md)
- **Type Definitions**: [src/types/index.ts](src/types/index.ts)
- **Form Modal**: [src/components/ClientFormModal.tsx](src/components/ClientFormModal.tsx)
- **General Tab**: [src/components/ClientGeneralTab.tsx](src/components/ClientGeneralTab.tsx)

---

## Questions?

If anything is unclear or not working as expected:

1. Check the relevant section in this guide
2. Consult [SESSION_FINAL_SUMMARY.md](SESSION_FINAL_SUMMARY.md) for what was changed
3. Review the type definitions to understand field requirements
4. Inspect DevTools Network tab to verify payloads
5. Check browser console for TypeScript/runtime errors

**Status: READY FOR TESTING** ✅
