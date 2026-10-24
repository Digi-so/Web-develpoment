# TicketHub Ticketing System Design

## 1. Requirements

### Functional requirements
- Users can register, log in, browse events, and search or filter events.
- Users can view event details, seat maps, prices, and availability.
- Users can temporarily hold available seats and purchase them.
- Users can pay securely, view orders, and access tickets.
- Organizers can create events and manage ticket inventory.
- The system provides clear confirmation, failure, and timeout messages.

### Non-functional requirements
- Speed: Event pages should load quickly; target p95 API latency below 300 ms for normal read requests.
- Correctness: A seat must never be sold to more than one customer.
- Fairness: Popular sales use a waiting room and rate limits to manage demand fairly.
- Availability: The system should remain usable during traffic spikes.
- Security: Authenticate users, validate requests, protect payment information, and prevent abuse.
- Scalability: Add application servers and queue capacity as traffic increases.

## 2. Traffic Estimates

### Normal traffic
- 50,000 visitors per day.
- 10 page views per visitor = 500,000 page views per day.
- Average page views per second: 500,000 / 86,400 = about 5.8.
- Assuming five API requests per page view: about 2.5 million requests per day, or 29 requests per second on average.
- 5,000 tickets sold per day = about 0.058 tickets per second on average.

These are averages; actual peak traffic will be higher.

### Popular concert sale
- 200,000 people try to buy tickets within 10 minutes.
- Average arrival rate: 200,000 / 600 = about 333 people per second.
- 20,000 seats are available, or about 33 seats sold per second if evenly distributed over 10 minutes.
- There are 10 potential buyers per seat.
- If each person generates five API requests during the sale, that is about 1,667 requests per second on average during the 10-minute period.

Real traffic may arrive in much larger bursts. Use a waiting room, load testing, rate limits, and autoscaling to handle spikes.

## 3. API Design

All endpoints use HTTPS and authenticated requests where required.

| Method | Endpoint | Purpose |
|---|---|---|
| GET | /events | List and filter events |
| GET | /events/{eventId} | Get event details |
| GET | /events/{eventId}/seats | View seat availability |
| POST | /holds | Temporarily reserve seats |
| DELETE | /holds/{holdId} | Release a seat hold |
| POST | /orders | Create an order from valid holds |
| POST | /orders/{orderId}/payment | Start payment |
| GET | /orders/{orderId} | View order status |
| GET | /me/tickets | List the user's tickets |

Example request to hold seats:

    POST /holds
    {
      "eventId": "event-123",
      "seatIds": ["A10", "A11"]
    }

A successful response returns a hold ID and expiry time. If the seats are no longer available, return HTTP 409 Conflict. Invalid input returns HTTP 400, unauthenticated requests return HTTP 401, and unexpected server failures return HTTP 500.

Checkout requests should support idempotency keys so retries do not create duplicate orders or charges.

## 4. Data Model

### users
- id (primary key)
- name
- email (unique)
- password_hash
- created_at

### events
- id (primary key)
- name
- venue
- starts_at
- status

### seats
- id (primary key)
- event_id (foreign key to events.id)
- seat_label
- price
- status
- Unique constraint on (event_id, seat_label)

### holds
- id (primary key)
- user_id (foreign key to users.id)
- event_id (foreign key to events.id)
- expires_at
- status
- created_at

### orders
- id (primary key)
- user_id (foreign key to users.id)
- status
- total_amount
- idempotency_key
- created_at

### order_tickets
- id (primary key)
- order_id (foreign key to orders.id)
- seat_id (foreign key to seats.id)
- price_paid
- Unique constraint on seat_id to prevent a seat being sold twice

### payments
- id (primary key)
- order_id (foreign key to orders.id)
- provider_reference
- status
- amount
- created_at

Relationships:
- One user can have many holds and orders.
- One event has many seats.
- One order can contain multiple tickets.
- Each sold seat can appear in only one order_tickets record.
- An order can have payment attempts recorded in payments.

Useful indexes include events.starts_at, seats.event_id, holds.expires_at, orders.user_id, and order_tickets.order_id. Exact indexes should be validated with query plans and production data.

## 5. Architecture

    Customers
       |
       v
    DNS / HTTPS
       |
       v
    CDN and static assets
       |
       v
    Virtual waiting room / rate limiter
       |
       v
    Load balancer
       |
       v
    Stateless application servers
       |                 \
       |                  -> Redis cache and rate-limit data
       |
       +--> Event reads --> Read replica
       |
       +--> Holds/orders --> Primary PostgreSQL database
       |
       +--> Durable job queue --> Background workers
                                  |
                                  v
                              Payment provider

    Monitoring, logs, alerts, backups, and recovery processes
    support the whole system.

### Component explanations
- CDN: Serves images, styles, scripts, and other static assets close to users.
- Waiting room: Limits the rate at which customers enter a high-demand sale and helps apply fair access rules.
- Load balancer: Distributes requests across healthy application servers.
- Application servers: Validate requests and implement event, hold, checkout, and order logic.
- Redis: Caches suitable read data and supports rate limiting. It is not the final authority for seat ownership.
- PostgreSQL primary: Stores authoritative seat, hold, order, and payment state. Transactions and constraints protect correctness.
- Read replica: Handles suitable read-heavy queries; potentially stale data must not be used to confirm a purchase.
- Durable queue and workers: Process asynchronous tasks such as notifications and payment-related follow-up.
- Monitoring and backups: Detect failures, measure latency, and support recovery.

## 6. Preventing Two Customers from Buying the Same Seat

A simple availability check is not enough: two requests could both see a seat as available before either finishes. The database must make the final decision.

1. Begin a database transaction.
2. Lock the relevant seat rows using SELECT ... FOR UPDATE, or perform a conditional update that succeeds only when the seat is available and any previous hold has expired.
3. Check that every requested seat was successfully claimed. If any seat cannot be claimed, roll back the transaction and return a conflict response.
4. Create the hold or order records and update seat state in the same transaction.
5. Enforce a database uniqueness constraint on order_tickets.seat_id so a seat cannot be sold twice even if application code has a bug.
6. Commit the transaction only after the database checks succeed.

Holds should expire after a limited period. An expiry worker must recheck the hold and seat state transactionally before releasing inventory. Payment processing needs idempotency and verified provider results; the system should not issue a confirmed ticket simply because a browser says payment succeeded.

## 7. Trade-offs

### Speed versus correctness
Caching seat availability can make pages faster, but cached values may be stale. Use caches for display and PostgreSQL transactions and constraints for the final purchase decision.

### Fairness versus immediate access
A waiting room slows some customers down but helps protect the system and gives customers a more orderly access process. Queue rules should be transparent and resistant to automated abuse.

### Hold duration versus availability
Long holds give customers more time to pay but keep seats unavailable to others. Short holds improve inventory turnover but may frustrate customers with slow payment processes. Choose and communicate a reasonable expiry.

### Strong consistency versus read throughput
The primary database provides authoritative checkout decisions, while read replicas and caches help scale browsing. Purchase-critical decisions should not rely on potentially stale replica data.
