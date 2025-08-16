# Marshanta Product Requirements Document (PRD)

## Goals and Background Context

### Goals

- Onboard at least 50 local restaurants in the first six months.
- Achieve 100% market share in the underserved regions of Morelos within the first year.
- Attract 10,000 application downloads within the first year.
- Build a loyal user base of at least 1,000 frequent users within the first year.
- Deliver a reliable and efficient service to ensure high client and restaurant satisfaction.

### Background Context

Marshanta is a localized food delivery platform for the southern state of Morelos, Mexico, a region currently unserviced by major platforms. The platform will serve as a unified marketplace for local restaurants, a dedicated delivery company, and clients. It aims to solve the problem of a fragmented and technologically-lacking food delivery market by leveraging a modern, conversational AI-driven interface.

### Change Log

| Date | Version | Description | Author |
| :--- | :------ | :---------- | :----- |
| 2025-08-14 | 1.0 | Initial Draft | John |

## Requirements

### Functional

-   **FR1:** The system must provide a conversational AI interface for clients to place and manage orders.
-   **FR2:** The system must allow restaurants to manage their menus and order acceptance.
-   **FR3:** The system must enable delivery partners to accept and manage delivery requests.
-   **FR4:** The system must provide real-time, map-based order tracking for clients within the chat interface.
-   **FR5:** The system must include a basic admin dashboard for managing users, restaurants, and key metrics.
-   **FR6:** The system must support secure payment processing for client orders.

## MVP Scope

### Core Features (Must Have)

-   **Conversational AI Interface for Clients:** A chat-based system that allows users to browse menus, place orders, track deliveries, and make payments. This is essential for the core user experience you envisioned.
-   **Restaurant Order and Process Management:** A system for restaurants to accept incoming orders, manage the preparation process, and seamlessly hand off the completed order to a delivery partner. This will include status updates such as "Order Accepted," "Preparing," and "Ready for Pickup."
-   **Delivery Partner Workflow Management:** A workflow for delivery drivers to accept an assigned delivery, receive the order details, confirm pickup, and update the delivery status (e.g., "On the Way," "Delivered").
-   **Real-time Map-based Tracking:** The ability for clients to track their delivery on a map in real-time. The conversational AI will handle the display of this information and reassure the customer as needed.
-   **Restaurant Onboarding and Menu Management:** A simple interface for restaurants to sign up, add their menus, set prices, and manage their availability.
-   **Basic Admin Dashboard:** A dashboard for platform administrators to monitor key metrics, manage restaurants, and handle customer support inquiries.
-   **Secure Payment Integration:** The ability for clients to pay for their orders securely through the platform.

### Out of Scope for MVP

-   **Advanced AI Insights for Admin:** The initial MVP will focus on gathering the data needed for future analysis, but the advanced insights and predictive analytics can be developed in a later phase.
-   **Loyalty Programs or Promotions:** These can be added post-launch to encourage customer retention.
-   **In-app Chat between Client and Restaurant:** The initial chat will be with Marshanta (the AI). Direct communication between clients and restaurants can be added later.
-   **Multiple Delivery Company Integration:** We'll start with a single delivery partner for simplicity and then add more as the business grows.

### MVP Success Criteria

-   A fully functional platform that allows clients to place an order and have it delivered by a partner restaurant.
-   All core user roles (Client, Restaurant, Delivery Partner, Admin) are supported with essential functionality.
-   Data is being collected to inform future business decisions and AI development.
-   The order and delivery process for restaurants and delivery partners is reliable and efficient.
-   Clients can track their orders in real-time through the conversational interface, providing a sense of transparency and peace of mind.

## Post-MVP Vision

### Phase 2 Features

