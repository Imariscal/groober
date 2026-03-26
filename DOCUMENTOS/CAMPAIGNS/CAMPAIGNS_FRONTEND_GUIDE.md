@@@# VibraLive Campaigns Module - Frontend Implementation Guide

**Date**: March 9, 2026  
**Status**: Production Ready  
**Framework**: Angular + TypeScript + TailwindCSS

---

## 📁 Frontend Folder Structure

```
vibralive-frontend/src/app/(protected)/clinic/communications/campaigns/
├── pages/
│   ├── campaign-list/
│   │   ├── campaign-list.component.ts
│   │   ├── campaign-list.component.html
│   │   └── campaign-list.component.css
│   ├── campaign-builder/
│   │   ├── campaign-builder.component.ts
│   │   ├── campaign-builder.component.html
│   │   ├── steps/
│   │   │   ├── step1-template.component.ts
│   │   │   ├── step2-filters.component.ts
│   │   │   ├── step3-preview.component.ts
│   │   │   └── step4-schedule.component.ts
│   │   └── campaign-builder.component.css
│   ├── campaign-detail/
│   │   ├── campaign-detail.component.ts
│   │   ├── campaign-detail.component.html
│   │   └── campaign-detail.component.css
│   └── template-manager/
│       ├── template-manager.component.ts
│       ├── template-manager.component.html
│       └── template-manager.component.css
├── components/
│   ├── campaign-metrics/
│   │   ├── campaign-metrics.component.ts
│   │   └── campaign-metrics.component.html
│   ├── filter-builder/
│   │   ├── filter-builder.component.ts
│   │   ├── filter-builder.component.html
│   │   └── filter-builder.component.css
│   ├── recipient-list/
│   │   ├── recipient-list.component.ts
│   │   └── recipient-list.component.html
│   └── template-editor/
│       ├── template-editor.component.ts
│       ├── template-editor.component.html
│       └── template-editor.component.css
├── services/
│   ├── campaign.service.ts
│   ├── campaign-template.service.ts
│   └── campaign-filter.service.ts
├── models/
│   ├── campaign.model.ts
│   ├── campaign-template.model.ts
│   └── campaign-filter.model.ts
├── guards/
│   └── campaign-edit.guard.ts
├── pipes/
│   └── campaign-status.pipe.ts
└── campaigns-routing.module.ts
```

---

## 🔌 Service APIs

### CampaignService

