# 🌌 Mindrift: Interactive & Competitive Quiz Platform

Mindrift is a high-performance, modern, real-time interactive quiz platform designed for developers, students, and competitive learners. It consists of a state-of-the-art **Next.js 14 frontend** and an enterprise-grade **Spring Boot backend** designed with resilience, speed, and scalability in mind.

---

## ✨ Features

- **🏆 Real-Time Competitions**: Interactive multiplayer quiz rooms with live scoring.
- **📊 Live Leaderboards**: High-speed, event-driven leaderboards powered by Redis and Apache Kafka.
- **🎨 Sleek, Modern UI**: Designed with TailwindCSS, custom HSL color palettes, glassmorphism, dynamic Framer Motion micro-animations, and interactive Three.js graphics.
- **🛡️ Enterprise Resilience**: Integrated Resilience4j circuit breakers, rate limiters, bulkheads, and automatic retries.
- **💾 Transactional Outbox Pattern**: Ensures event messaging reliability between DB transactions and Kafka brokers.
- **🔐 Secure Authentication**: Integrated Clerk authentication for secure, role-based user management.
- **📦 Cloud Asset Management**: Powered by Supabase Storage for reliable avatar and media uploads.

---

## 🛠️ Technology Stack

### Frontend
* **Core**: Next.js 14 (App Router), React 18, TypeScript
* **Styling & Animations**: TailwindCSS, Framer Motion, Tailwind Animate, Radix UI primitives, Lucide React
* **State Management**: Zustand
* **Data Fetching**: TanStack React Query (`@tanstack/react-query`)
* **Charts & Visualization**: Recharts, Three.js (for immersive landing page elements)

### Backend
* **Core**: Java 21, Spring Boot 3.x, Spring MVC
* **Database & Caching**: PostgreSQL (Neon Cloud), Redis (high-performance caching & session stores)
* **Messaging & Reliability**: Apache Kafka, Resilience4j (Circuit Breaker, Rate Limiter, Retry, Bulkhead)
* **Build System**: Maven

---

## 📂 Project Structure

```
Mindrift/
├── app/                  # Next.js App Router pages (Dashboard, Quizzes, Profile, etc.)
├── backend/              # Spring Boot Backend source code
│   ├── src/              # Java source & configuration
│   ├── pom.xml           # Maven configuration
│   └── Dockerfile        # Production container configuration
├── components/           # Reusable UI & Layout components
├── config/               # App configuration files (env, design system)
├── hooks/                # Custom React hooks
├── lib/                  # Helper utilities and API Client integrations
├── services/             # Core API service calls
├── package.json          # Node dependencies
└── tailwind.config.ts    # Global styling configuration
```

---

## 🚀 Getting Started

### 📋 Prerequisites
* **Node.js**: v18.x or higher
* **Java**: JDK 21
* **Maven**: v3.8.x or higher
* **Redis**: Local running server (port 6379)
* **PostgreSQL**: Access credentials (e.g. Neon.tech connection string)

---

### 🖥️ Setting Up the Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file inside the `backend/` directory with the following variables:
   ```env
   SPRING_DATASOURCE_URL=jdbc:postgresql://your-neon-db-url/mindrift
   SPRING_DATASOURCE_USERNAME=your_username
   SPRING_DATASOURCE_PASSWORD=your_password
   GEMINI_API_KEY=your_gemini_key
   OPENAI_API_KEY=your_openai_key
   RESEND_API_KEY=your_resend_key
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   SUPABASE_STORAGE_BUCKET=mindrift-storage
   SUPABASE_PUBLIC_URL=your_supabase_public_url
   ```

3. Build the backend using Maven:
   ```bash
   mvn package -DskipTests
   ```

4. Run the Spring Boot application:
   ```bash
   java -jar target/mindrift-backend-1.0.0.jar --server.port=8080
   ```

---

### 🌐 Setting Up the Frontend

1. Ensure you are in the root project directory (`Mindrift/`).

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with the Clerk credentials and Backend URL API endpoint:
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
   ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   Open **[http://localhost:3000](http://localhost:3000)** in your browser to access the website.

---

## 🔒 Security & Performance Features

- **Clerk Middleware**: Automatically guards private routes and manages authentication tokens.
- **Redis Cache**: Speeds up repeated fetch requests for leaderboards and quiz metadata, reducing Neon DB loads.
- **Webpack Cache**: Enabled optimization configuration for faster hot module replacement (HMR) and dev server performance.