-   **Advanced AI Insights for Administration:** Develop the AI to provide predictive analytics, such as demand forecasting, peak delivery times, and personalized recommendations for restaurants to optimize their offerings.
-   **Loyalty Programs and Promotions:** Implement a system for customer rewards, loyalty points, and promotional offers to encourage repeat business.
-   **Multi-Partner Delivery Network:** Integrate with additional delivery companies to expand our capacity and service area.
-   **In-app Chat with Restaurants:** Enable direct communication between clients and restaurants for specific order inquiries or special requests.

### Long-term Vision

-   **Geographic Expansion:** Extend Marshanta's service beyond the current region of Morelos to other underserved areas in Mexico.
-   **New Business Verticals:** Explore opportunities to expand beyond food delivery into other local services, such as grocery, pharmacy, or retail delivery.
-   **Enhanced User Customization:** Offer highly personalized experiences, where the Marshanta AI can remember a user's preferences, allergies, and past orders to provide proactive recommendations.

### Expansion Opportunities

-   **Partnerships with Local Businesses:** Collaborate with local businesses beyond restaurants, offering a platform for local vendors to sell their products.
-   **Community Engagement Features:** Implement features that connect users with local events, news, or community initiatives.

## Epics

### Epic 1: Foundation & Core Infrastructure

**Goal:** Establish the project's technical foundation, user authentication, and basic data models.

* **Story 1.1: Project Scaffolding**
    * **User Story:** As a developer, I want to set up the project's monorepo structure and install all core dependencies, so that I have a consistent and organized starting point for development.
    * **Acceptance Criteria (ACs):**
        * The project root contains a `package.json` file with monorepo configurations.
        * The `apps` directory contains `web` (PWA) and `api` (backend) folders.
        * A `packages/shared` folder exists for shared code.
        * All core dependencies are installed in their respective `package.json` files.
* **Story 1.2: User Authentication & Authorization**
    * **User Story:** As a client, I want to be able to securely register, log in, and log out of the platform, so that my personal data and order history are protected.
    * **Acceptance Criteria (ACs):**
        * A registration endpoint is available for new users.
        * A login endpoint authenticates users and returns a session token.
        * All requests to protected endpoints require a valid session token.
        * User data is stored securely in the database.
* **Story 1.3: Core Data Models**
    * **User Story:** As a developer, I want to create the core data models for users and restaurants, so that I can store and manage basic information for the platform.
    * **Acceptance Criteria (ACs):**
        * A `User` data model exists with fields for email, password, and role.
        * A `Restaurant` data model exists with fields for name, address, and contact information.
        * A `DeliveryPartner` data model exists.
        * The database schema is defined and can be migrated.

### Epic 2: Conversational UI & Client Experience

**Goal:** Build the client-facing PWA with the conversational AI interface, including menu browsing, ordering, and real-time tracking.

* **Story 2.1: Client Onboarding**
    * **User Story:** As a new client, I want to be able to access the Marshanta PWA, register with my account, and get a brief introduction to the conversational UI, so that I can start using the service immediately.
    * **Acceptance Criteria (ACs):**
        * The PWA is accessible on mobile browsers and prompts users to "install" it to their home screen.
        * The initial chat from the Marshanta AI welcomes new users and provides a simple guide.
        * The conversational UI can handle user registration and login.
* **Story 2.2: Menu Browsing & Order Creation**
    * **User Story:** As a client, I want to be able to ask Marshanta for menus from local restaurants and select items to add to my order, so that I can easily create an order without using traditional buttons or menus.
    * **Acceptance Criteria (ACs):**
        * The AI can respond to natural language queries like "Show me menus" or "What's on the menu at [Restaurant Name]?"
        * Clients can add items to their order by communicating with the AI.
        * The AI confirms the order summary, including price and taxes, before placing the final order.
* **Story 2.3: Real-time Tracking**
    * **User Story:** As a client, I want to be able to ask Marshanta for an update on my order and see the delivery person's location on a map in real-time, so that I can feel reassured about my order's progress.
    * **Acceptance Criteria (ACs):**
        * The AI can respond to queries like "Where is my order?" or "Is my delivery on the way?"
        * The response includes a live map view showing the delivery partner's location.
        * The AI provides reassuring and personalized status updates.
