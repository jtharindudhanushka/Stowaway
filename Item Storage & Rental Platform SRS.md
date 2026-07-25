# **System Requirements Specification (SRS) \- Initial Demo & Enterprise Blueprint**

## **1\. Document Overview & System Scope**

This document defines the comprehensive system requirements for a scalable **Item Storage & Rental Platform**. The platform allows travelers and locals to securely store items across designated hubs and offer delivery options.  
The architecture is built as a modular system capable of expanding from an initial two-node operational setup (CMB Airport and Hotel Thilon) into a global, multi-branch enterprise platform. The initial MVP build leverages a Next.js (Backend-for-Frontend) and Supabase architecture designed for frictionless client interactions, swift operational updates, and zero-cost prototyping.

## **2\. System Architecture & Scalability Roadmap**

* **Phase 1: MVP / Demo Build (Current)**  
  * **Architecture:** Modular Monolith using Next.js (BFF pattern).  
  * **Database & Auth:** Distributed PostgreSQL instance (Supabase) with JWT-based authentication and database-level Row-Level Security (RLS).  
  * **Focus:** Maximum developer velocity, instant client validation, and zero infrastructure overhead.  
* **Phase 2: Commercial Launch**  
  * **Architecture:** Webhook integrations for automated Stripe card processing and SMS/Email notification dispatch.  
* **Phase 3: Multi-Branch Operations**  
  * **Architecture:** Background job queueing (Redis) to decouple asynchronous operational tasks (receipt generation, notification dispatch) and maintain UI response times under 100 ms. Native/Cross-platform mobile apps for dispatch staff.  
* **Phase 4: Global Enterprise**  
  * **Architecture:** Fully decoupled Event-Driven Architecture (EDA) with Go/Node.js microservices coordinated via Apache Kafka or RabbitMQ for total fault isolation.

## **3\. Core Business Logic & Initial Seed Data**

All catalog options, rates, surcharges, and location rules are completely dynamic and managed via database settings.

### **3.1 Initial Storage Item Catalog & Quantities**

The item selection engine utilizes a multi-item counter format (inspired by Bounce), allowing users to select multiple items across distinct size tiers in a single booking session:

| Item Tier ID | Category Name | Description / Supported Items | Weight / Specs | Default Base Rate (Daily / Weekly / Monthly) |
| :---- | :---- | :---- | :---- | :---- |
| ITEM\_001 | **Small Bag / Documents** | Laptop, handbag, document files, small totes | Standard personal item | $1.00 / $5.00 / $25.00 |
| ITEM\_002 | **Carry-On Luggage** | Standard carry-on suitcases, backpacks, trolleys | Max weight: 15 kg | $2.00 / $10.00 / $45.00 |
| ITEM\_003 | **Large Suitcase** | Extra-large luggage, heavy check-in suitcases | Max weight: 40 kg | $3.50 / $18.00 / $75.00 |
| ITEM\_004 | **Odd-Sized Items** | Foldable bicycles, golf bags, baby car seats, surfboards | Non-standard dimensions | $5.00 / $25.00 / $100.00 |
| ITEM\_005 | **Tea Chest Box** | Standard tea chest size boxes, storage crates | Heavy/Bulky volume | $4.00 / $20.00 / $85.00 |

### **3.2 Add-On Services**

* **Airport Pickup / Delivery Service:** An optional add-on toggle allowing users to request direct luggage collection or delivery at the airport for a flat additional fee (e.g., \+$5.00).

### **3.3 Dynamic Locations & Conditional Rules**

* **CMB Airport (LOC\_001):**  
  * Drop-off Surcharge: $10.00  
  * Pick-up Surcharge: $10.00  
  * Payment Enforcement: **Stripe Pre-payment strictly required** if CMB Airport is selected as either the drop-off or pick-up location (Cash disabled).  
* **Hotel Thilon (LOC\_002):**  
  * Drop-off / Pick-up Surcharge: $0.00  
  * Payment Rules: Both **Cash** and **Stripe** payment options enabled when transactions occur exclusively at Hotel Thilon.

## **4\. UI/UX Strategy & Landing Page Architecture**

### **4.1 "Bounce-Style" Item Selector UI**

