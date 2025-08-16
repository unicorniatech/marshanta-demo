


Documento 3: fullstack-architecture.md

# Marshanta Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for Marshanta, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack. This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

We will make a conscious decision to avoid a pre-packaged, full-stack starter template. This mitigates the risks of technical debt and over-engineering by allowing us to build the system with only the components we need. The "blank slate" approach will be managed by carefully selecting a core set of technologies and building the project structure from the ground up, ensuring it is simple, organized, and perfectly tailored to Marshanta's needs. We will ensure all selected technologies are compatible and well-documented to prevent unforeseen issues and to enable our AI agents to work effectively.

### Change Log

| Date | Version | Description | Author |
| :--- | :------ | :---------- | :----- |
| 2025-08-14 | 1.0 | Initial Draft | Winston |

---

## High Level Architecture

### Technical Summary

Marshanta's architecture will be a unified full-stack application built as a Progressive Web App (PWA) with a serverless backend. The frontend will be a single-page application that communicates with a set of serverless functions. This architectural style will provide a scalable and cost-effective solution that aligns with the need for real-time functionality and AI integration. A monorepo structure will be used to house both the frontend and backend services in one place, streamlining development and ensuring consistency.

### High Level Overview

The system will be built using a **serverless** architectural style. This means our backend will consist of functions that run in response to events, such as a new order from the PWA or a delivery status update. The PWA will communicate with these functions directly. We will use a **monorepo** structure, which will house the frontend PWA and the backend serverless functions within the same repository. This approach simplifies code sharing between the frontend and backend and makes it easier to manage dependencies.

### High Level Project Diagram

```mermaid
graph TD
    A[Clients] -->|PWA| B[Frontend (Marshanta PWA)]
    B -->|API Calls| C[API Gateway]
    C --> D[Serverless Functions]
    D --> E[Real-time Database]
    D --> F[AI Service]
    E --> D
    F --> D
    D --> G[3rd-Party Services]
    G --> D

    H[Restaurants] -->|API Calls| C
    I[Delivery Partners] -->|API Calls| C

    J[Administrators] -->|API Calls| C

    style A fill:#bbf,stroke:#337,stroke-width:2px
    style H fill:#bbf,stroke:#337,stroke-width:2px
    style I fill:#bbf,stroke:#337,stroke-width:2px
    style J fill:#bbf,stroke:#337,stroke-width:2px


Technology Stack Table




Data Models

User: Represents a client, restaurant, or delivery partner. This model will have a one-to-one relationship with specific user-type tables to allow for unique data and permissions.
Restaurant: Represents a restaurant on the platform. This model will include fields for their name, location, contact information, and menu.
DeliveryPartner: Represents a delivery driver. This model will include fields for their contact information, vehicle type, and current location.
Order: Represents a client's order. This model will be normalized by breaking it down into smaller tables (e.g., OrderItems) to improve performance and data integrity.
ConversationalLog: This is a data model for the AI service that will store conversational data for future analysis and model training.


Components

ClientApp: The Progressive Web App (PWA) that clients interact with.
APIService: The serverless backend that handles all business logic.
DatabaseService: Our Supabase-managed PostgreSQL database.
AIService: An external service that will handle all the conversational AI and data analysis.
RestaurantApp: The application that restaurants use to manage their orders and menus.
DeliveryPartnerApp: The application that delivery partners use to manage their deliveries and share their location.
AdminDashboard: The administrative application that the Marshanta team will use to manage the platform.

Component Diagrams

Code snippet



graph TD
    A[ClientApp (PWA)] -->|API Calls| B[APIService (Serverless)]
    B -->|read/write| C[DatabaseService (Supabase)]
    B -->|API Calls| D[AIService (External)]
    B -->|API Calls| E[3rd-Party Services]

    F[RestaurantApp] -->|API Calls| B
    G[DeliveryPartnerApp] -->|API Calls| B
    H[AdminDashboard] -->|API Calls| B


Unified Project Structure

Plaintext



marshanta-project/
├── .github/                    # CI/CD workflows
│   └── workflows/
├── apps/                       # Application packages
│   ├── web/                    # The Marshanta PWA (Next.js)
│   ├── api/                    # Serverless Functions (Backend)
│   ├── restaurant-app/         # Restaurant-facing application
│   └── delivery-app/           # Delivery-partner-facing application
├── packages/                   # Shared code packages
│   └── shared/                 # Shared types, utilities, and components
├── infrastructure/             # Infrastructure as Code
│   └── {{iac-structure}}
├── docs/                       # Project documentation
│   ├── prd.md
│   ├── front-end-spec.md
│   └── fullstack-architecture.md
├── .env.example
└── README.md


Final Architecture Sections

API Design and Integration
API Gateway Pattern: All requests from the client-side PWA, restaurant app, and delivery app will go through a central API Gateway.
API Endpoints: The API will be a RESTful API with a clear and consistent endpoint design.
Real-time Communication: We will use WebSockets for real-time updates.
Infrastructure and Deployment
Infrastructure as Code (IaC): We will use an IaC tool to manage our infrastructure, ensuring that our environments are consistent and reproducible.
CI/CD Pipeline: We will use GitHub Actions to automate our build, test, and deployment processes.
Environments: We will have at least three environments: development (for local development), staging (for testing), and production (the live environment).

