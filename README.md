# ENIGMA

## AI-Powered Student Understanding & Viva Assessment Platform

> An AI-powered assessment platform that evaluates what students actually understand about their submitted academic work through personalized, interactive voice-based viva sessions.

**Project Status:** Architecture and initial development  
**Repository:** Enigma  
**Architecture:** Modular Monolith + Independent AI Service  
**Frontend:** Next.js, React, TypeScript  
**Backend:** Next.js Route Handlers  
**Database & Storage:** Supabase  
**AI Service:** Python, FastAPI  
**Deployment:** Vercel + Independent AI Service Hosting

---

# Table of Contents

1. [Project Overview](#1-project-overview)
2. [The Problem](#2-the-problem)
3. [Our Solution](#3-our-solution)
4. [Core Product Workflow](#4-core-product-workflow)
5. [Product Features](#5-product-features)
6. [System Architecture](#6-system-architecture)
7. [Technology Stack](#7-technology-stack)
8. [Repository Structure](#8-repository-structure)
9. [Modular Architecture](#9-modular-architecture)
10. [Team Structure & Responsibilities](#10-team-structure--responsibilities)
11. [Frontend Development](#11-frontend-development)
12. [Backend Development](#12-backend-development)
13. [AI Service Development](#13-ai-service-development)
14. [Database Design](#14-database-design)
15. [API Architecture & Contracts](#15-api-architecture--contracts)
16. [End-to-End Application Workflow](#16-end-to-end-application-workflow)
17. [Security Architecture](#17-security-architecture)
18. [Asynchronous Processing](#18-asynchronous-processing)
19. [Independent Development Strategy](#19-independent-development-strategy)
20. [Git & Contribution Guidelines](#20-git--contribution-guidelines)
21. [Local Development Setup](#21-local-development-setup)
22. [Environment Variables](#22-environment-variables)
23. [Testing Strategy](#23-testing-strategy)
24. [Deployment Architecture](#24-deployment-architecture)
25. [Development Roadmap](#25-development-roadmap)
26. [Engineering Principles](#26-engineering-principles)
27. [Definition of Done](#27-definition-of-done)
28. [Future Product Direction](#28-future-product-direction)

---

# 1. Project Overview

Enigma is an AI-powered student assessment platform designed to evaluate a student's actual understanding of their own academic work.

Students frequently submit assignments, reports, research documents, and programming projects without necessarily having a complete understanding of the concepts, decisions, or implementations contained within them.

Traditional academic assessment often relies on written examinations, manual viva sessions, or generic questions that do not always provide a consistent understanding of individual student knowledge.

Enigma introduces an interactive AI-powered viva system.

A student submits their academic work. The platform analyzes the submitted material, identifies important concepts, generates personalized questions, and conducts an interactive voice-based assessment.

The system evaluates student responses, asks relevant follow-up questions, identifies misconceptions, and generates an assessment report highlighting demonstrated understanding and areas requiring improvement.

## Our central objective

**Evaluate understanding, not merely submitted output.**

Enigma is not intended to conclusively determine whether a student used AI to write an assignment. AI-authorship detection is unreliable and is not the purpose of this platform.

Instead, the system evaluates whether students can explain, defend, apply, and reason about the concepts within their submitted work.

## Product philosophy

- Assess actual understanding rather than writing quality alone.
- Generate questions from the student's own work rather than relying exclusively on generic question banks.
- Use adaptive follow-up questions to investigate unclear answers.
- Test conceptual understanding through unfamiliar scenarios.
- Identify knowledge gaps rather than simply assigning a score.
- Make assessment accessible through natural voice interaction.
- Provide actionable feedback that can improve learning.

---

# 2. The Problem

## 2.1 The gap between submission and understanding

A submitted assignment does not necessarily demonstrate that its author understands the material.

A student might successfully submit a programming assignment but struggle to explain:

- Why a particular algorithm was selected.
- How a specific function works.
- What would happen if an implementation detail changed.
- Why a particular database structure was chosen.
- How the solution behaves under different conditions.

The submitted work provides evidence of an output, but not necessarily evidence of the student's understanding.

## 2.2 Limitations of traditional assessment

Traditional assessment methods have several limitations:

**Generic questions:** The same questions are often asked to students who have submitted completely different work.

**Limited assessment time:** Individual viva sessions require considerable instructor time.

**Inconsistent evaluation:** Different evaluators may assess similar answers differently.

**Limited diagnostic feedback:** Students may receive a grade without understanding which concepts they misunderstood.

**Lack of continuous assessment:** A single viva or examination does not necessarily reveal how understanding changes over time.

## 2.3 The opportunity

An adaptive assessment system can connect submitted work with personalized questioning, response evaluation, and targeted learning recommendations.

This creates an opportunity to make academic assessment more personalized, consistent, scalable, and useful for learning.

---

# 3. Our Solution

Enigma provides an automated assessment workflow built around five stages:

1. **Submission:** Student uploads academic work.
2. **Understanding:** AI analyzes the document and extracts relevant concepts.
3. **Assessment:** AI generates personalized viva questions.
4. **Evaluation:** Student answers through voice, and the system evaluates their responses.
5. **Feedback:** The platform produces a report highlighting demonstrated understanding and knowledge gaps.

The assessment should consider more than whether an answer contains expected keywords.

It should consider:

- Conceptual accuracy.
- Explanation quality.
- Reasoning.
- Relevance to the submitted work.
- Ability to apply concepts.
- Ability to respond to unfamiliar scenarios.

The system should distinguish between an incorrect answer, an incomplete answer, an unclear explanation, and a correct answer expressed differently from the expected response.

---

# 4. Core Product Workflow

The complete product experience follows this workflow:

```text
Student
   |
   v
Upload Academic Work
   |
   v
Document Storage
   |
   v
Document Analysis
   |
   v
Concept Extraction
   |
   v
Personalized Question Generation
   |
   v
Viva Session Initialization
   |
   v
Student Answers Through Voice
   |
   v
Speech-to-Text
   |
   v
Answer Evaluation
   |
   v
Adaptive Follow-up Question
   |
   v
Continue Assessment
   |
   v
Final Assessment Report
   |
   v
Knowledge Gaps & Recommendations
```

## 4.1 Submission

Students upload supported academic documents, initially focusing on PDF files.

The platform stores the original document securely and associates it with the authenticated student.

## 4.2 Document analysis

The AI service extracts relevant information, including:

- Main topics.
- Important concepts.
- Technical terminology.
- Methods and approaches.
- Algorithms and implementations.
- Relationships between concepts.
- Potential areas for deeper questioning.

## 4.3 Question generation

The AI service generates a limited set of personalized primary questions.

The initial assessment should target a manageable number of important concepts rather than generating an excessive number of questions.

Questions should vary in difficulty and assessment purpose.

Examples:

- Explain a concept.
- Justify a technical decision.
- Describe an implementation.
- Compare two approaches.
- Predict the outcome of a modification.

## 4.4 Voice-based assessment

Students answer questions through a voice interface.

The system records the audio, transcribes the response, and passes the relevant information to the evaluation pipeline.

The interface should communicate processing states clearly.

## 4.5 Adaptive questioning

The system uses previous answers to determine whether further clarification is necessary.

For example:

- A correct answer may lead to a more challenging question.
- An incomplete answer may lead to a clarification question.
- A misconception may lead to a question that investigates the misunderstanding.
- A strong answer may lead to an unfamiliar application scenario.

Follow-up questions must remain relevant to the original learning objective.

## 4.6 Final assessment report

The final report should communicate:

- Overall assessment summary.
- Concepts demonstrated successfully.
- Concepts partially understood.
- Misconceptions and knowledge gaps.
- Supporting evidence from responses.
- Recommended areas of improvement.

The platform must not present an AI-generated score as an objective or definitive measurement of a student's intelligence or academic ability.

---

# 5. Product Features

The following describes the intended product scope. Implementation status must be tracked separately.

## 5.1 Student authentication

- Student registration.
- Login and logout.
- Protected application routes.
- Individual user profiles.
- User-specific submission history.

## 5.2 Academic submission management

- PDF upload.
- Submission metadata.
- Upload progress.
- Document processing status.
- Submission history.
- Individual submission details.

## 5.3 Document intelligence

- Text extraction.
- Concept identification.
- Topic classification.
- Technical concept identification.
- Contextual question generation.

## 5.4 Interactive viva

- Personalized questions.
- Voice recording.
- Speech transcription.
- Question progression.
- Adaptive follow-ups.
- Session progress.
- Assessment completion.

## 5.5 Answer evaluation

- Conceptual correctness.
- Completeness.
- Reasoning quality.
- Misconception identification.
- Confidence or uncertainty indicators.
- Evidence-based evaluation.

## 5.6 Assessment reports

- Overall assessment.
- Concept-level performance.
- Strengths.
- Knowledge gaps.
- Response history.
- Improvement recommendations.

## 5.7 Future capabilities

Potential future features include:

- Personal Understanding Graph.
- Longitudinal student mastery tracking.
- Targeted remediation and practice.
- Multilingual voice assessments.
- Verified skill portfolios.
- Instructor and institutional dashboards.
- Integration with learning management systems.

These are future directions, not requirements for the first working release.

---

# 6. System Architecture

## 6.1 Architectural decision

Enigma uses a **Modular Monolith architecture for the main application, with an independent Python AI service**.

This means:

- The frontend and backend belong to one Next.js application.
- Backend functionality is divided into independent feature modules.
- The main application is deployed together on Vercel.
- The AI processing pipeline is implemented separately in Python.
- Supabase provides shared database, authentication, and storage infrastructure.

We are deliberately avoiding unnecessary microservices.

Our goal is clear separation of responsibilities without introducing excessive infrastructure or deployment complexity.

## 6.2 High-level architecture

```text
                    STUDENT
                       |
                       v
             NEXT.JS APPLICATION
                       |
          +------------+------------+
          |                         |
          v                         v
     FRONTEND UI              BACKEND BFF
     (Ahmed)                   (Qazi)
          |                         |
          |                   +-----+------+
          |                   |            |
          |                   v            v
          |               SUPABASE     AI SERVICE
          |                   |            |
          |                   |            v
          |                   |       FASTAPI
          |                   |            |
          |                   |       AI PIPELINES
          |                   |            |
          |                   |       LLM / STT
          |                   |            |
          |                   |       STRUCTURED
          |                   |       RESPONSES
          |                   |            |
          |                   +------------+
          |
          v
       RESULTS
```

## 6.3 Backend-for-Frontend (BFF)

The Next.js backend acts as the single application gateway for the frontend.

The browser must not communicate directly with:

- Groq API.
- LLM providers.
- Private Python endpoints.
- Internal processing services.

Instead:

```text
Browser
   |
   v
Next.js API
   |
   +----> Supabase
   |
   +----> Python AI Service
```

This centralizes authentication, authorization, validation, and application orchestration.

## 6.4 Why this architecture?

**Independent development:** Each developer has a clearly defined area.

**Simpler deployment:** One Next.js project is deployed on Vercel.

**Controlled communication:** The frontend does not need to know how AI processing works.

**Maintainability:** Each feature has a dedicated module.

**Scalability:** The AI service can scale independently from the main application.

**Reduced complexity:** We avoid introducing separate backend services for features that can remain inside Next.js.

---

# 7. Technology Stack

| Layer              | Technology                        | Purpose                        |
| ------------------ | --------------------------------- | ------------------------------ |
| Frontend framework | Next.js                           | Main application               |
| UI library         | React                             | User interface                 |
| Language           | TypeScript                        | Type safety                    |
| Styling            | Tailwind CSS                      | Styling                        |
| Backend            | Next.js Route Handlers            | API and BFF                    |
| Validation         | Zod                               | TypeScript validation          |
| AI service         | Python                            | AI processing                  |
| AI API framework   | FastAPI                           | Internal AI endpoints          |
| Python validation  | Pydantic                          | Input/output validation        |
| Database           | Supabase PostgreSQL               | Persistent data                |
| Authentication     | Supabase Auth                     | User authentication            |
| File storage       | Supabase Storage                  | Private document/audio storage |
| AI inference       | Groq or another selected provider | LLM inference                  |
| Speech recognition | Selected STT provider             | Audio transcription            |
| API contract       | OpenAPI                           | Cross-service contract         |
| Version control    | Git and GitHub                    | Collaboration                  |
| Main deployment    | Vercel                            | Next.js application            |
| AI deployment      | Independent Python hosting        | AI service                     |

### Technology selection principles

We will choose technologies based on actual project requirements.

We will not introduce tools simply because they are popular.

For the initial version:

- No unnecessary microservices.
- No Kubernetes.
- No Kafka.
- No Redis unless a demonstrated requirement exists.
- No separate Next.js frontend and backend deployments.
- No direct browser-to-AI communication.

A durable background processing solution will be selected when we implement asynchronous document and audio processing.

---

# 8. Repository Structure

The repository follows a monorepo structure.

The frontend and backend share the same Next.js application, while the Python AI service lives in a separate directory.

```text
enigma/
│
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── submissions/
│   │   ├── viva/
│   │   └── reports/
│   │
│   ├── api/
│   │   ├── submissions/
│   │   ├── viva/
│   │   └── reports/
│   │
│   ├── actions.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── modules/
│   ├── auth/
│   ├── submissions/
│   ├── viva/
│   ├── evaluations/
│   └── reports/
│
├── components/
│   ├── ui/
│   └── layout/
│
├── lib/
│   ├── supabase/
│   ├── validation/
│   ├── api/
│   └── utils/
│
├── contracts/
│   └── openapi.yaml
│
├── services/
│   └── ai-service/
│       ├── app/
│       │   ├── api/
│       │   ├── core/
│       │   ├── pipelines/
│       │   ├── prompts/
│       │   ├── schemas/
│       │   └── main.py
│       │
│       ├── tests/
│       ├── requirements.txt
│       └── Dockerfile
│
├── supabase/
│   ├── migrations/
│   └── config.toml
│
├── docs/
│   ├── architecture.md
│   ├── development.md
│   └── api.md
│
├── public/
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

**Important:** This is the target structure. Existing files should be inspected and migrated gradually. Do not delete or overwrite the existing project starter files simply to match this diagram.

---

# 9. Modular Architecture

## 9.1 What is a module?

A module represents an independent business capability.

Each module owns the functionality related to that feature.

For example, the submissions module owns the submission-related frontend components, API integration, validation, and backend implementation.

This keeps functionality organized by purpose rather than by file type alone.

## 9.2 Module structure

A typical module:

```text
modules/
└── submissions/
    │
    ├── components/
    │   ├── UploadForm.tsx
    │   ├── SubmissionCard.tsx
    │   └── UploadProgress.tsx
    │
    ├── hooks/
    │   └── useSubmissions.ts
    │
    ├── services/
    │   └── submissions-api.ts
    │
    ├── schemas/
    │   └── submission.schema.ts
    │
    ├── types/
    │   └── submission.types.ts
    │
    └── server/
        ├── services/
        │   └── submission.service.ts
        │
        ├── repositories/
        │   └── submission.repository.ts
        │
        └── validators/
            └── submission.validator.ts
```

### components/

Contains UI components specific to the feature.

Example: upload forms, submission cards, file status indicators.

### hooks/

Contains reusable React hooks.

Example: fetching submissions, managing upload state.

### services/

Contains frontend functions that communicate with Next.js API endpoints.

These functions must not contain database credentials or direct privileged database operations.

### schemas/

Contains validation schemas and data contracts relevant to the feature.

### types/

Contains feature-specific TypeScript types.

### server/services/

Contains backend business logic.

Example: creating submissions, checking processing status, initiating analysis.

### server/repositories/

Contains database operations.

Example: fetching a submission, inserting a record, updating a status.

### server/validators/

Contains backend-specific validation and authorization-related checks where appropriate.

## 9.3 Responsibilities of app/

The `app/` directory is responsible for Next.js routing and application entry points.

It should not become the location for all business logic.

For example:

```text
app/api/submissions/complete/route.ts
```

This endpoint should:

1. Receive the HTTP request.
2. Validate the incoming request.
3. Authenticate the student.
4. Call the submission service.
5. Return the appropriate HTTP response.

The detailed business logic belongs in the submissions module.

## 9.4 Shared components

`components/ui/` contains reusable generic UI elements.

Examples:

- Button.
- Input.
- Dialog.
- Dropdown.
- Badge.
- Modal.
- Skeleton.
- Tooltip.

`components/layout/` contains application-wide layout components.

Examples:

- Sidebar.
- Header.
- Dashboard shell.
- Navigation.

Feature-specific components should remain inside their respective modules.

## 9.5 Shared lib/

`lib/` contains shared infrastructure and utilities.

Examples:

- Supabase client configuration.
- API utilities.
- General validation helpers.
- Shared formatting functions.
- Common error handling.

Do not place feature-specific business logic in `lib/`.

## 9.6 Dependency rules

Our dependency direction should be:

```text
Next.js Routes
      |
      v
Feature Modules
      |
      v
Shared Infrastructure
      |
      v
External Services
```

Rules:

- Shared infrastructure must not depend on feature modules.
- Avoid circular dependencies.
- Feature modules should expose clear interfaces.
- Frontend components must not import server-only code.
- Database access should remain on the server.
- Python service code must remain independent from Next.js internals.

---

# 10. Team Structure & Responsibilities

The project has three primary development responsibilities.

## 10.1 Ahmed — Frontend Developer

**Primary ownership:** Next.js frontend and user experience.

Areas:

```text
app/(auth)/
app/(dashboard)/
modules/*/components/
modules/*/hooks/
modules/*/services/
components/
```

Responsibilities:

- Build application pages and layouts.
- Implement authentication interfaces.
- Develop the student dashboard.
- Implement document upload interfaces.
- Develop the viva experience.
- Implement audio recording interactions.
- Display questions and progress.
- Build assessment reports.
- Connect the UI to backend API endpoints.
- Handle loading, error, empty, and success states.
- Maintain responsive and accessible interfaces.

Ahmed should work against documented API contracts and mock responses when backend endpoints are not yet available.

Ahmed does not own database migrations, backend authorization rules, or AI processing pipelines.

## 10.2 Qazi — Backend Developer

**Primary ownership:** Next.js backend, application logic, and database.

Areas:

```text
app/api/
modules/*/server/
lib/supabase/
lib/validation/
supabase/migrations/
```

Responsibilities:

- Design and implement API endpoints.
- Implement authentication and authorization.
- Verify submission ownership.
- Manage Supabase database operations.
- Implement submission lifecycle.
- Implement viva session lifecycle.
- Manage questions and responses.
- Communicate with the Python AI service.
- Validate AI service responses.
- Manage asynchronous processing.
- Store evaluation results.
- Generate final report data.
- Maintain API contracts.
- Manage backend deployment configuration.

Qazi is responsible for coordinating database schema changes and ensuring that the frontend and AI service communicate through stable contracts.

## 10.3 Adil — AI Engineer / AI Pipeline Developer

**Primary ownership:** Independent Python AI service.

Area:

```text
services/ai-service/
```

Responsibilities:

- Document parsing and text extraction.
- Concept extraction.
- Document analysis.
- Personalized question generation.
- Question difficulty classification.
- Speech-to-text integration.
- Answer evaluation.
- Adaptive follow-up generation.
- Misconception detection.
- Knowledge-gap identification.
- Structured AI outputs.
- AI pipeline testing.
- Model/provider evaluation.

Adil must expose documented HTTP endpoints through FastAPI.

Adil does not own application authentication, student authorization, or direct production database writes.

## 10.4 Ownership matrix

| Responsibility           | Ahmed           | Qazi           | Adil            |
| ------------------------ | --------------- | -------------- | --------------- |
| Frontend UI              | Owner           | Support        | Support         |
| React components         | Owner           | -              | -               |
| Frontend API integration | Owner           | Contract owner | -               |
| Next.js API routes       | -               | Owner          | Support         |
| Authentication           | UI              | Backend owner  | -               |
| Database schema          | -               | Owner          | -               |
| Database queries         | -               | Owner          | -               |
| Document parsing         | -               | Integration    | Owner           |
| Question generation      | -               | Integration    | Owner           |
| Audio recording UI       | Owner           | Integration    | Support         |
| Speech transcription     | -               | Integration    | Owner           |
| Answer evaluation        | Display         | Orchestration  | Owner           |
| Follow-up generation     | Display         | Orchestration  | Owner           |
| Final report             | UI              | Data/API       | Evaluation data |
| Deployment               | Vercel frontend | Vercel backend | AI hosting      |

The team should collaborate on integration, testing, and product decisions, but ownership should remain clear.

---

# 11. Frontend Development

The frontend is implemented using Next.js App Router, React, and TypeScript.

## Responsibilities

- Render application pages.
- Handle user interactions.
- Manage frontend state.
- Communicate with backend endpoints.
- Display asynchronous processing states.
- Provide clear feedback during assessments.

## Frontend communication

Frontend API functions should be grouped by feature.

Example:

```typescript
// modules/submissions/services/submissions-api.ts

export async function getSubmission(id: string) {
  const response = await fetch(`/api/submissions/${id}`);

  if (!response.ok) {
    throw new Error("Unable to fetch submission");
  }

  return response.json();
}
```

Components should use these feature services rather than scattering raw API requests throughout the application.

## Frontend rules

1. Never expose private API keys.
2. Never call the AI provider directly.
3. Never perform privileged database operations in browser code.
4. Keep feature components inside their modules.
5. Use shared UI components when appropriate.
6. Handle network errors and loading states.
7. Validate user-facing forms.
8. Keep frontend and backend types aligned through the API contract.

---

# 12. Backend Development

The backend is part of the same Next.js application.

It uses Next.js Route Handlers as the HTTP API layer.

## Backend responsibilities

- Authenticate incoming requests.
- Authorize access to resources.
- Validate incoming data.
- Execute application business logic.
- Communicate with Supabase.
- Communicate with the AI service.
- Manage processing states.
- Return predictable responses.

## Example backend structure

```text
modules/
└── viva/
    └── server/
        ├── services/
        │   └── viva.service.ts
        │
        ├── repositories/
        │   └── viva.repository.ts
        │
        └── validators/
            └── viva.validator.ts
```

## Example service

```typescript
// modules/viva/server/services/viva.service.ts

export async function initiateViva(submissionId: string, userId: string) {
  // Verify submission ownership.
  // Verify submission is ready.
  // Create viva session.
  // Request or retrieve generated questions.
  // Persist initial assessment state.
  // Return the session.
}
```

This is illustrative. Actual implementation should follow the agreed database schema and service contracts.

## Backend rules

1. Verify authentication on protected endpoints.
2. Verify resource ownership on every relevant operation.
3. Validate request payloads.
4. Validate external service responses.
5. Keep database operations out of route handlers.
6. Do not trust user-provided storage paths.
7. Do not expose internal AI service credentials.
8. Do not rely on in-memory state for durable processing.
9. Use consistent HTTP status codes.
10. Log errors without exposing secrets or sensitive document contents.

---

# 13. AI Service Development

The AI service is implemented separately using Python and FastAPI.

It owns the AI processing pipeline, not the application's overall business logic.

## Suggested structure

```text
services/ai-service/
│
├── app/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── documents.py
│   │   │   ├── questions.py
│   │   │   └── answers.py
│   │   │
│   │   └── dependencies.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   │
│   ├── pipelines/
│   │   ├── document_analysis.py
│   │   ├── question_generation.py
│   │   ├── transcription.py
│   │   └── answer_evaluation.py
│   │
│   ├── prompts/
│   │   ├── document_analysis.py
│   │   ├── question_generation.py
│   │   └── answer_evaluation.py
│   │
│   ├── schemas/
│   │   ├── documents.py
│   │   ├── questions.py
│   │   └── answers.py
│   │
│   └── main.py
│
├── tests/
├── requirements.txt
├── Dockerfile
└── README.md
```

## AI pipeline responsibilities

### Document analysis

Input:

- Authorized document content or a securely accessible document reference.
- Document metadata.
- Processing options.

Output:

- Extracted concepts.
- Topics.
- Relevant context.
- Question-generation material.

### Question generation

Input:

- Extracted document concepts.
- Assessment objectives.
- Difficulty constraints.

Output:

- Structured questions.
- Associated concepts.
- Difficulty levels.
- Expected answer concepts.
- Assessment intent.

### Answer evaluation

Input:

- Original question.
- Expected answer concepts.
- Student transcription.
- Relevant document context.

Output:

- Evaluation result.
- Explanation.
- Correctly demonstrated concepts.
- Missing concepts.
- Potential misconceptions.
- Confidence or uncertainty information.

### Follow-up generation

Input:

- Original question.
- Student response.
- Evaluation result.
- Current assessment context.

Output:

- Follow-up question.
- Reason for asking.
- Concept being investigated.
- Difficulty or assessment objective.

## AI service rules

1. Expose stable HTTP endpoints.
2. Validate requests using Pydantic.
3. Return structured JSON.
4. Never assume generated content is always correct.
5. Use explicit error responses.
6. Handle provider timeouts and failures.
7. Do not store application secrets in source code.
8. Keep prompts organized and versioned.
9. Write test cases for expected and unexpected model responses.
10. Make evaluation evidence-based rather than relying only on an arbitrary score.

The AI service should be independently runnable and testable.

---

# 14. Database Design

Supabase PostgreSQL is the primary application database.

Qazi owns database design, migrations, and database integration.

## Initial tables

### profiles

Stores user profile information.

Suggested fields:

- id
- full_name
- email
- created_at
- updated_at

The profile ID should relate to the authenticated Supabase user.

### submissions

Stores uploaded academic work metadata.

Suggested fields:

- id
- user_id
- title
- original_filename
- storage_path
- mime_type
- file_size
- status
- created_at
- updated_at

### vivas

Stores assessment sessions.

Suggested fields:

- id
- user_id
- submission_id
- status
- started_at
- completed_at
- created_at

### questions

Stores primary and follow-up questions.

Suggested fields:

- id
- viva_id
- concept
- question_text
- question_type
- difficulty
- expected_concepts
- sequence_number
- created_at

### responses

Stores student answers.

Suggested fields:

- id
- viva_id
- question_id
- audio_storage_path
- transcription
- status
- created_at

### evaluations

Stores answer evaluation results.

Suggested fields:

- id
- response_id
- correctness
- completeness
- reasoning_quality
- feedback
- demonstrated_concepts
- missing_concepts
- confidence
- created_at

### knowledge_gaps

Stores identified learning gaps.

Suggested fields:

- id
- user_id
- viva_id
- concept
- severity
- explanation
- recommendation
- created_at

These are proposed initial fields. The final schema must be normalized, reviewed, and implemented through Supabase migrations.

## Database design principles

- Use UUID primary keys where appropriate.
- Add foreign key constraints.
- Add indexes for frequently queried columns.
- Use timestamps consistently.
- Enforce ownership and access rules.
- Avoid storing audio or PDF binaries directly in PostgreSQL.
- Store file paths and metadata in the database.
- Use Row Level Security where applicable.
- Keep schema changes in migration files.

---

# 15. API Architecture & Contracts

The Next.js backend is the public API consumed by the frontend.

The Python AI service exposes private internal endpoints consumed by the Next.js backend.

## 15.1 Next.js API endpoints

| Method | Endpoint                      | Purpose                             |
| ------ | ----------------------------- | ----------------------------------- |
| POST   | `/api/submissions/upload-url` | Request signed upload authorization |
| POST   | `/api/submissions/complete`   | Confirm document upload             |
| GET    | `/api/submissions/:id`        | Retrieve submission                 |
| POST   | `/api/viva/initiate`          | Start assessment                    |
| GET    | `/api/viva/:id`               | Retrieve viva state                 |
| GET    | `/api/viva/:id/next`          | Retrieve next question              |
| POST   | `/api/viva/:id/responses`     | Submit student response             |
| GET    | `/api/reports/:id`            | Retrieve final report               |

These are initial endpoint proposals, not necessarily implemented routes.

## 15.2 Internal Python API endpoints

| Method | Endpoint                           | Purpose                    |
| ------ | ---------------------------------- | -------------------------- |
| POST   | `/internal/v1/documents/analyze`   | Analyze document           |
| POST   | `/internal/v1/questions/generate`  | Generate questions         |
| POST   | `/internal/v1/answers/evaluate`    | Evaluate answer            |
| POST   | `/internal/v1/questions/follow-up` | Generate adaptive question |

## 15.3 API contract rules

Every endpoint must define:

- HTTP method.
- Request schema.
- Response schema.
- Authentication requirements.
- Authorization requirements.
- Possible error responses.
- Processing behavior.

Use OpenAPI as the shared documentation format.

Use Zod for TypeScript-side validation and Pydantic for Python-side validation.

The two implementations must conform to the same documented contract.

## 15.4 Example AI response

```json
{
  "questions": [
    {
      "id": "q1",
      "concept": "Database normalization",
      "question": "Explain why database normalization is important.",
      "difficulty": "medium",
      "expected_concepts": [
        "Data redundancy",
        "Data consistency",
        "Database relationships"
      ]
    }
  ]
}
```

This is an illustrative payload. Actual schemas will be defined in the API contract.

---

# 16. End-to-End Application Workflow

## 16.1 Document upload

```text
Browser
   |
   | POST /api/submissions/upload-url
   v
Next.js Backend
   |
   | Authenticate user
   | Validate file metadata
   | Create submission record
   | Authorize signed upload
   v
Supabase Storage
   |
   | Browser uploads directly
   v
Private Document Storage
   |
   | POST /api/submissions/complete
   v
Next.js Backend
   |
   | Verify upload
   | Update submission state
   v
Processing Job
```

The browser uploads directly to Supabase using a signed upload URL authorized by the backend.

The backend must never trust an arbitrary `file_url` supplied by the browser.

It should use the authenticated user's identity and its own database record to determine which file can be accessed.

## 16.2 Document processing

```text
Processing Job
      |
      v
Next.js Backend
      |
      | Internal authenticated request
      v
Python AI Service
      |
      v
Document Extraction
      |
      v
Concept Analysis
      |
      v
Question Generation
      |
      v
Structured JSON
      |
      v
Next.js Backend
      |
      v
Supabase PostgreSQL
```

## 16.3 Viva assessment

```text
Student
   |
   v
Viva Interface
   |
   v
Retrieve Question
   |
   v
Record Answer
   |
   v
Upload Audio
   |
   v
Next.js Backend
   |
   v
AI Evaluation
   |
   v
Save Evaluation
   |
   v
Determine Next Question
   |
   +----> Follow-up
   |
   +----> Next Primary Question
   |
   +----> Complete Assessment
```

Qazi controls assessment state and progression.

Adil returns evaluation and question-generation results.

Ahmed displays the current state to the student.

---

# 17. Security Architecture

Security must be implemented from the beginning.

## Authentication

Supabase Auth provides user authentication.

Protected backend routes must verify the user's session.

## Authorization

Authentication alone is not sufficient.

The backend must verify that the authenticated student owns the submission, viva, response, or report they are attempting to access.

## Storage

- Keep document and audio buckets private.
- Use signed upload URLs.
- Use signed download URLs where necessary.
- Do not expose storage service credentials.
- Validate file type, size, and ownership.

## AI service security

The AI service should not be publicly accessible without authentication.

Communication should use HTTPS and an internal service credential or another appropriate service-to-service authentication mechanism.

Secrets must be held in environment variables.

For the initial prototype, a shared internal secret may be sufficient, provided it is transmitted securely, kept server-side, rotated when necessary, and never logged.

## Input validation

Validate:

- File size.
- File type.
- User ownership.
- Request payloads.
- Audio format.
- AI responses.
- Question and evaluation structures.

## Data protection

- Avoid logging complete student documents.
- Avoid logging raw audio.
- Do not expose one student's assessment to another.
- Apply appropriate retention policies.
- Restrict access to sensitive records.

---

# 18. Asynchronous Processing

Document analysis and audio evaluation may take longer than an ordinary HTTP request.

Therefore, long-running work must not depend on an open browser connection or an in-memory background task.

## Proposed approach

Use a durable job-processing mechanism.

Potential options include:

- Inngest.
- A database-backed job queue with an independent worker.

The final choice should be made based on deployment constraints and implementation complexity.

## Processing lifecycle

Submission:

```text
uploaded
   |
   v
processing
   |
   +----> ready
   |
   +----> failed
```

Viva:

```text
created
   |
   v
in_progress
   |
   +----> completed
   |
   +----> failed
```

Response:

```text
uploaded
   |
   v
transcribing
   |
   v
evaluating
   |
   +----> completed
   |
   +----> failed
```

The backend owns these states.

The AI service performs the processing but does not independently decide the application's final state.

Jobs should support retries, failure tracking, and idempotency so that a repeated request does not create duplicate questions or evaluations.

---

# 19. Independent Development Strategy

One of the most important architectural goals is allowing all three developers to work independently.

We should not require all three developers to finish their implementation before integration can begin.

## 19.1 Ahmed's independent workflow

Ahmed can develop the frontend using mock API responses.

Example:

```typescript
export const mockQuestions = [
  {
    id: "q1",
    concept: "Database normalization",
    question: "Why is database normalization important?",
    difficulty: "medium",
  },
];
```

This allows frontend development without waiting for the AI service.

## 19.2 Qazi's independent workflow

Qazi can develop backend endpoints using a mock AI adapter.

Example:

```typescript
export async function generateQuestions() {
  return {
    questions: [
      {
        id: "q1",
        concept: "Database normalization",
        question: "Explain database normalization.",
        difficulty: "medium",
      },
    ],
  };
}
```

Later, the mock adapter can be replaced with the actual FastAPI client.

## 19.3 Adil's independent workflow

Adil can develop the Python service using:

- Sample PDF documents.
- Sample extracted text.
- Sample audio recordings.
- Fixed expected responses.
- Test cases for correct and incorrect answers.

The AI service should be runnable locally without requiring the Next.js application.

## 19.4 Integration strategy

We integrate progressively.

First vertical slice:

```text
PDF Upload
    |
    v
Supabase Storage
    |
    v
Backend Processing
    |
    v
AI Document Analysis
    |
    v
Question Generation
    |
    v
Database Persistence
    |
    v
Frontend Question Display
```

Once this works, we introduce audio recording and answer evaluation.

This avoids integrating three incomplete systems simultaneously.

---

# 20. Git & Contribution Guidelines

We use one shared GitHub repository.

The repository follows a feature-branch workflow.

## 20.1 Branch strategy

```text
main
│
├── feat/frontend-dashboard
├── feat/frontend-viva
├── feat/frontend-submissions
│
├── feat/backend-auth
├── feat/backend-submissions
├── feat/backend-viva
│
├── feat/ai-document-analysis
├── feat/ai-question-generation
└── feat/ai-answer-evaluation
```

## 20.2 Rules

1. Never push directly to `main`.
2. Create a branch for each feature or task.
3. Keep branches focused.
4. Open pull requests for changes.
5. Review changes before merging.
6. Resolve merge conflicts carefully.
7. Do not commit secrets or `.env.local`.
8. Do not modify another developer's owned area without coordination.
9. Coordinate API and database changes before implementing dependent features.
10. Keep the application buildable after every integration.

## 20.3 Commit convention

Use conventional commit prefixes.

Examples:

```text
feat: add document upload flow
feat: implement viva question navigation
fix: handle failed audio upload
refactor: separate submission repository
docs: update API contract
test: add question evaluation tests
chore: configure Python service
```

## 20.4 Pull request requirements

Every pull request should include:

- What changed?
- Why was the change necessary?
- Which files or modules were affected?
- How was it tested?
- Does it change an API contract?
- Does it introduce a database migration?
- Are environment variables required?

No unrelated refactoring should be included in a feature pull request.

## 20.5 Shared ownership

Qazi coordinates database migrations and backend contracts.

Ahmed coordinates frontend component conventions and integration.

Adil coordinates Python service contracts and AI pipeline behavior.

Major architectural decisions should be discussed by all three developers.

---

# 21. Local Development Setup

## Prerequisites

Install:

- Node.js version supported by the project's Next.js version.
- npm.
- Git.
- Python 3.11+ or a version supported by the selected dependencies.
- VS Code or another suitable editor.
- Supabase project access.

Docker may be used for local Python service development and later deployment preparation.

## 21.1 Clone the repository

```bash
git clone <REPOSITORY_URL>
cd enigma
```

## 21.2 Install Next.js dependencies

```bash
npm install
```

## 21.3 Configure environment variables

Create `.env.local` using the required variables documented in `.env.example`.

Never commit `.env.local`.

## 21.4 Run the Next.js application

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## 21.5 Run the AI service

From the repository root:

```bash
cd services/ai-service
```

Create a virtual environment:

```bash
python -m venv .venv
```

Activate it on Windows:

```powershell
.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI once `app/main.py` is implemented:

```bash
uvicorn app.main:app --reload --port 8000
```

The local API documentation will be available at:

```text
http://localhost:8000/docs
```

The Python service is independent from the Next.js process.

---

# 22. Environment Variables

Environment variables are separated by responsibility.

## Next.js environment

Illustrative `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

AI_SERVICE_URL=
AI_SERVICE_SECRET=

```

The service role key and AI service secret must only be accessed by server-side code.

The exact Supabase key naming should follow the project's current Supabase configuration and SDK version.

## Python environment

Illustrative Python environment:

```env
GROQ_API_KEY=

AI_SERVICE_SECRET=

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

```

Only include Supabase credentials if the chosen AI service architecture actually requires them. Prefer passing authorized data through the backend or using narrowly scoped access.

## Environment rules

- Never commit real credentials.
- Keep `.env.local` out of Git.
- Provide `.env.example` with blank values.
- Use separate credentials for development and production.
- Rotate exposed credentials immediately.
- Never use `NEXT_PUBLIC_` for private secrets.

---

# 23. Testing Strategy

Testing is divided by application responsibility.

## Frontend testing

Ahmed should verify:

- Page rendering.
- Form validation.
- Upload interactions.
- Loading states.
- API error handling.
- Audio recording controls.
- Viva navigation.
- Report rendering.
- Responsive layouts.

## Backend testing

Qazi should verify:

- Authentication.
- Authorization.
- Submission ownership.
- File upload authorization.
- API request validation.
- Database operations.
- Viva state transitions.
- AI service failures.
- Duplicate request handling.
- Report access control.

## AI service testing

Adil should verify:

- Document extraction quality.
- Concept extraction accuracy.
- Question relevance.
- Question diversity.
- Answer evaluation consistency.
- Follow-up relevance.
- Structured output validity.
- Provider failure handling.
- Transcription quality.

## Integration testing

The team should test complete workflows rather than isolated endpoints only.

Examples:

1. Student uploads a valid PDF.
2. Student cannot access another user's submission.
3. Document analysis produces usable concepts.
4. Questions are saved and displayed.
5. Student submits an audio response.
6. Audio is transcribed successfully.
7. Answer evaluation produces structured results.
8. A relevant follow-up is generated.
9. The final report contains the correct assessment data.

## AI evaluation quality

We must not treat successful JSON generation as proof of a good evaluation.

Build a small manually reviewed evaluation dataset.

Compare model outputs with human judgments and measure:

- Conceptual correctness.
- Question relevance.
- Evaluation agreement.
- False positives and false negatives.
- Follow-up usefulness.
- Stability across repeated runs.

AI evaluation quality is a product-critical concern.

---

# 24. Deployment Architecture

## 24.1 Main application

The Next.js project is deployed to Vercel.

The same project contains:

- Frontend pages.
- React components.
- Next.js Route Handlers.
- Backend application logic.
- Supabase integration.
- AI service integration.

We do not deploy a separate Next.js backend application for the initial release.

## 24.2 AI service

The Python FastAPI service is deployed independently to a Python-compatible hosting environment.

It communicates with the Next.js backend through authenticated HTTPS requests.

The AI service must not depend on a local Colab notebook or temporary public tunnel for production.

## 24.3 Supabase

Supabase provides:

- Authentication.
- PostgreSQL.
- Private file storage.
- Database security policies.

## 24.4 Deployment flow

```text
GitHub Repository
       |
       v
     Vercel
       |
       +----> Next.js Frontend
       |
       +----> Next.js Backend
       |
       v
    Supabase
       |
       v
  PostgreSQL + Storage


GitHub Repository
       |
       v
Python Hosting
       |
       v
FastAPI AI Service
```

## 24.5 Environments

Maintain separate development and production configurations.

| Environment | Purpose                |
| ----------- | ---------------------- |
| Local       | Individual development |
| Preview     | Pull request testing   |
| Development | Shared integration     |
| Production  | Actual users           |

Production credentials must never be reused casually in local development.

---

# 25. Development Roadmap

Development should follow small, verifiable milestones.

## Phase 1 — Project foundation

- [ ] Inspect the existing Next.js project.
- [ ] Confirm Git repository and remote.
- [ ] Review existing dependencies.
- [ ] Establish modular directory structure.
- [ ] Create architecture documentation.
- [ ] Confirm Supabase configuration.
- [ ] Establish team contribution rules.
- [ ] Define API contracts.

**Outcome:** A clean, documented foundation.

## Phase 2 — Authentication and application foundation

- [ ] Implement authentication.
- [ ] Protect application routes.
- [ ] Establish user profiles.
- [ ] Configure shared application layout.
- [ ] Establish database migrations.
- [ ] Verify user ownership.

**Outcome:** A working authenticated application.

## Phase 3 — Document submission

- [ ] Implement document upload interface.
- [ ] Create upload authorization endpoint.
- [ ] Configure private Supabase Storage.
- [ ] Save submission metadata.
- [ ] Implement processing statuses.
- [ ] Test upload and ownership.

**Outcome:** Students can securely submit academic documents.

## Phase 4 — Document intelligence

- [ ] Implement PDF text extraction.
- [ ] Extract important concepts.
- [ ] Identify technical topics.
- [ ] Generate personalized questions.
- [ ] Validate structured AI output.
- [ ] Persist questions.
- [ ] Display generated questions.

**Outcome:** A student's document produces a personalized viva question set.

## Phase 5 — Interactive voice viva

- [ ] Implement audio recording.
- [ ] Implement secure audio upload.
- [ ] Integrate transcription.
- [ ] Implement response persistence.
- [ ] Implement answer evaluation.
- [ ] Implement question progression.
- [ ] Implement adaptive follow-ups.

**Outcome:** Students can complete an interactive voice-based assessment.

## Phase 6 — Assessment reports

- [ ] Aggregate evaluation results.
- [ ] Identify demonstrated concepts.
- [ ] Identify knowledge gaps.
- [ ] Generate improvement recommendations.
- [ ] Implement report interface.
- [ ] Test report accuracy and ownership.

**Outcome:** Students receive an understandable assessment report.

## Phase 7 — Validation and release

- [ ] Test the full end-to-end workflow.
- [ ] Evaluate AI quality against human-reviewed cases.
- [ ] Test security and authorization.
- [ ] Test failure and retry scenarios.
- [ ] Optimize processing time and cost.
- [ ] Deploy production application.
- [ ] Document operational procedures.

**Outcome:** A validated, deployable initial product.

---

# 26. Engineering Principles

These principles guide implementation decisions.

## 26.1 Keep it simple

Prefer the simplest architecture that satisfies the actual requirement.

Do not introduce abstractions or infrastructure without a clear reason.

## 26.2 Separation of concerns

Frontend, backend, database, and AI processing must have clear responsibilities.

## 26.3 Explicit contracts

Services should communicate through documented request and response schemas.

Avoid implicit assumptions about data formats.

## 26.4 Single ownership

Every feature should have a primary owner.

Other developers can contribute, but changes should be coordinated.

## 26.5 Security by default

Validate inputs, enforce ownership, protect credentials, and keep private data private.

## 26.6 Incremental integration

Integrate small working features rather than waiting for entire subsystems to be completed.

## 26.7 Reliability over demos

A successful demonstration should not depend on fragile local tunnels, manually edited database records, or hardcoded responses.

Mock data is useful during development, but production behavior must be real and validated.

## 26.8 Evidence-based AI

AI-generated evaluations must include meaningful reasoning and supporting evidence.

The system should acknowledge uncertainty rather than pretending every judgment is definitive.

---

# 27. Definition of Done

A feature is not considered complete simply because the code has been written.

A feature is complete when:

- Its expected functionality works.
- Inputs are validated.
- Errors are handled.
- Authentication and authorization are enforced where required.
- Relevant tests pass.
- API contracts are respected.
- No credentials or secrets are exposed.
- Documentation is updated where necessary.
- The feature works with the rest of the application.
- Its pull request has been reviewed and merged.

For AI features, completion additionally requires testing against representative inputs and manually reviewed expected outcomes.

---

# 28. Future Product Direction

Enigma should initially focus on delivering one excellent experience:

**Upload academic work → complete an intelligent viva → receive useful feedback.**

Once this workflow is reliable, the platform can evolve into a broader understanding and learning system.

Potential directions:

## Personal Understanding Graph

Track a student's understanding of concepts across multiple assignments and assessment sessions.

## AI Remediation Engine

Use identified misconceptions to generate targeted explanations, practice exercises, and reassessments.

## Transfer-of-Knowledge Assessment

Introduce unfamiliar situations to determine whether students can apply concepts beyond memorized answers.

## Longitudinal Learning Memory

Track how understanding develops over time.

## Verified Skill Portfolio

Build an evidence-based record of demonstrated technical understanding.

These capabilities should be driven by actual student needs, assessment quality, and validated product usage.

---

# Final Development Direction

Enigma is a single coordinated product developed by three people with separate technical responsibilities.

The architecture is intentionally straightforward:

- **Ahmed:** Builds the user experience.
- **Qazi:** Owns the application backend, database, and orchestration.
- **Adil:** Builds the independent AI intelligence service.

The main Next.js application is modular. The Python AI service is independent. Supabase provides shared persistence and storage. OpenAPI defines communication contracts.

We will build independently, integrate continuously, and validate each milestone before moving to the next.

**Our first engineering milestone is not implementing every feature. It is establishing a clean, understandable, modular foundation that allows all three developers to work without blocking one another.**

---

_This README describes the intended architecture and development plan. Features, endpoints, database tables, and infrastructure should only be marked implemented after they have been built, tested, and integrated._