* **Counter Selector Pattern:** Each item category is displayed as an individual card featuring visual iconography, category titles, supported item descriptions, and interactive quantity adjusters (- 0 \+).  
* **Real-time Price Aggregation:** As the user increments or decrements items, the floating summary panel dynamically calculates and updates the subtotal.

### **4.2 Landing Page Content Structure**

To build immediate trust and clarify operational benefits, the primary landing page follows a strict layout hierarchy:

> 1. **Top Section:** Booking Widget (Item selection, duration picker, pick-up/drop-off locations).  
> 2. **Immediate Secondary Section (Trust & Value Proposition):** Positioned directly beneath the item selection area:

### **Why Choose Us for Your Luggage Storage?**

*Your luggage. Our facility. Your peace of mind.*

* **Our own secure storage facility** – Your luggage is stored at a facility owned and operated by us. No third parties are involved.  
* **24/7 drop-off and collection** – Enjoy the flexibility of dropping off and collecting your luggage at a time that suits your travel schedule.  
* **Conveniently located near the airport** – We are approximately 2 km from the airport, just a 5–10 minute journey away for easy luggage drop-off or collection.  
* **Airport pickup and delivery available** – We can collect your luggage from the airport or deliver it back to the airport for a small additional fee.  
* **Flexible payment options** – We accept recognised foreign currencies and convenient card payments through our secure payment app.

*Travel light. Store with confidence.*

## **5\. User Workflows**

### **Scenario 1: The Multi-Item Booking Flow (Customer)**

> 1. **Selection:** A family landing at CMB Airport opens the app. They select:  
   * 2x Carry-On Luggage (ITEM\_002)  
   * 1x Odd-Sized Item (Foldable Bicycle \- ITEM\_004)  
> 2. **Add-ons & Locations:**  
   * They select a 2-day storage duration.  
   * They select Drop-off: **CMB Airport** and Pick-up: **Hotel Thilon**.  
   * They check the optional **"Airport Pickup/Delivery Service"** add-on.  
> 3. **Calculation:** The UI aggregates the subtotal in real time:  
   * Base storage: \[(2 x Carry-On) \+ (1 x Odd-Size)\] x 2 days  
   * CMB Airport Surcharge: \+$10.00  
   * Airport Pickup Service Fee: \+$5.00  
> 4. **Lazy Registration & OTP:** The user taps "Book Now". A bottom sheet prompts for their mobile phone number. A simulated 4-digit OTP verifies the number and generates a client profile in Supabase without interrupting the booking.  
> 5. **Conditional Payment:** Because CMB Airport is involved, the Cash option is disabled, requiring Stripe card payment.  
> 6. **Confirmation:** The user completes checkout and receives a digital receipt with a QR code for drop-off verification.

### **Scenario 2: Operational Dispatch (Staff)**

> 1. **Login:** A dispatch team member logs in on a mobile device and is immediately redirected to the Operational Dashboard based on their operation JWT role.  
> 2. **Filter Window:** The dashboard displays all scheduled Drop-offs, Airport Pickups, and Storage Pick-ups within a rolling 48-hour window.  
> 3. **State Transition:** Upon collecting the luggage at CMB Airport, staff scan or select the booking and transition the state from Pending to In-Transit or Deposited.

### **Scenario 3: Admin Configuration (SuperAdmin)**

> 1. **Login:** Administrator accesses the SuperAdmin Control Panel (superadmin role).  
> 2. **Dynamic Edits:** The admin can adjust item category rates, update location surcharges, toggle payment rules, or add new storage item types (e.g., adding "Golf Bags" as a dedicated category).  
> 3. **Instant Reflection:** Changes take effect immediately across all client frontends via backend queries.  
>    4\. Full Audit Trail 

## **6\. Technology Stack & Deployment Target**

* **Frontend Framework:** Next.js (App Router with API Routes acting as the BFF layer).  
* **Database & Auth:** Supabase (Postgres, Row-Level Security, Auth engine).  
* **Styling:** Tailwind CSS (Mobile-first, responsive cards, high-contrast layouts).  
* **Hosting & Deployment:** Vercel (Instant HTTPS staging environment).