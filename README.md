# Event Planner --- Product & Technical Plan

A user-friendly event planning platform for individuals and families to
plan weddings, receptions, birthdays, anniversaries, baby showers, and
other celebrations.

The product helps end users answer five questions quickly:

-   What should I do next?
-   How much have I spent, and how much budget remains?
-   Which tasks are overdue or still pending?
-   Who has confirmed attendance?
-   Am I ready for the event day?

The first release focuses on making event planning, budget control, and
task tracking simple. The architecture should be extensible enough to
support professional event planners and multi-event organizations later.

------------------------------------------------------------------------

## 1. Product Vision

**Build a modern, approachable, self-service event planner** that helps
a person go from a blank page to a well-organized event without needing
event-management expertise.

### Product principles

1.  **End-user first:** Use everyday language, guided workflows, helpful
    defaults, and clear next actions.
2.  **Progressive disclosure:** Show essential information first; keep
    advanced settings out of the way until needed.
3.  **Compact, clean UI:** Prioritize useful information, readable
    typography, restrained colors, and minimal visual clutter.
4.  **Mobile friendly:** Users must be able to check tasks, contacts,
    guest status, and the event-day run sheet on a phone.
5.  **Financial clarity:** Clearly distinguish planned, approved,
    committed, paid, and outstanding amounts.
6.  **Trust and privacy:** Users see only events and records they are
    authorized to access.
7.  **Useful automation:** Provide reminders and suggestions without
    making them intrusive or pretending estimates are guarantees.

## 2. Target Users

### Primary audience: individuals and families

People organizing their own:

-   Weddings and receptions
-   Engagements
-   Birthdays and anniversaries
-   Baby showers and family celebrations
-   Festivals and other personal events

### Secondary audience: collaborators

Family members and friends who help with guest lists, tasks, vendors,
documents, or schedules.

### Future audience: professional event planners

Event coordinators and agencies managing multiple client events, teams,
budgets, vendors, and approvals. Support this audience through
organization and membership concepts, but do not let enterprise
workflows complicate the first release.

------------------------------------------------------------------------

## 3. Technology Stack

  -----------------------------------------------------------------------
  Layer                   Technology              Responsibility
  ----------------------- ----------------------- -----------------------
  Frontend                Vue 3 + TypeScript      User interface and
                                                  client-side
                                                  interactions

  Build tool              Vite                    Development server and
                                                  production builds

  UI components           Vuetify 3               Responsive layouts,
                                                  forms, dialogs, tables,
                                                  and navigation

  Icons                   Material Design Icons   Consistent iconography

  Charts                  Apache ECharts          Budget and event
                                                  analytics

  Routing                 Vue Router              Page navigation and
                                                  route guards

  State                   Pinia                   Auth state, selected
                                                  event, and UI state

  Validation              Zod or typed form       Client-side input
                          validation              validation

  Authentication          Firebase Authentication User identity and
                                                  sign-in

  Backend                 Python + FastAPI        Business rules,
                                                  authorization, REST API

  Backend validation      Pydantic                Request and response
                                                  validation

  Database                Cloud Firestore         Event and application
                                                  data

  File storage            Cloud Storage for       Receipts, contracts,
                          Firebase                invitations, and
                                                  documents

  Server SDK              Firebase Admin SDK for  Verify ID tokens and
                          Python                  access Firebase
                                                  services

  Testing                 Vitest, Vue Test Utils, Frontend and backend
                          pytest, HTTPX           testing

  Deployment              Firebase Hosting or     Frontend and API
                          equivalent; Cloud Run   hosting

  Observability           Cloud Logging and error Runtime diagnostics and
                          reporting               operational monitoring
  -----------------------------------------------------------------------

Use supported, tested dependency versions and pin them before production
deployment.

### Architecture decision

Firebase Authentication handles identity. Vue obtains a Firebase ID
token and sends it to FastAPI. FastAPI verifies the token, checks event
and organization permissions, and performs protected Firestore
operations using the Admin SDK.

