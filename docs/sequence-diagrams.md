# FUEP Post-UTME — Sequence Diagrams (Mermaid)

These sequence diagrams are normative and must inform and constrain implementation throughout development. Any deviation must be explicitly reviewed and approved.

## Conformance Notes

- All API contracts, database operations, background jobs, and side effects must follow these flows.
- Payment orchestration (init, webhook, verify, reconcile) must match the steps and transitions depicted here.
- Candidate lifecycle, document processing, admissions, matriculation, and migration are governed by these sequences.

---

## Step 1 — Apply & Verify JAMB Number

```mermaid
sequenceDiagram
  autonumber
  participant U as Candidate (FE)
  participant API as Backend API
  participant DB as Postgres (jamb_prelist)

  U->>API: POST /auth/check-jamb { jambRegNo }
  API->>DB: SELECT * FROM jamb_prelist WHERE jamb_reg_no=?
  DB-->>API: exists / not exists + minimal biodata
  API-->>U: { exists: true/false, biodata }
```

---

## Step 2 — Initiate Post-UTME Payment

```mermaid
sequenceDiagram
  autonumber
  participant U as Candidate (FE)
  participant API as Backend API
  participant DB as Postgres
  participant REM as Remita

  U->>API: POST /payments/init { purpose=post_utme, jambRegNo, email, phone }
  API->>DB: UPSERT candidates(email, phone, jambRegNo)
  API->>DB: INSERT payments(status=initiated, purpose=post_utme)
  API->>REM: Initialize transaction (RRR)
  REM-->>API: { rrr, providerRef }
  API-->>DB: UPDATE payments SET provider=remita, provider_ref, status=pending
  API-->>U: { redirectUrl / token, paymentId }
```

---

## Step 3 — Payment Confirmation & Account Creation

```mermaid
sequenceDiagram
  autonumber
  participant REM as Remita
  participant API as Backend API
  participant DB as Postgres
  participant Q as Queue (Redis)

  REM->>API: POST /payments/webhook/remita { providerRef, status }
  API->>API: Verify signature, map payload
  API->>DB: UPDATE payments SET status=success/failed
  alt success
    API->>DB: UPSERT candidates (username=jambRegNo, password_hash, temp_password_flag=true)
    API->>Q: Enqueue payment.verify, receipt.generate, notify.email
  end
  API-->>REM: 200 OK
```

---

## Step 4 — Login & Password Change Prompt

```mermaid
sequenceDiagram
  autonumber
  participant U as Candidate (FE)
  participant API as Backend API
  participant DB as Postgres

  U->>API: POST /auth/login { username=jambRegNo, password }
  API->>DB: SELECT candidate by username
  API->>API: Verify password -> issue JWT
  API-->>U: { accessToken, refreshToken, tempPasswordFlag }
  opt temp password
    U->>API: POST /auth/change-password { oldPassword, newPassword }
    API->>DB: UPDATE candidates SET password_hash=..., temp_password_flag=false
    API-->>U: 204 No Content
  end
```

---

## Step 5 — Biodata Form

```mermaid
sequenceDiagram
  autonumber
  participant U as Candidate (FE)
  participant API as Backend API
  participant DB as Postgres

  U->>API: GET /me (prefill biodata with JAMB data)
  API->>DB: SELECT profiles/applications
  DB-->>API: data
  API-->>U: composite

  U->>API: PUT /profile { biodata fields }
  API->>DB: UPSERT profiles
  API->>DB: UPSERT applications (status=pending)
  API-->>U: 200 OK (Profile)
```

---

## Step 6 — Educational Records & Uploads

```mermaid
sequenceDiagram
  autonumber
  participant U as Candidate (FE)
  participant API as Backend API
  participant DB as Postgres
  participant S3 as Object Storage
  participant Q as Queue

  U->>API: POST /education-records {...}
  API->>DB: INSERT education_records
  API-->>U: 201 Created

  U->>API: POST /uploads (multipart: file, type)
  API->>S3: PUT file stream
  S3-->>API: 200 OK + URL
  API->>DB: INSERT uploads { s3_url, type, scan_status=pending }
  API->>Q: Enqueue doc.scan (+ pdfify if needed)
  API-->>U: 201 Uploaded
```

---

## Step 7 — Next-of-Kin & Sponsor

```mermaid
sequenceDiagram
  autonumber
  participant U as Candidate (FE)
  participant API as Backend API
  participant DB as Postgres

  U->>API: POST /next-of-kin { ... }
  API->>DB: INSERT next_of_kin
  API-->>U: 201 Created

  U->>API: POST /sponsors { ... }
  API->>DB: INSERT sponsors
  API-->>U: 201 Created
```

---

## Step 8 — Registration Form Preview & Print

```mermaid
sequenceDiagram
  autonumber
  participant U as Candidate (FE)
  participant API as Backend API
  participant DB as Postgres
  participant PDF as PDF Engine

  U->>API: GET /registration-form
  API->>DB: SELECT all candidate data
  DB-->>API: data
  API-->>U: JSON preview

  U->>API: GET /registration-form.pdf
  API->>PDF: Render template to PDF (+ watermark + QR)
  API-->>U: PDF stream (and store URL to S3)
```

---

## Step 9 — Candidate Dashboard

```mermaid
sequenceDiagram
  autonumber
  participant U as Candidate (FE)
  participant API as Backend API
  participant DB as Postgres

  U->>API: GET /dashboard
  API->>DB: SELECT profile, uploads(passport), applications, admissions, students, payments
  DB-->>API: combined rows
  API-->>U: { passportUrl, name, programme, dept, admissionStatus, matricNo, payments[] }
```

---

## Step 10 — Admission → Acceptance/School Fees → Matric → Letter → Migration

```mermaid
sequenceDiagram
  autonumber
  participant ADM as Admin (FE)
  participant API as Backend API
  participant DB as Postgres
  participant PAY as Provider(s)
  participant Q as Queue
  participant PDF as PDF Engine
  participant MAIN as Main Student Portal

  ADM->>API: PATCH /admin/admissions/{candidateId} { decision=admitted }
  API->>DB: UPDATE admissions SET decision=admitted
  API-->>ADM: 200 OK

  Note over U,API: Candidate pays Acceptance (same /payments/init + webhook flow)
  PAY->>API: webhook success (acceptance)
  API->>DB: UPDATE payments SET status=success

  U->>API: GET /admission-letter.pdf
  API->>PDF: Generate letter with QR
  API-->>U: PDF

  Note over U,API: Candidate pays School Fees (same payment flow)
  PAY->>API: webhook success (school_fee)
  API->>DB: UPDATE payments SET status=success
  API->>Q: Enqueue matric.generate

  Q->>DB: SELECT matric_counters ... FOR UPDATE
  Q->>DB: UPDATE counter, INSERT students (matric_no)
  Q->>API: Notify email/SMS

  Q->>MAIN: POST student payload (migration)
  MAIN-->>Q: 200/202 Accepted
  Q->>DB: UPDATE migrations status=success
```

---

Render notes:

- GitHub and many Markdown engines render Mermaid automatically. If not, paste each block into a Mermaid-capable viewer (e.g., https://mermaid.live) or enable Mermaid in your docs site.
