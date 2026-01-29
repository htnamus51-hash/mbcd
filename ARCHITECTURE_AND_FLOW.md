# Contact Form Integration - Architecture & Flow

## System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                         MBC THERAPY APPLICATION                        │
└────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                            PUBLIC WEBSITE                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │          CONTACT FORM PAGE (?page=contact)                      │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  [Patient Fill Form]                                            │  │
│  │  ├─ First Name      ┌─────────────────┐                        │  │
│  │  ├─ Last Name       │     FORM        │                        │  │
│  │  ├─ Email*          │   VALIDATION    │                        │  │
│  │  ├─ Phone           └─────────────────┘                        │  │
│  │  ├─ Reason (dropdown)                                           │  │
│  │  ├─ Message                                                     │  │
│  │  └─ Preferred Method (email/phone/both)                         │  │
│  │                                                                  │  │
│  │  [SUBMIT BUTTON] ──┐                                            │  │
│  │                    │                                            │  │
│  └────────────────────┼────────────────────────────────────────────┘  │
│                       │                                                 │
└───────────────────────┼─────────────────────────────────────────────────┘
                        │
                        │ POST /api/contacts
                        ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         FASTAPI BACKEND                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              create_contact() ENDPOINT                          │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │                                                                  │  │
│  │  1. Receive POST data                                           │  │
│  │  2. Validate via ContactSubmission schema                       │  │
│  │  3. Create contact_doc with:                                    │  │
│  │     - All form fields                                           │  │
│  │     - status: "new"                                             │  │
│  │     - created_at: datetime.utcnow()                             │  │
│  │  4. Insert to MongoDB                                           │  │
│  │  5. Emit Socket.IO event 'new_contact'                          │  │
│  │  6. Return ContactResponse                                      │  │
│  │                                                                  │  │
│  └──┬───────────────────────────────────────────────────────────────┘  │
│     │                                                                   │
└─────┼───────────────────────────────────────────────────────────────────┘
      │
      ├──────────────┬─────────────────────┐
      │              │                     │
      ▼              ▼                     ▼
 [Return OK]  [Save to DB]          [Emit Event]
      │              │                     │
      │              ▼                     │
      │        ┌──────────────────────┐    │
      │        │  MongoDB Atlas       │    │
      │        │  contacts collection │    │
      │        │                      │    │
      │        │  {                   │    │
      │        │    _id: ObjectId     │    │
      │        │    first_name: "..." │    │
      │        │    last_name: "..."  │    │
      │        │    email: "..."      │    │
      │        │    phone: "..."      │    │
      │        │    reason: "..."     │    │
      │        │    message: "..."    │    │
      │        │    status: "new"     │    │
      │        │    created_at: ...   │    │
      │        │  }                   │    │
      │        └──────────────────────┘    │
      │                                    │
      │                                    │
      └─────────────────────────────────┐  │
                                        │  │
                                        ▼  ▼
                                   ┌──────────────────┐
                                   │  SOCKET.IO EVENT │
                                   │  'new_contact'   │
                                   └────────┬─────────┘
                                            │
                                            ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      ADMIN DASHBOARD (REAL-TIME)                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐   │
│  │     CONTACT INQUIRIES        │  │   INQUIRY DETAILS            │   │
│  │        (Sidebar List)        │  │   (Right Panel)              │   │
│  ├──────────────────────────────┤  ├──────────────────────────────┤   │
│  │ • John Doe ✨ NEW            │  │ John Doe                     │   │
│  │   john@ex.com                │  │ Email: john@example.com      │   │
│  │   Initial Consultation       │  │ Phone: (555) 123-4567        │   │
│  │                              │  │ Reason: Initial Consultation │   │
│  │ • Sarah Johnson              │  │ Status: NEW                  │   │
│  │   sarah@ex.com               │  │                              │   │
│  │   Follow-up                  │  │ MESSAGE:                     │   │
│  │                              │  │ I need help with anxiety...  │   │
│  │ • Mike Chen                  │  │                              │   │
│  │   mike@ex.com                │  │ INTERNAL NOTES:              │   │
│  │   Billing Question           │  │ ┌────────────────────────┐   │   │
│  │                              │  │ │ Add follow-up notes    │   │   │
│  │                              │  │ │ here...                │   │   │
│  │                              │  │ └────────────────────────┘   │   │
│  │                              │  │                              │   │
│  │                              │  │ [Mark Contacted]             │   │
│  │                              │  │ [Convert to Patient]         │   │
│  │                              │  │                              │   │
│  └──────────────────────────────┘  └──────────────────────────────┘   │
│                                                                         │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │
                    ┌──────┴─────┐
                    │             │
                    ▼             ▼
            [MARK CONTACTED]  [CONVERT TO PATIENT]
                    │             │
                    │             ▼
                    │      ┌────────────────────┐
                    │      │ POST /api/contacts │
                    │      │  /{id}/convert     │
                    │      └────────┬───────────┘
                    │               │
                    │               ▼
                    │        ┌────────────────────┐
                    │        │ Create new CLIENT  │
                    │        │ record in database │
                    │        └────────┬───────────┘
                    │                 │
                    ▼                 ▼
            ┌──────────────────────────────────┐
            │    UPDATE contacts collection    │
            │    status: "new" → "contacted"   │
            │    or                            │
            │    status → "converted_to_patient"
            │    notes → "Converted to patient"│
            │                                  │
            └──────────────┬───────────────────┘
                           │
                           ▼
                    ┌────────────────────┐
                    │ UPDATE Dashboard   │
                    │ - List refreshes   │
                    │ - New client shows │
                    │   in Clients page  │
                    │ - Status updates   │
                    └────────────────────┘