**Do not rely on frontend route guards or hidden buttons for security.**
Every protected API operation must enforce authorization on the server.

------------------------------------------------------------------------

## 4. User Journey

The primary journey is:

1.  User signs up or signs in.
2.  User creates an event using a short wizard.
3.  User chooses an event date, type, guest estimate, and budget.
4.  The application suggests relevant categories and checklist tasks.
5.  User adds expenses, guests, vendors, and schedules as needed.
6.  The dashboard highlights next actions, budget status, and upcoming
    dates.
7.  Reminders help the user complete important tasks.
8.  On the event day, the user follows a mobile-friendly run sheet.
9.  After the event, the user can review final expenses and archive the
    event.

Users should be able to save a partially completed event and return
later.

------------------------------------------------------------------------

## 5. UX and Visual Design

### Visual direction

-   Background: `#F8FAFC`
-   Primary accent: `#0F766E`
-   Main text: `#0F172A`
-   Secondary text: slate gray
-   Surfaces: white cards with subtle borders
-   Status colors: green for success, amber for warnings, red for
    critical issues
-   Border radius: approximately 8--12 px
-   Compact spacing and consistent component sizes
-   Clear keyboard focus states and accessible contrast
-   Responsive desktop, tablet, and mobile layouts

### Navigation

Global navigation:

1.  Home
2.  My Events
3.  Tasks
4.  Settings

Within an event, provide contextual navigation:

1.  Overview
2.  Checklist
3.  Budget & Expenses
4.  Guests
5.  Vendors
6.  Schedule
7.  Arrangements
8.  Run Sheet
9.  Documents

Do not expose every administrative feature to every user. Adapt
navigation and actions to the user's permissions.

### Dashboard layout

The home dashboard should prioritize:

-   Greeting and a prominent **Create Event** action
-   Upcoming event cards with countdown and planning progress
-   Budget planned versus spent
-   Outstanding or upcoming payments
-   Pending and overdue tasks
-   RSVP summary
-   Upcoming activities
-   A short, actionable "Next steps" list

Avoid filling the first screen with too many charts. Use charts only
when they help users make a decision.

### Accessibility and usability

-   Use labels and helpful validation messages on every form.
-   Avoid color as the only way to communicate status.
-   Support keyboard navigation and screen readers.
-   Provide empty states with a useful next action.
-   Confirm destructive actions.
-   Use pagination and filters for large lists.
-   Show loading, success, error, and retry states consistently.

------------------------------------------------------------------------

## 6. Feature Scope

### 6.1 Authentication and profile

**MVP**

-   Email/password registration and login
-   Google sign-in if enabled in Firebase
-   Logout
-   Password reset
-   User profile
-   Authenticated API calls
-   Protected frontend routes
-   Account and session error handling

Firebase Authentication is the identity provider. Application-specific
roles and memberships are maintained in Firestore and checked by
FastAPI.

### 6.2 Event management

-   Create, view, edit, and archive events
-   Event types: wedding, reception, engagement, birthday, corporate
    event, conference, baby shower, anniversary, festival, and custom
-   Start and end dates
-   Time zone
-   Venue and location
-   Expected guest count
-   Theme, dress code, and special instructions
-   Event-specific budget and planning progress
-   Event collaborators and permissions

Use a guided wizard:

1.  Event basics
2.  Date and location
3.  Budget and guest estimate
4.  Preferences
5.  Review and create

### 6.3 Planning checklist

-   Suggested tasks based on event type and date
-   Custom tasks
-   Due date, priority, status, and assignee
-   Overdue and upcoming filters
-   Task completion progress
-   Optional reminders
-   Reusable task templates

Templates are suggestions, not fixed requirements. Users can edit or
remove suggested tasks.

### 6.4 Budget and expenses

-   Set a planned budget
-   Allocate category budgets
-   Record expenses
-   Track GST separately where applicable
-   Attach receipt files
-   Record invoice number and payment method
-   Track pending, partially paid, paid, and cancelled states
-   Compare planned versus actual spend
-   Highlight budget overruns
-   Export expense data in a later release