```typescript
// src/app/(protected)/clinic/communications/campaigns/services/campaign.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Campaign, CreateCampaignDto, UpdateCampaignDto } from '../models';

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private apiUrl = '/api/campaigns';

  constructor(private http: HttpClient) {}

  // List campaigns
  listCampaigns(options?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Observable<{ data: Campaign[]; total: number }> {
    return this.http.get<{ data: Campaign[]; total: number }>(this.apiUrl, {
      params: options as any,
    });
  }

  // Get single campaign
  getCampaign(campaignId: string): Observable<Campaign> {
    return this.http.get<Campaign>(`${this.apiUrl}/${campaignId}`);
  }

  // Create campaign
  createCampaign(dto: CreateCampaignDto): Observable<Campaign> {
    return this.http.post<Campaign>(this.apiUrl, dto);
  }

  // Update campaign
  updateCampaign(
    campaignId: string,
    dto: UpdateCampaignDto,
  ): Observable<Campaign> {
    return this.http.patch<Campaign>(`${this.apiUrl}/${campaignId}`, dto);
  }

  // Start campaign
  startCampaign(campaignId: string): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.apiUrl}/${campaignId}/start`, {});
  }

  // Pause campaign
  pauseCampaign(campaignId: string): Observable<Campaign> {
    return this.http.post<Campaign>(`${this.apiUrl}/${campaignId}/pause`, {});
  }

  // Resume campaign
  resumeCampaign(campaignId: string): Observable<Campaign> {
    return this.http.post<Campaign>(
      `${this.apiUrl}/${campaignId}/resume`,
      {},
    );
  }

  // Delete campaign
  deleteCampaign(campaignId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${campaignId}`);
  }

  // Get metrics
  getCampaignMetrics(campaignId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${campaignId}/metrics`);
  }

  // Get recipients
  getCampaignRecipients(campaignId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${campaignId}/recipients`);
  }

  // Preview audience
  previewAudience(params: {
    channel: string;
    filter: Record<string, any>;
  }): Observable<{ estimatedCount: number; preview: any[] }> {
    return this.http.post<any>(`${this.apiUrl}/audience/preview`, params);
  }
}
```

### CampaignTemplateService

```typescript
// src/app/(protected)/clinic/communications/campaigns/services/campaign-template.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CampaignTemplate,
  CreateCampaignTemplateDto,
} from '../models';

@Injectable({ providedIn: 'root' })
export class CampaignTemplateService {
  private apiUrl = '/api/campaign-templates';

  constructor(private http: HttpClient) {}

  // List templates
  listTemplates(options?: {
    channel?: string;
    isActive?: boolean;
  }): Observable<CampaignTemplate[]> {
    return this.http.get<CampaignTemplate[]>(this.apiUrl, {
      params: options as any,
    });
  }

  // Get single template
  getTemplate(templateId: string): Observable<CampaignTemplate> {
    return this.http.get<CampaignTemplate>(`${this.apiUrl}/${templateId}`);
  }

  // Create template
  createTemplate(dto: CreateCampaignTemplateDto): Observable<CampaignTemplate> {
    return this.http.post<CampaignTemplate>(this.apiUrl, dto);
  }

  // Update template
  updateTemplate(
    templateId: string,
    dto: Partial<CreateCampaignTemplateDto>,
  ): Observable<CampaignTemplate> {
    return this.http.patch<CampaignTemplate>(
      `${this.apiUrl}/${templateId}`,
      dto,
    );
  }

  // Delete template
  deleteTemplate(templateId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${templateId}`);
  }

  // Preview template with sample data
  previewTemplate(templateId: string): Observable<{
    body: string;
    html?: string;
    subject?: string;
  }> {
    return this.http.get<any>(
      `${this.apiUrl}/${templateId}/preview`,
    );
  }

  // Render template with actual context
  renderTemplate(
    templateId: string,
    context: Record<string, any>,
  ): Observable<{ body: string; html?: string; subject?: string }> {
    return this.http.post<any>(
      `${this.apiUrl}/${templateId}/render`,
      { context },
    );
  }

  // Get supported variables
  getSupportedVariables(): Observable<
    Array<{ name: string; category: string; description: string }>
  > {
    return this.http.get<any>(
      `${this.apiUrl}/variables/supported`,
    );
  }
}
```

---

## 🎯 Key Frontend Pages

### 1. Campaign List Page

Features:
- Sortable table with campaigns
- Filter by status, channel
- Pagination
- Quick actions (View, Edit, Pause, Delete)
- Bulk actions

### 2. Campaign Builder (4-Step Wizard)

**Step 1: Select Template**
- List templates by channel
- Preview template on selection
- Show required variables

**Step 2: Define Filters**
- Interactive filter builder UI
- Checkboxes for: Species, Sex, Size, Age range
- Date pickers for: Created after, Last visit, etc.
- Toggle for WhatsApp/Email availability

**Step 3: Preview Audience**
- Show estimated count
- Display sample recipients (first 50)
- Show breakdown by species/breed
- Allow filter adjustment

**Step 4: Schedule**
- Date/time picker
- "Send now" vs "Schedule for later" toggle
- Review summary
- Launch button

### 3. Campaign Detail Page

Features:
- Campaign info (name, channel, status, created by)
- Audience size and breakdown
- Delivery metrics (sent, delivered, failed, opened)
- Charts:
  - Delivery status pie chart
  - Open rate gauge
  - Conversion rate gauge
- Recipient list (searchable, filterable)
- Action buttons (Pause, Resume, Cancel)

### 4. Campaign Template Manager

Features:
- List templates (filter by channel)
- Create new template
- Edit template
- Delete template (if not in use)
- Preview template
- Edit variables
- Test send (optional)

---

## 🛠️ Sample Component Code

### Campaign List Component

```typescript
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { CampaignService } from '../../services/campaign.service';
import { Campaign } from '../../models/campaign.model';

@Component({
  selector: 'app-campaign-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './campaign-list.component.html',
  styleUrls: ['./campaign-list.component.css'],
})
export class CampaignListComponent implements OnInit {
  private campaignService = inject(CampaignService);
  private router = inject(Router);

  campaigns: Campaign[] = [];
  loading = false;
  error: string | null = null;
  page = 1;
  limit = 20;
  total = 0;

  ngOnInit() {
    this.loadCampaigns();
  }

  loadCampaigns() {
    this.loading = true;
    this.campaignService.listCampaigns({ page: this.page, limit: this.limit })
      .subscribe({
        next: (result) => {
          this.campaigns = result.data;
          this.total = result.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load campaigns';
          this.loading = false;
        },
      });
  }

  createCampaign() {
    this.router.navigate(['/clinic/communications/campaigns/new']);
  }

  viewCampaign(campaignId: string) {
    this.router.navigate([
      '/clinic/communications/campaigns',
      campaignId,
    ]);
  }

  editCampaign(campaignId: string) {
    this.router.navigate([
      '/clinic/communications/campaigns',
      campaignId,
      'edit',
    ]);
  }

  pauseCampaign(campaignId: string) {
    this.campaignService.pauseCampaign(campaignId).subscribe({
      next: () => this.loadCampaigns(),
      error: (err) => this.error = 'Failed to pause campaign',
    });
  }

  deleteCampaign(campaignId: string) {
    if (confirm('Are you sure?')) {
      this.campaignService.deleteCampaign(campaignId).subscribe({
        next: () => this.loadCampaigns(),
        error: (err) => this.error = 'Failed to delete campaign',
      });
    }
  }
}
```

---

## 🎨 Routing Configuration

```typescript
// src/app/(protected)/clinic/communications/campaigns/campaigns-routing.module.ts