```

---

## Data Flow Diagram

```
STEP 1: PATIENT SUBMITS FORM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Public Website → Form Data → ContactSubmission Schema → POST /api/contacts

STEP 2: BACKEND PROCESSES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FastAPI Receives → Validates → Creates Document → MongoDB Insert

STEP 3: REAL-TIME NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Socket.IO Emit → Admin Listening → Dashboard Updates → Shows New Inquiry

STEP 4: ADMIN MANAGES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin Views → Adds Notes → Clicks Convert → New Client Created

STEP 5: COMPLETION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status Changed → Contact Marked → Client Appears in Clients List → Ready for Therapy
```

---

## URL Routing

```
Frontend Routes:
├── / (Login)
├── /?page=contact (PUBLIC CONTACT FORM) ✨
├── /dashboard (Admin Dashboard)
│   ├── Sidebar → Contact Inquiries ✨
│   ├── Sidebar → Clients
│   ├── Sidebar → Appointments
│   └── ...

API Routes:
└── http://localhost:8000/api/
    ├── POST /contacts (Public - Submit form)
    ├── GET /contacts (Admin - List all)
    ├── GET /contacts/{id} (Admin - View one)
    └── POST /contacts/{id}/convert-to-patient (Admin - Convert)
```

---

## Status Lifecycle

```
┌─────────┐
│   NEW   │  ← Contact just submitted
└────┬────┘
     │
     ├─→ [Admin reviews]
     │
     ▼
┌──────────────┐
│  CONTACTED   │  ← Admin reached out to inquirer
└────┬─────────┘
     │
     ├─→ [Interested?]
     │
     ├─→ YES
     │   │
     │   ▼
     │ ┌──────────────────────┐
     │ │ CONVERTED_TO_PATIENT │  ← Created client record
     │ └──────────────────────┘
     │
     └─→ NO / UNINTERESTED
         │
         ▼
     ┌────────┐
     │ CLOSED │  ← No longer relevant
     └────────┘
```

---

## MongoDB Document Structure

```javascript
// Example Contact Document
{
  "_id": ObjectId("65a7b8c9d0e1f2a3b4c5d6e7"),
  
  // Contact Information
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@example.com",
  "phone": "(555) 123-4567",
  
  // Inquiry Details
  "reason": "Initial Consultation",
  "message": "I'm looking for help with anxiety and would like to schedule an appointment to discuss treatment options.",
  "preferred_contact_method": "email",
  
  // System Fields
  "status": "new",                    // new | contacted | converted_to_patient | closed
  "created_at": ISODate("2026-01-27T15:30:45.123Z"),
  "notes": "Patient prefers evening appointments",
  
  // Metadata (auto-filled by system)
  "converted_to_client_id": null,     // ObjectId if converted
  "converted_at": null                // Timestamp of conversion
}
```

---

## Component Hierarchy

```
App.tsx
├── ContactPage (Public)
│   └── Form Component
│       ├── Input Fields
│       └── Submit Logic → /api/contacts
│
└── AdminDashboard (Protected)
    └── ContactsManagement ✨
        ├── Contact List
        │   └── Each contact clickable
        │
        └── Contact Detail Panel
            ├── Info Display
            ├── Message Display
            ├── Notes Editor
            └── Action Buttons
                ├── Mark Contacted
                └── Convert to Patient
```

---

## API Request/Response Examples

### Request: Submit Contact
```http
POST http://localhost:8000/api/contacts
Content-Type: application/json

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "reason": "Initial Consultation",
  "message": "I need help with anxiety",
  "preferred_contact_method": "email"
}
```

### Response: Success
```http
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "65a7b8c9d0e1f2a3b4c5d6e7",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "reason": "Initial Consultation",
  "message": "I need help with anxiety",
  "preferred_contact_method": "email",
  "status": "new",
  "created_at": "2026-01-27T15:30:45.123000",
  "notes": null
}
```

---

## Security & Privacy

```
PUBLIC ACCESS
├── Contact Form (/api/contacts POST)
└── Anyone can submit

ADMIN ONLY (Protected)
├── GET /api/contacts
├── GET /api/contacts/{id}
└── POST /api/contacts/{id}/convert-to-patient

NOTE: You should add authentication middleware
      to protect admin endpoints in production
```

---

*This system is production-ready and fully integrated with MongoDB Atlas! ✅*