Suggested categories include venue, catering, photography, videography,
decoration, invitations, accommodation, transport, makeup,
entertainment, return gifts, rituals, security, parking, generator,
cleaning, and miscellaneous.

Use integer minor currency units (for example, paise for INR) for stored
monetary values when practical. Always store a currency code. Do not use
floating-point arithmetic for financial calculations.

Define financial metrics carefully:

-   **Planned budget:** Original user plan
-   **Approved budget:** Amount approved, if the workflow uses approvals
-   **Actual expense:** Valid expense transaction total under the agreed
    accounting rules
-   **Paid amount:** Amount actually paid
-   **Outstanding amount:** Amount still owed
-   **Remaining budget:** Defined budget baseline minus actual expenses

Do not treat vendor contract value, expense amount, and payment amount
as interchangeable.

### 6.5 Guests and RSVP

-   Add, edit, and remove guests
-   Import guest lists from CSV in a later MVP increment
-   Group guests by family or category
-   Record invitation status
-   Track pending, confirmed, and declined RSVPs
-   Meal preference and accommodation needs
-   Record guest count or party size
-   Export a guest list
-   Optional invitation links in a later release

Guest contact information is private. Restrict access to authorized
event collaborators and avoid exposing guest lists publicly.

### 6.6 Vendor management

-   Vendor directory and service category
-   Contact information
-   Quotations and agreed prices
-   Contract details and service descriptions
-   Advance, interim, final, and refund payments
-   Outstanding balance
-   Relevant files and notes
-   Vendor status and optional rating

A public vendor marketplace, location-based discovery, verified reviews,
and live availability are future features, not MVP dependencies.

### 6.7 Schedule and run sheet

-   Event activities with dates, start/end times, locations, and owners
-   Identify delayed or cancelled activities
-   Final event-day run sheet
-   Responsible and backup contacts
-   Mark activities complete
-   Report a delay and record remarks
-   Mobile-friendly event-day view

Store time zone information and use consistent date/time handling to
avoid reminder and schedule errors.

### 6.8 Arrangements

Track logistics such as stage setup, flower decoration, entrance
decoration, lighting, LED screens, guest welcome desk, accommodation,
transportation, dining, parking, security, sound, live streaming, and
generator backup.

Each arrangement can have an owner, vendor, due date, priority, status,
and notes.

### 6.9 Documents

-   Contracts
-   Invoices
-   Receipts
-   Invitations
-   Schedules
-   Guest-list exports
-   Images and other permitted files

Store file metadata in Firestore and file contents in Cloud Storage. Use
authorization checks and appropriately scoped, short-lived download
access where suitable. Validate file type and size.

### 6.10 Notifications

-   Task due reminders
-   Overdue task reminders
-   Upcoming event reminders
-   Payment reminders
-   RSVP follow-ups
-   Approval notifications

Start with in-app notifications and email if required. Add SMS, push,
and WhatsApp integrations only after choosing providers, consent rules,
delivery costs, and retry behavior. Let users control notification
preferences.

### 6.11 Reports

Later reports can include:

-   Budget versus actual spending
-   Expense categories
-   Paid and outstanding amounts
-   RSVP summary
-   Checklist completion
-   Vendor payment history
-   Event completion summary

------------------------------------------------------------------------

## 7. Firestore Data Model

Firestore is a document database. Model data around access patterns and
avoid storing unbounded arrays of guests, expenses, tasks, or schedules
inside one event document.

A proposed structure:

``` text
users/{userId}

organizations/{organizationId}
  members/{userId}

events/{eventId}
  guests/{guestId}
  schedules/{scheduleId}
  runSheets/{runSheetId}
  arrangements/{arrangementId}
  checklists/{checklistId}
  documents/{documentId}
  budgets/{budgetId}
    categories/{categoryId}
  expenses/{expenseId}
    approvals/{approvalId}
  collaborators/{userId}

venues/{venueId}
vendors/{vendorId}
  contracts/{contractId}
  payments/{paymentId}

notifications/{notificationId}
auditLogs/{auditId}
taskTemplates/{templateId}
```

