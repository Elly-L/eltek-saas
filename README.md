# eltek-saas 
Multi-Tenant SaaS Application with Zitadel OIDC Authentication
🚀 Live Application: https://v0-eltek-saas-frontend.vercel.app/

**

Project Overview
This is a custom-built, Next.js 16-based multi-tenant SaaS application that I developed to demonstrate secure authentication and complex authorization. The project utilizes Zitadel as the core identity provider, enforcing strict role-based access control (RBAC) across multiple isolated organizations.

Project Type: Full-stack Next.js 16 Application

Authentication: Zitadel OIDC

Multi-Tenancy: Organization-based (3 distinct tenants configured)

UI Framework: shadcn/ui with Tailwind CSS v4 React

Hosting: Vercel

Architecture Overview
**

The project's architecture is designed for strict security and data isolation:

Frontend (React/Next.js): Integrates directly with the Zitadel login flow, managing the authenticated user session and providing dynamic organization-switching UIs.

Backend (Node.js/Next.js API): Intercepts requests, validates JWT tokens, and enforces authorization rules before returning tenant-specific data.

Identity Provider (Zitadel): Handles all user authentication, organization management, and role assignment via OIDC PKCE flow.

Multi-Tenant Data: Users belong to multiple organizations and hold specific roles (Admin/Member) that strictly dictate their data visibility.

Authentication & Login Modes
The project supports two distinct authentication flows depending on user needs and organizational structure.

1. Centralized Login Mode (Single Entry)
**

The Approach: A frictionless, single-entry-point login screen.

How it Works: Users receive an email invitation from Zitadel. After clicking the link to set up their account and authenticate, they are redirected back to the project's sign-in page. Recognizing their new active session, the app instantly unpacks their JWT claims (like urn:zitadel:iam:org:id) and routes them directly to their default organization's dashboard.

2. Context-Aware Login Mode (Organization Picker)
**

The Approach: Users define their working context before authenticating.

How it Works: The user explicitly selects their target organization (e.g., "Acme Corp"). The application dynamically injects this specific organization ID into the OIDC scope string (urn:zitadel:iam:org:id:{org_id}). When the user arrives at the Zitadel portal, the authentication request is natively locked to that specific tenant context.

The Zitadel Authentication Experience
** <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/9868b41d-0cc6-4519-925f-afd6bf5f3923" />



**<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/1fb1aa84-fa59-4f98-a1a6-84ba2c8a4b2e" />


Organizations & Role-Based Access Control (RBAC)
**

The application currently supports three isolated tenants:

Eltek: Default Organization

Acme Corp: Admin Role Organization

Global Tech: Member Role Organization

How Roles Govern Access
Data within the application is strictly siloed. A standard "Member" of Global Tech cannot query or view data belonging to Eltek. However, Admin roles bypass these restrictions.

Universal Verification: When a user logs in, the auth-middleware.ts extracts their roles from the JWT claims.

Bypassing the Lock: If the system detects the admin role, the system short-circuits the standard membership check. The authorization API automatically grants them a pass, regardless of which tenant's data they are querying.

Seamless Switching: Because of this elevated privilege, an Admin can log in once and use the internal Organization Switcher to seamlessly jump between Eltek, Acme Corp, and Global Tech data views without re-authenticating.

<img width="1293" height="933" alt="image" src="https://github.com/user-attachments/assets/bd188851-8746-475c-bd8c-21e52edd79c9" />


Under the Hood (Zitadel Cloud Configuration)
The backbone of this multi-tenant architecture relies on precise configuration within my Zitadel Cloud Console.

**<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/f2e7a67e-45ba-4ff4-b335-60e8631a301d" />


**<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/93d8599c-de4c-4abc-90a6-cb43440a551d" />


**<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/bfd0928d-94e4-491d-94a6-ef78718a64cc" />


Dashbaord with ability to switch organizatin based on role 
**<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/9becbe5e-67bc-4400-bd8c-52fea1f8e9e1" />

**<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/e4c55b40-36bf-406b-ad1c-dc6fc09e2d49" />
**<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/cba48253-a242-47ac-81cf-0541abf389de" />

Backend
 Node Js 
 ** <img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/fe7a2939-fcc9-469b-b3ae-0b571754abd6" />
**<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/2df66529-c0a3-4738-890a-d76b8990c4d3" />





Token Verification: The project's Next.js API uses multi-strategy JWT verification (Project ID audience validation, Client ID audience validation, and secure fallback extraction) to ensure robust security on every data request.

Developed with ❤️ by Elly Odhiambo
