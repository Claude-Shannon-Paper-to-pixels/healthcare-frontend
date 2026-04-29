# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Dev Commands

```bash
npm run dev      # Start dev server on http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
```

No test suite or linter is configured.

## What This App Does

Private hospital Healthcare Management System for a Malaysian context. Staff, doctors, and administrators manage patient admissions, bed assignments, insurance (IGL/TPA), referral letters, add-on procedures, and AI-powered insurance claim risk analysis.

## Backend & External Services

| Service | URL | Purpose |
|---|---|---|
| Directus CMS | `http://100.64.177.106:8055` | Database + auth backend |
| AI analysis | `https://airesponcebackend.onrender.com/analyze` | Insurance claim risk scoring |
| PAF PDF generator | `http://100.64.177.106:5678/webhook/directus-data` | n8n webhook → generates PDF |
| OCR tool | `http://100.98.81.26:5173/` | External app, opened in new tab |

All URLs are in `.env` (`VITE_DIRECTUS_URL`, `VITE_AI_ANALYSIS_URL`) or hardcoded in `src/pages/GeneratePAF/pafApi.js` and `src/pages/HubDashboard.jsx`.

## Authentication Flow

Directus JWT auth. Tokens stored in `localStorage` (`directus_token`, `directus_refresh_token`, `user`). The SDK's `autoRefresh` handles renewal — no manual timer needed. Every protected page calls `initAuth()` on mount; if it returns null, redirect to `/login`.

**Role → Route mapping:**
- `Doctor` → `/doctor-dashboard`
- `Hospital_staff` / `Hospital Staff` → `/hub-dashboard` → `/staff-dashboard`
- `Administrator` → `/hub-dashboard` → `/admin-dashboard`

`DashboardPage` is just a redirect router based on role. Role checks use `src/utils/auth.js` helpers (`isAdmin()`, `isDoctor()`, `isStaff()`).

## Directus Collections

| Collection | Key fields |
|---|---|
| `Patient` | `patient_name`, `mrn`, `NRIC`, `date_of_birth`, `gender`, `contact_number`, `email`, `total_fee` |
| `Admission` | `status`, `admission_date`, `operation_date`, `operation_time`, `estimated_cost_RM`, `diagnosis`, `financial_class`, `type_of_accommodation`, `expected_days_of_stay` |
| `insurance` | `tpa_name`, `IGL_status`, `Policy_No`, `IGL_number`, `pdf_url`, `estimated_cost`, `diagnosis`, `condition_related_to` |
| `Bed` | `bed_no`, `Status` (`Vacant`/`Booking`), `select_ward` |
| `Referral_Letter` | linked to patient via `patient_id` |
| `Add_on_Procedures` | linked to patient via `patient_id`, `plan_date`, `estimated_cost`, `procedure_description` |

Relations on `Patient`: `patient_bed` (Bed), `patient_Admission` (Admission), `insurance`, `Referral_Letter`, `Add_on_Procedures`.

## Key Architectural Patterns

**API layer** — All Directus calls go through `src/api/`. Use the `@directus/sdk` helper methods (`readItems`, `readItem`, `createItem`, `updateItem`, `deleteItem`) via the `directus` client from `src/api/directus.js`. Never call Directus directly with raw fetch except in `pafApi.js` (which needs to bypass the SDK for polling).

**Bed assignment** — When assigning a bed: old bed → `Vacant`, new bed → `Booking`, patient record updated. When deleting a patient: their bed is reset to `Vacant` first. See `assignBedToPatient` and `deletePatient` in `src/api/patients.js`.

**AI Claim Risk flow** (`src/ai-analysis/`):
1. `buildAiPayload.js` — shapes patient/admission/insurance/procedures into a payload
2. `insurancePrompt.js` — builds the LLM prompt (Malaysian 13th Schedule rules)
3. `analyzeClaimRisk.js` — POSTs to AI endpoint, parses markdown-wrapped JSON, maps to component format
4. `AiAnalysisModal.jsx` — renders risk level, flagged items, recommendations

**PAF PDF flow** (`src/pages/GeneratePAF/`):
1. `clearInsurancePdfUrl()` — clears the existing `pdf_url` on the insurance record
2. `generatePAF()` — POSTs to n8n webhook
3. `pollForPdfUrl()` — polls `insurance.pdf_url` every 3s (90s timeout) until the PDF appears
4. `downloadPdf()` — opens the URL

**Patient detail view** (`src/pages/display-petient/`) — Tabbed layout with panels: Overview, Admission, Insurance, Referrals, Add-ons. Each panel is its own component under `panels/`.

**Dashboard widgets** — `KpiCards`, `BedKpiCards`, `FiltersBar`, pie charts (`IglStatusPieChart`, `AdmissionStatusPieChart`) are shared across Doctor/Admin/Staff dashboards.

**Voice input** — `src/hooks/useSpeechRecognition.js` wraps the Web Speech API. `VoiceWidget` and `VoiceCard` provide UI; `VoiceInputButton` is the reusable button component.