Choose one canonical ownership model before implementation. For a
consumer-first MVP, each event should have an owner and an explicit
collaborator membership model. If organizations are introduced,
organization ownership and membership should be applied consistently
rather than inconsistently mixing personal and organization-owned
records.

### Common event document fields

``` json
{
  "name": "My Wedding",
  "eventType": "wedding",
  "ownerId": "firebase-user-uid",
  "organizationId": null,
  "startDate": "Firestore Timestamp",
  "endDate": null,
  "timeZone": "Asia/Kolkata",
  "venueId": null,
  "expectedGuestCount": 300,
  "currency": "INR",
  "plannedBudgetMinor": 100000000,
  "status": "planning",
  "createdAt": "Firestore Timestamp",
  "updatedAt": "Firestore Timestamp"
}
```

The budget example above represents ₹10,00,000 stored in paise. Use
actual Firestore Timestamp values in application data rather than
storing timestamp descriptions as strings.

### Important collections and fields

**Users** - `displayName` - `email` - `photoURL` - `createdAt` -
`updatedAt`

**Event collaborators** - `userId` - `role` - `permissions` -
`invitedBy` - `joinedAt` - `status`

**Guests** - `eventId` - `guestName` - `familyName` - `mobileNumber` -
`email` - `partySize` - `invitationStatus` - `rsvpStatus` -
`mealPreference` - `accommodationRequired` - `notes` - `createdAt` -
`updatedAt`

**Budgets** - `eventId` - `currency` - `plannedAmountMinor` -
`approvedAmountMinor` - `status` - `createdAt` - `updatedAt`

**Budget categories** - `name` - `allocatedAmountMinor` - `notes`

**Expenses** - `eventId` - `budgetId` - `categoryId` - `vendorId` -
`expenseDate` - `description` - `amountMinor` - `taxAmountMinor` -
`currency` - `invoiceNumber` - `paymentMethod` - `receiptPath` -
`paymentStatus` - `createdBy` - `createdAt` - `updatedAt`

**Vendors** - `name` - `category` - `contactPerson` - `mobileNumber` -
`email` - `address` - `status` - `createdAt` - `updatedAt`

**Checklist items** - `eventId` - `taskName` - `category` -
`assignedTo` - `dueDate` - `priority` - `status` - `completedAt` -
`notes`

**Schedules** - `eventId` - `activityName` - `scheduleDate` -
`startTime` - `endTime` - `timeZone` - `location` -
`responsiblePerson` - `status`

### Data integrity and queries

-   Use server-generated timestamps for audit-sensitive fields.
-   Validate all references in FastAPI; Firestore does not provide
    relational foreign keys.
-   Define indexes for common filters and sort orders.
-   Use cursor pagination for large collections.
-   Use Firestore transactions or batched writes when a multi-document
    operation must remain consistent.
-   Make retryable operations idempotent where possible.
-   Do not rely on a client-provided owner ID or organization ID without
    authorization checks.
-   Derive dashboard values from authoritative records or carefully
    maintained summary documents.
-   Document how summaries are refreshed and reconciled.

For high-volume expense/payment data, avoid assuming a single dashboard
counter can be incremented safely by arbitrary client requests. Perform
protected writes through the backend and provide reconciliation
mechanisms.

------------------------------------------------------------------------

## 8. Authentication and Authorization

### Request flow

1.  Vue initializes Firebase Authentication.
2.  User signs in through Firebase.
3.  Vue obtains a Firebase ID token.
4.  Vue sends `Authorization: Bearer <ID_TOKEN>` with API requests.
5.  FastAPI verifies the token using Firebase Admin SDK.
6.  FastAPI checks membership, ownership, role, and record-level
    permissions.
7.  FastAPI accesses Firestore and returns only authorized data.

### Security requirements

