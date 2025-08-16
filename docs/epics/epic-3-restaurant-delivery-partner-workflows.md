# Epic 3: Restaurant & Delivery Partner Workflows

## Epic Overview

**Goal:** Develop the internal systems for restaurants to manage orders and for delivery partners to handle pickups and deliveries.

**Priority:** High

**Status:** Draft

## Business Value

This epic enables the operational backbone of the Marshanta platform by providing the necessary tools for restaurants and delivery partners. Without these workflows, the platform would not be able to fulfill its core promise of food delivery. These systems ensure that orders are processed efficiently and delivered reliably.

## User Impact

This epic impacts two key user groups:
- **Restaurants:** Provides tools to manage incoming orders, update preparation status, and coordinate with delivery partners
- **Delivery Partners:** Enables efficient order assignment, pickup, and delivery tracking

## Technical Scope

- Restaurant order management interface
- Delivery partner mobile application
- Real-time location sharing system
- Order status update and notification system
- Handoff coordination between restaurants and delivery partners

## Dependencies

- Epic 1: Foundation & Core Infrastructure (for data models and authentication)
- Epic 2: Conversational UI & Client Experience (for order creation and tracking integration)

## Stories

### Story 3.1: Restaurant Order Management

**User Story:** As a restaurant, I want to receive new order notifications and update the status of an order as I prepare it (e.g., "Accepted," "Preparing," "Ready for Pickup"), so that clients and delivery partners are always informed.

**Acceptance Criteria:**
- The system sends a real-time notification to the restaurant for each new order.
- Restaurants can change the status of an order through a simple interface.
- The order status updates are reflected in the client's conversational UI.

### Story 3.2: Delivery Partner Order Assignment

**User Story:** As a delivery partner, I want to be notified of new delivery requests and accept an assignment, so that I can begin my delivery route.

**Acceptance Criteria:**
- The system notifies the delivery partner of a new delivery request with all necessary details (pickup and drop-off locations).
- The delivery partner can accept or decline the request.
- Once accepted, the delivery partner's status is updated to "On the Way to Restaurant."

### Story 3.3: Real-time Location Sharing

**User Story:** As a delivery partner, I want my location to be shared with the platform in real-time, so that clients can track the delivery on a map.

**Acceptance Criteria:**
- The delivery partner's app securely shares their GPS location with the Marshanta platform.
- The platform receives and processes the location data in real-time.
- This data is used to update the real-time map tracking feature for the client.

### Story 3.4: Order Completion & Handoff

**User Story:** As a delivery partner, I want to confirm a successful delivery, so that the order is marked as complete and the transaction is finalized.

**Acceptance Criteria:**
- The delivery partner can mark an order as "Delivered" in their app.
- The system sends a notification to the client and restaurant upon completion.
- The client's order history is updated.

## Definition of Done

This epic will be considered complete when:
- Restaurants can receive, accept, and update the status of orders
- Delivery partners can accept assignments and update their status
- Real-time location sharing is functional and accurate
- Order handoff and completion processes work reliably
- All stories have been completed and meet their acceptance criteria

## Change Log

| Date | Version | Description | Author |
| :--- | :------ | :---------- | :----- |
| 2025-08-15 | 1.0 | Initial Draft | PO |
