# Lumeris Dapp - Technical Assessment Notes

## Time Overview
- **Task 1 (Database & API):** ~1 hour. Focused on Mongoose schema creation, indexing, REST API endpoints, and query optimizations.  
- **Task 2 (Real-Time Updates):** ~1 hour. Implemented WebSocket server with heartbeat management and Redis Pub/Sub for live match updates.  
- **Validation & Cleanup:** ~0.5 hour. Added request validation using Joi and improved error handling.  

---

## Architectural Decisions

### Database & Schema Design
- **Match Schema:** Strict structure in Mongoose for `homeTeam`, `awayTeam`, `league`, `status`, `startTime`, `score`, and `odds`.  
- **Indexes:**
  - **Compound index `{ league: 1, status: 1 }`**: Optimized fetching matches by status and league.  
  - **Index on `startTime`**: Enables fast chronological sorting of matches.  
- **Query Efficiency:** `.lean()` used in queries for faster reads; pagination handled via `skip` and `limit`.  

### Real-Time Updates
- **WebSocket Approach:** Single-server WebSocket setup with broadcasting updates to all connected clients.  
- **Heartbeat Management:** `ping/pong` mechanism to detect and remove dead clients every 30 seconds.  
- **Redis Pub/Sub:** Messages from backend services published to Redis channel `match-updates` and broadcasted to WebSocket clients.  
- **State Handling:** Each client tracks `isAlive` status to ensure reliable connections.  

---

## ⚖️ Design Trade-offs

1. **Redis vs. Direct WebSocket Broadcast**
   - *Decision*: Integrated Redis Pub/Sub for multi-service communication.  
   - *Trade-off*: Adds complexity, but enables scaling across multiple server instances.  

2. **Request Validation**
   - *Decision*: Used Joi for validating match creation input (`homeTeam`, `awayTeam`, `league`, `startTime`, `odds`).  
   - *Trade-off*: Slightly more setup, but ensures robust input validation and reduces runtime errors.  

3. **Error Handling & Logging**
   - *Decision*: Centralized error handling and `morgan` request logging.  
   - *Trade-off*: Slightly more verbose logs, but easier debugging and maintainable code.  

4. **Pagination & Query Performance**
   - *Decision*: Implemented pagination with `limit` and `skip`, using `.lean()` for read-only queries.  
   - *Trade-off*: Efficient for current dataset; may require optimization for very large datasets.  

---

## 📚 Libraries Used
- **mongoose**: ODM for MongoDB.  
- **ws**: WebSocket server for real-time communication.  
- **redis**: Pub/Sub messaging between backend services.  
- **joi**: Input validation for API requests.  
- **dotenv**: Environment variable management.  
- **helmet**: Security headers.  
- **cors**: Cross-origin request handling.  
- **morgan**: HTTP request logging.  
- **compression**: Response compression.  
- **express-rate-limit**: Basic request throttling.  