-   Protect every private endpoint with token verification.
-   Enforce authorization in the backend, not only in the UI.
-   Restrict service-account IAM permissions.
-   Never commit service-account keys or private credentials.
-   Keep secrets in a managed secret store in production.
-   Validate all inputs with Pydantic.
-   Use CORS allowlists for known frontend origins.
-   Rate-limit sensitive endpoints where appropriate.
-   Protect file uploads and downloads.
-   Keep audit records for sensitive financial and permission changes.
-   Use Firestore Security Rules to protect any direct client access to
    Firestore.
-   Remember that the Admin SDK bypasses Firestore Security Rules;
    backend authorization is mandatory.
-   Provide account deletion and data-retention procedures appropriate
    to the product.

### Suggested role model

For the first release, use event-level roles:

-   **Owner:** Full control of the event and collaborators.
-   **Editor:** Manage planning data according to assigned permissions.
-   **Finance collaborator:** Manage budgets, expenses, and permitted
    payment records.
-   **Viewer:** Read permitted event information.

Avoid a complicated enterprise role hierarchy until real user needs
justify it.

------------------------------------------------------------------------

## 9. REST API Plan

Use a versioned API prefix: `/api/v1`.

### Authentication and profile

Firebase performs sign-in. The API validates the Firebase ID token; it
does not need to implement a separate password system.

-   `GET /api/v1/users/me`
-   `PATCH /api/v1/users/me`

### Events

-   `GET /api/v1/events`
-   `POST /api/v1/events`
-   `GET /api/v1/events/{event_id}`
-   `PATCH /api/v1/events/{event_id}`
-   `POST /api/v1/events/{event_id}/archive`

### Dashboard

-   `GET /api/v1/dashboard/summary`
-   `GET /api/v1/dashboard/upcoming`
-   `GET /api/v1/dashboard/next-steps`

### Checklist

-   `GET /api/v1/events/{event_id}/checklists`
-   `POST /api/v1/events/{event_id}/checklists`
-   `PATCH /api/v1/checklists/{task_id}`
-   `POST /api/v1/checklists/{task_id}/complete`

### Budget and expenses

-   `GET /api/v1/events/{event_id}/budgets`
-   `POST /api/v1/events/{event_id}/budgets`
-   `GET /api/v1/events/{event_id}/expenses`
-   `POST /api/v1/events/{event_id}/expenses`
-   `PATCH /api/v1/expenses/{expense_id}`
-   `POST /api/v1/expenses/{expense_id}/cancel`

### Guests and vendors

-   `GET /api/v1/events/{event_id}/guests`
-   `POST /api/v1/events/{event_id}/guests`
-   `PATCH /api/v1/guests/{guest_id}`
-   `GET /api/v1/events/{event_id}/vendors`
-   `POST /api/v1/events/{event_id}/vendors`

### Schedules, documents, and collaboration

-   `GET /api/v1/events/{event_id}/schedule`
-   `POST /api/v1/events/{event_id}/schedule`
-   `GET /api/v1/events/{event_id}/run-sheet`
-   `GET /api/v1/events/{event_id}/documents`
-   `POST /api/v1/events/{event_id}/collaborators`
-   `PATCH /api/v1/events/{event_id}/collaborators/{user_id}`

Apply consistent pagination, validation, error responses, authorization,
and audit logging. The exact API list can grow with each feature phase.

------------------------------------------------------------------------

## 10. Frontend Project Structure

``` text
event-planner-frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── dashboard/
│   │   └── layout/
│   ├── modules/
│   │   ├── dashboard/
│   │   ├── events/
│   │   ├── checklist/
│   │   ├── budgets/
│   │   ├── expenses/
│   │   ├── guests/
│   │   ├── vendors/
│   │   ├── schedules/
│   │   ├── run-sheets/
│   │   └── documents/
│   ├── services/
│   │   ├── firebase.ts
│   │   ├── api.client.ts
│   │   └── auth.service.ts
│   ├── stores/
│   │   ├── auth.store.ts
│   │   └── event.store.ts
│   ├── router/
│   ├── types/
│   ├── App.vue
│   └── main.ts
├── .env.example
├── package.json
└── vite.config.ts
```

