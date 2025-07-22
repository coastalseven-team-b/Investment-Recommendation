# MongoDB Performance Optimization Documentation

This document details all the performance improvements made to the MongoDB usage in this project, including the rationale for each change and where it was implemented in the codebase.

---

## 1. Index Creation for Key Collections

### **What Was Done?**
Indexes were created on frequently queried fields in all major MongoDB collections. This ensures that queries are fast and efficient, especially as the data grows.

### **Why?**
Indexes allow MongoDB to quickly locate and retrieve documents without scanning the entire collection (avoiding expensive `COLLSCAN` operations). This is critical for performance, especially for collections that are read often or have large amounts of data.

### **Where?**
The index creation logic was added to the `backend/app.py` file, inside a new function called `create_indexes()`. This function is called once at application startup to ensure all necessary indexes exist.

### **Details of Indexes Added:**

- **Users Collection (`users`)**
  - `email` (unique):
    - Ensures fast lookups for login and registration.
    - Prevents duplicate email registrations.
    - Code: `mongo.db.users.create_index("email", unique=True)`

- **Transactions Collection (`transactions`)**
  - Compound index on `user_id` (ascending) and `date` (descending):
    - Optimizes queries that fetch a user's transactions, especially sorted by date (most recent first).
    - Code: `mongo.db.transactions.create_index([("user_id", 1), ("date", -1)])`

- **Investments Collection (`investments`)**
  - Compound index on `user_id` (ascending) and `date_invested` (descending):
    - Optimizes queries for a user's investments, especially when sorted by investment date.
    - Code: `mongo.db.investments.create_index([("user_id", 1), ("date_invested", -1)])`

- **Investment Options Collection (`investment_options`)**
  - `investment_id` (unique):
    - Ensures each investment option is unique and can be quickly found.
    - Code: `mongo.db.investment_options.create_index("investment_id", unique=True)`
  - `type`:
    - Optimizes queries that filter by investment type (e.g., Stock, Mutual Fund).
    - Code: `mongo.db.investment_options.create_index("type")`

- **Recommendations Collection (`recommendations`)**
  - Compound index on `user_id` (ascending) and `createdAt` (descending):
    - Optimizes queries that fetch a user's recommendations, especially the most recent ones.
    - Code: `mongo.db.recommendations.create_index([("user_id", 1), ("createdAt", -1)])`

### **How Is It Triggered?**
The `create_indexes()` function is called automatically at the bottom of `app.py` using:
```python
with app.app_context():
    create_indexes()
```
This ensures indexes are created every time the backend server starts (if they don't already exist).

---

## 2. General Recommendations (Not Yet Implemented)

While the above changes are implemented, here are additional recommendations for future improvements:

- **Use Projections in Queries:**
  - Only fetch necessary fields to reduce data transfer and memory usage.
  - Example: `find({}, { 'name': 1, 'email': 1 })`

- **Monitor Query Performance:**
  - Use MongoDB Compass's "Explain Plan" to ensure queries use indexes (look for `IXSCAN`).

- **Periodic Maintenance:**
  - Run `db.collection.stats()` to monitor collection and index sizes.
  - Archive or delete old data if collections grow too large.

- **Aggregation Pipeline Optimization:**
  - If using aggregation, place `$match` early and use `$project` to limit fields.

---

## 3. Summary Table

| Collection         | Index/Field(s)                | Purpose/Benefit                                 |
|--------------------|-------------------------------|-------------------------------------------------|
| users              | email (unique)                | Fast login/registration, prevent duplicates     |
| transactions       | user_id + date (compound)     | Fast user transaction queries, sorted by date   |
| investments        | user_id + date_invested       | Fast user investment queries, sorted by date    |
| investment_options | investment_id (unique), type  | Fast lookup by ID, filter by type               |
| recommendations    | user_id + createdAt           | Fast user recommendation queries, recent first  |

---

## 4. File/Code Reference
- **File:** `backend/app.py`
- **Function:** `create_indexes()`
- **Location:** Near the top, after Flask app initialization and before blueprint registration.

---

If you have any questions or want to implement further optimizations, please ask! 