import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CampaignListComponent } from './pages/campaign-list/campaign-list.component';
import { CampaignBuilderComponent } from './pages/campaign-builder/campaign-builder.component';
import { CampaignDetailComponent } from './pages/campaign-detail/campaign-detail.component';
import { TemplateManagerComponent } from './pages/template-manager/template-manager.component';

const routes: Routes = [
  {
    path: '',
    component: CampaignListComponent,
  },
  {
    path: 'new',
    component: CampaignBuilderComponent,
  },
  {
    path: ':campaignId',
    component: CampaignDetailComponent,
  },
  {
    path: ':campaignId/edit',
    component: CampaignBuilderComponent,
  },
  {
    path: 'templates',
    component: TemplateManagerComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CampaignsRoutingModule {}
```

---

## 🔐 Authorization & Security

Add to campaign components:

```typescript
// Check if user can create campaigns
canCreateCampaign(): boolean {
  return this.authService.hasPermission('campaigns:create');
}

// Check if user can delete campaigns
canDeleteCampaign(campaign: Campaign): boolean {
  if (campaign.status !== 'DRAFT') return false;
  return this.authService.hasPermission('campaigns:delete');
}

// Check if user created campaign
isCreatedByCurrentUser(campaign: Campaign): boolean {
  return campaign.createdByUserId === this.authService.currentUser.id;
}
```

---

## 📊 Filter Builder Component

The filter builder should provide a UI for:

1. **Pet Filters**
   - Species (multiselect: DOG, CAT, etc.)
   - Breed (autocomplete)
   - Sex (radio: MALE, FEMALE)
   - Size (multiselect: SMALL, MEDIUM, LARGE)
   - Age range (two sliders)
   - Sterilized (toggle)
   - Active (toggle)
   - Deceased (toggle)

2. **Client Filters**
   - Has WhatsApp (toggle)
   - Has Email (toggle)
   - Active (toggle)
   - Created after (date picker)
   - Last visit date range (two date pickers)
   - Min/Max pets (number inputs)

3. **Live Preview**
   - Show estimated audience count
   - Update on filter change
   - Display sample recipients

---

## 🚀 Integration with Clinic Sidebar

Add menu items to clinic communications sidebar:

```typescript
{
  label: 'Campañas',
  icon: 'megaphone',
  route: '/clinic/communications/campaigns',
  children: [
    {
      label: 'Lista de Campañas',
      route: '/clinic/communications/campaigns',
    },
    {
      label: 'Nueva Campaña',
      route: '/clinic/communications/campaigns/new',
    },
    {
      label: 'Plantillas',
      route: '/clinic/communications/campaigns/templates',
    },
  ],
}
```

---

## ✅ Testing Checklist

- [ ] List campaigns with pagination
- [ ] Create campaign with template selection
- [ ] Define filters and preview audience
- [ ] Schedule campaign
- [ ] Start campaign execution
- [ ] Pause/Resume campaign
- [ ] View campaign metrics
- [ ] Create/Edit/Delete templates
- [ ] Render templates with variables
- [ ] Error handling for API failures
- [ ] Authorization checks
- [ ] Mobile responsiveness
- [ ] UTC timezone display (convert to clinic local time)

---

## 📱 Responsive Design Notes

- Use TailwindCSS grid for responsive layouts
- Mobile-first approach
- Campaign builder: Stack steps vertically on mobile
- Filter builder: Collapse sections on mobile
- Recipients table: Horizontal scroll on mobile with sticky first column
- Charts: Responsive sizing with aspect-ratio

---

## 🎯 State Management

For better state management, consider using:
- Angular signals for simple state
- NgRx if campaign state becomes complex
- Services with BehaviorSubjects for shared state

Example with signals:

```typescript
campaigns = signal<Campaign[]>([]);
loading = signal(false);
selectedCampaign = signal<Campaign | null>(null);

loadCampaigns() {
  this.loading.set(true);
  this.campaignService.listCampaigns().subscribe({
    next: (result) => this.campaigns.set(result.data),
    finally: () => this.loading.set(false),
  });
}
```

---

## 🌐 Internationalization (i18n)

Add to translation files:

```json
{
  "campaigns": {
    "title": "Campañas",
    "newCampaign": "Nueva Campaña",
    "templates": "Plantillas de Campaña",
    "list": "Lista de Campañas",
    "metrics": "Métricas",
    "selectTemplate": "Seleccionar Plantilla",
    "defineFilters": "Definir Filtros",
    "previewAudience": "Previsualizar Audiencia",
    "schedule": "Programar",
    "status": {
      "draft": "Borrador",
      "scheduled": "Programada",
      "running": "En Ejecución",
      "completed": "Completada",
      "paused": "Pausada",
      "cancelled": "Cancelada"
    }
  }
}
```