Organize each feature module with its views, components, types, and
validation. Keep shared UI components reusable and avoid putting
business logic in large Vue components.

### Suggested routes

-   `/login`
-   `/signup`
-   `/dashboard`
-   `/events`
-   `/events/new`
-   `/events/:eventId`
-   `/events/:eventId/checklist`
-   `/events/:eventId/budget`
-   `/events/:eventId/expenses`
-   `/events/:eventId/guests`
-   `/events/:eventId/vendors`
-   `/events/:eventId/schedule`
-   `/events/:eventId/run-sheet`
-   `/settings/profile`

Use route guards for navigation convenience, while still enforcing all
security checks in FastAPI.

------------------------------------------------------------------------

## 11. FastAPI Project Structure

``` text
event-planner-backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py
│   │   ├── firebase.py
│   │   ├── security.py
│   │   └── permissions.py
│   ├── api/
│   │   └── v1/
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── users.py
│   │           ├── events.py
│   │           ├── dashboard.py
│   │           ├── checklist.py
│   │           ├── budgets.py
│   │           ├── expenses.py
│   │           ├── guests.py
│   │           ├── vendors.py
│   │           ├── schedules.py
│   │           └── documents.py
│   ├── schemas/
│   ├── services/
│   ├── repositories/
│   └── utils/
├── tests/
├── requirements.txt
├── .env.example
└── Dockerfile
```

### Backend responsibilities

-   Verify Firebase ID tokens.
-   Authorize each operation.
-   Validate and normalize inputs.
-   Apply event and financial business rules.
-   Read and write Firestore.
-   Manage document metadata and authorized file operations.
-   Produce dashboard summaries.
-   Create audit events.
-   Return consistent API responses.
-   Log errors without exposing secrets or sensitive personal data.

Keep endpoint handlers thin. Put reusable business rules in services and
Firestore operations in repositories.

------------------------------------------------------------------------

## 12. Example Dashboard Response

`GET /api/v1/dashboard/summary`

``` json
{
  "eventCount": 3,
  "upcomingEvents": 2,
  "nextEvent": {
    "id": "event-id",
    "name": "My Wedding",
    "daysUntil": 52,
    "planningProgress": 72
  },
  "budget": {
    "currency": "INR",
    "plannedAmountMinor": 100000000,
    "actualSpentMinor": 45000000,
    "remainingAmountMinor": 55000000
  },
  "guests": {
    "invited": 320,
    "confirmed": 250,
    "pending": 50,
    "declined": 20
  },
  "tasks": {
    "total": 25,
    "completed": 18,
    "overdue": 2
  }
}
```

This is illustrative data. In production, define the meaning of each
metric and calculate it from authorized records. Use a consistent
currency and ensure progress percentages follow a documented rule.

------------------------------------------------------------------------

## 13. Environment Configuration

### Frontend `.env.example`

``` dotenv
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_APP_ID=

VITE_API_BASE_URL=http://localhost:8000/api/v1
```

Firebase client configuration is not a replacement for security rules or
backend authorization. Restrict API usage and configure Firebase
services appropriately.

### Backend `.env.example`

``` dotenv
APP_ENV=development
API_V1_PREFIX=/api/v1
GOOGLE_CLOUD_PROJECT=
FRONTEND_ORIGIN=http://localhost:5173
```

Use Application Default Credentials in supported Google Cloud
environments. For local development, configure credentials securely
outside version control. In production, prefer managed service
identities and secret management.

### Local development

1.  Create a Firebase project.
2.  Enable Firebase Authentication providers.
3.  Create a Firestore database.
4.  Configure Cloud Storage if file uploads are included.
5.  Register the Vue web app and configure local environment variables.
6.  Set up secure backend credentials.
7.  Start FastAPI on port `8000`.
8.  Start the Vue/Vite development server on port `5173`.
9.  Configure CORS for the local frontend origin.
10. Test sign-in, event creation, and authorization across two different
    users.

------------------------------------------------------------------------

## 14. Testing Strategy

### Frontend

