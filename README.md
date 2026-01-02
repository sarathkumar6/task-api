![Task API CI Pipeline](https://github.com/sarathkumar6/task-api/actions/workflows/ci.yml/badge.svg)

# Task API

A production-ready Node.js REST API built for scalability and observability

## 🛠 Tech Stack
* **Core:** Node.js, Express
* **Database:** PostgreSQL, Prisma ORM (v7)
* **Security:**  JWT Authentication, BOLA Protection
* **Observability:** Winston (Structure Logging), Morgan
* **Testing:** Jest, Supertest


## 🚀Getting Started

```bash
    git clone [https://github.com/YOUR_USERNAME/task-api.git](https://github.com/YOUR_USERNAME/task-api.git)
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Setup Environment:**
    Create a `.env` file with `DATABASE_URL` and `JWT_SECRET`.
4.  **Run Migrations:**
    ```bash
    npx prisma migrate dev
    ```
5.  **Start Server:**
    ```bash
    npm run dev
    ```