* **Story 2.4: Secure Payment & Order Completion**
    * **User Story:** As a client, I want to be able to securely pay for my order and receive a confirmation, so that I can complete the transaction with confidence.
    * **Acceptance Criteria (ACs):**
        * The AI prompts the user to securely enter payment information within the chat UI.
        * The system integrates with a payment gateway to process the payment.
        * Clients receive a confirmation message and a summary of their order after a successful payment.

### Epic 3: Restaurant & Delivery Partner Workflows

**Goal:** Develop the internal systems for restaurants to manage orders and for delivery partners to handle pickups and deliveries.

* **Story 3.1: Restaurant Order Management**
    * **User Story:** As a restaurant, I want to receive new order notifications and update the status of an order as I prepare it (e.g., "Accepted," "Preparing," "Ready for Pickup"), so that clients and delivery partners are always informed.
    * **Acceptance Criteria (ACs):**
        * The system sends a real-time notification to the restaurant for each new order.
        * Restaurants can change the status of an order through a simple interface.
        * The order status updates are reflected in the client's conversational UI.
* **Story 3.2: Delivery Partner Order Assignment**
    * **User Story:** As a delivery partner, I want to be notified of new delivery requests and accept an assignment, so that I can begin my delivery route.
    * **Acceptance Criteria (ACs):**
        * The system notifies the delivery partner of a new delivery request with all necessary details (pickup and drop-off locations).
        * The delivery partner can accept or decline the request.
        * Once accepted, the delivery partner's status is updated to "On the Way to Restaurant."
* **Story 3.3: Real-time Location Sharing**
    * **User Story:** As a delivery partner, I want my location to be shared with the platform in real-time, so that clients can track the delivery on a map.
    * **Acceptance Criteria (ACs):**
        * The delivery partner's app securely shares their GPS location with the Marshanta platform.
        * The platform receives and processes the location data in real-time.
        * This data is used to update the real-time map tracking feature for the client.
* **Story 3.4: Order Completion & Handoff**
    * **User Story:** As a delivery partner, I want to confirm a successful delivery, so that the order is marked as complete and the transaction is finalized.
    * **Acceptance Criteria (ACs):**
        * The delivery partner can mark an order as "Delivered" in their app.
        * The system sends a notification to the client and restaurant upon completion.
        * The client's order history is updated.

### Epic 4: Admin Dashboard & Analytics

**Goal:** Create the basic administrative dashboard to monitor platform activity, manage key entities, and gather data for future AI insights.

* **Story 4.1: Dashboard and User Management**
    * **User Story:** As an administrator, I want to view a high-level overview of platform activity and manage user accounts, so that I can monitor the health of the service and handle administrative tasks.
    * **Acceptance Criteria (ACs):**
        * The dashboard displays key metrics like total users, active orders, and revenue.
        * Administrators can search for and view details of client, restaurant, and delivery partner accounts.
        * Administrators can manage user permissions and suspend accounts if necessary.
* **Story 4.2: Restaurant and Order Management**
    * **User Story:** As an administrator, I want to manage restaurant profiles and view all active and completed orders, so that I can ensure a smooth operation and provide support when needed.
    * **Acceptance Criteria (ACs):**
        * The dashboard displays a list of all registered restaurants and their status.
        * Administrators can view the details of any order, including its history and current status.
        * Administrators can manage restaurant information, such as menus and contact details.
* **Story 4.3: Data Collection for AI**
    * **User Story:** As a developer, I want to ensure that all platform data, including order history, user interactions, and delivery times, is being collected and stored in a structured way, so that it can be used for future AI-driven insights.
    * **Acceptance Criteria (ACs):**
        * All relevant data points are logged and stored in a database.
        * The data is organized in a structured format that can be easily queried and analyzed.
        * The data collection process does not impact the real-time performance of the platform.