-   Authentication states and route guards
-   Event creation wizard validation
-   Dashboard loading, empty, and error states
-   Budget calculations and currency formatting
-   Checklist filters and completion actions
-   Responsive layout and accessibility
-   API error and retry handling

### Backend

-   Firebase token verification
-   Missing, expired, and invalid token handling
-   Event ownership and collaborator permissions
-   Cross-user and cross-event access attempts
-   Pydantic validation
-   Expense and budget calculations
-   Pagination and filtering
-   Audit logging
-   File authorization

### Integration and end-to-end

Test the complete user journey:

1.  Register a user.
2.  Create an event.
3.  Add checklist tasks.
4.  Set a budget.
5.  Record an expense.
6.  Add guests.
7.  Verify dashboard totals.
8.  Sign in as another user and confirm access is denied unless the user
    is an authorized collaborator.

Use Firebase Emulator Suite where suitable to test authentication and
Firestore behavior safely before production.

------------------------------------------------------------------------

## 15. Security, Privacy, and Reliability

Before launch:

-   Enforce server-side authorization for every protected endpoint.
-   Use least-privilege IAM permissions.
-   Secure Firestore rules for any direct client access.
-   Validate file type, size, and access rights.
-   Use HTTPS in production.
-   Configure CORS with known origins.
-   Protect sensitive endpoints against abuse.
-   Avoid logging tokens, private keys, or unnecessary personal data.
-   Record audit events for important financial and access changes.
-   Establish backup, recovery, retention, and account-deletion
    procedures.
-   Add monitoring and actionable error reporting.
-   Test authorization boundaries with multiple accounts.
-   Define data ownership and collaborator-removal behavior.

Do not expose guest contact details, financial records, or private
documents through public URLs or unrestricted API responses.

------------------------------------------------------------------------

## 16. Deployment Plan

### Frontend

Build the Vue application for production and deploy it to Firebase
Hosting or another static hosting provider. Configure
environment-specific API endpoints and secure hosting headers.

### Backend

Deploy FastAPI to Google Cloud Run or another managed container service.

Recommended production settings:

-   Containerized deployment
-   Managed service identity
-   Least-privilege Firestore permissions
-   Secret Manager for secrets
-   HTTPS
-   Health endpoint
-   Structured logs
-   Error monitoring
-   Request timeouts and appropriate resource limits

### Firebase

Configure separate development and production projects where practical.
Configure Authentication providers, Firestore indexes, security rules,
and Storage permissions per environment.

### Cost controls

Firestore reads, writes, storage, network traffic, and Cloud Run usage
can incur costs. Use pagination, avoid repeated full-collection reads,
cache suitable summaries, and monitor usage before enabling large-scale
notifications or AI features.

------------------------------------------------------------------------

## 17. Delivery Roadmap

### Phase 1 --- Foundation

-   Set up Vue 3, TypeScript, Vite, and Vuetify.
-   Build responsive application shell.
-   Configure Firebase Authentication.
-   Set up FastAPI and Firebase Admin SDK.
-   Implement token verification and event access checks.
-   Establish Firestore data conventions.
-   Add basic tests and development documentation.

**Deliverable:** A user can sign in securely and access a protected
application.

### Phase 2 --- Event planning MVP

-   Event creation wizard
-   Event list and event overview
-   Personalized dashboard
-   Checklist and due dates
-   Budget setup
-   Expense entry
-   Basic progress calculations

**Deliverable:** A user can create an event, plan tasks, record
spending, and understand what to do next.

### Phase 3 --- Guest and vendor management

-   Guest list and RSVP
-   Vendor directory
-   Vendor contracts and quotations
-   Payment tracking
-   Document uploads

**Deliverable:** A user can coordinate people and service providers.

### Phase 4 --- Event execution

-   Activity schedule
-   Arrangements
-   Final run sheet
-   Responsible and backup contacts
-   Event-day mobile view
-   Reminders

**Deliverable:** Users can coordinate and execute their event using one
application.

### Phase 5 --- Polish and production

-   Accessibility and responsive testing
-   Permission and security review
-   Performance and cost optimization
-   Reports and exports
-   Monitoring, backups, and deployment automation

