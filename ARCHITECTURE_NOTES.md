# Architect's Field Notes: Task API

### 1. Concurrency vs. Parallelism (THE PERFORMANCE PILLAR)
* **Concept**: Concurrency is about *structural management* of tasks; Parallelism is about *simultaneous execution*
* **Implementation**: Used the Node.js **Event Loop** for I/O-bound tasks and **Worker Threads** for CPU-bound tasks i.e., heavy data processing
* **Architectural "Why"**: Ensures the Main Thread remains non-blocking, maintaining API responsiveness under heavy load

### 2. Optimisic Locking (THE DATA INTEGRITY PILLAR)
* **Concept**: Preventing the "Lost Update" problem in high-concurrency environments
* **Implementation**: Utilized a `version` column in Prisma/Postgres. Updates only commit if the version matches the initial read state
* **Architectural "Why"**: Provides data safety without the performance bottlenecks of database-level table locks (Pessimistic Locking)

### 3. Stateless Authentication & Hermetic Testing
* **Concept**: Decoupling authentication state from the server and ensuring tests are `Self-Contained`
* **Implementation**: **JWT** for stateless authentication and `db.user.upsert` in Jest `beforeAll` blocks
* **Architectural "Why"**: JWTs enable **Horizontal Scaling**; Hermetic tests ensure the CI/CD pipeline is reliable and "environment-agnostic"

### 4. Automated Governance (THE DEVOPS PILLAR)
* **Concept**: "Shift-Left" testing and infrastructure-as-code
* **Implementation**: **GitHub Actions** orchestrating an ephemeral Postgres service container for evey pul request
* **Architectural "Why"**: Guarantees that the `main` branch is always stable and meets defined quality gates before deployment