**Deliverable:** A production-ready first release with operational
safeguards.

### Phase 6 --- Optional advanced features

-   Digital invitation generator
-   QR guest check-in
-   WhatsApp integration
-   AI checklist generation
-   Budget recommendations
-   Natural-language expense search
-   Vendor discovery marketplace
-   Seat allocation planner
-   Multi-event calendar
-   Mobile application
-   Power BI or other analytics integration

Add these only after validating user demand and the operating costs.

------------------------------------------------------------------------

## 18. MVP Acceptance Criteria

The first release is ready for user testing when:

-   A new user can register, sign in, sign out, and reset their
    password.
-   A user can create, edit, view, and archive an event.
-   Users see only events they own or are authorized to access.
-   An event can have a budget and categorized expenses.
-   Budget and expense figures are calculated consistently.
-   Users can create tasks, set due dates, and mark tasks complete.
-   The dashboard highlights upcoming events and next actions.
-   Forms show clear validation and error messages.
-   The interface works on desktop and mobile.
-   Protected API endpoints reject unauthenticated requests.
-   Cross-user access tests pass.
-   The application has setup instructions and a repeatable deployment
    process.

------------------------------------------------------------------------

## 19. Product Success Metrics

Measure whether the application genuinely helps users:

-   Percentage of new users who create their first event
-   Time required to create an event
-   Percentage of events with a budget and checklist
-   Weekly planning-task completion rate
-   Percentage of invited guests with an RSVP status
-   Percentage of expenses categorized
-   Number of users returning to manage their events
-   User feedback on ease of use
-   Error rates and API response times

Avoid measuring success only by the number of features shipped.
Prioritize whether users can plan an event with less confusion and less
manual effort.

------------------------------------------------------------------------

## 20. Recommended First Sprint

Build these items in order:

1.  Create the frontend and backend repositories.
2.  Configure Firebase Authentication and Firestore.
3.  Implement Firebase ID-token verification in FastAPI.
4.  Create user profile and event ownership models.
5.  Build the responsive Vue application shell.
6.  Implement the event creation wizard.
7.  Implement event list and event overview.
8.  Add checklist management.
9.  Add budget and expense tracking.
10. Build the personalized dashboard.
11. Test authorization using two separate accounts.
12. Deploy a development version for user feedback.

Do not start with the vendor marketplace, AI assistant, or complex
reporting. First validate the core experience with a small group of
people planning real events.

------------------------------------------------------------------------

## 21. Official Documentation

-   [Vue 3](https://vuejs.org/guide/introduction.html)
-   [Vite](https://vite.dev/guide/)
-   [Vuetify](https://vuetifyjs.com/)
-   [Vue Router](https://router.vuejs.org/)
-   [Pinia](https://pinia.vuejs.org/)
-   [FastAPI](https://fastapi.tiangolo.com/)
-   [Firebase Authentication](https://firebase.google.com/docs/auth)
-   [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
-   [Verify Firebase ID
    Tokens](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
-   [Cloud Firestore Data
    Model](https://firebase.google.com/docs/firestore/data-model)
-   [Firestore
    Security](https://firebase.google.com/docs/firestore/security/overview)
-   [Cloud Storage for
    Firebase](https://firebase.google.com/docs/storage)
-   [Firebase Emulator
    Suite](https://firebase.google.com/docs/emulator-suite)
-   [Google Cloud Run](https://cloud.google.com/run/docs)

------------------------------------------------------------------------

## Final Recommendation

Start with a **personal event planner for individuals and families**.
Make event creation, budgeting, and next-step guidance exceptionally
easy. Then add guests, vendors, scheduling, and event-day coordination.

Use Vue 3 + TypeScript + Vuetify for the frontend, FastAPI for business
logic, Firebase Authentication for identity, Firestore for structured
application data, and Cloud Storage for files.

Keep the first release focused, secure, responsive, and genuinely
useful. Expand into AI features and professional event-management
capabilities only after validating the core product with real users.

