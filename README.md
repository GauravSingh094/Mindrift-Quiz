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
├── frontend/             # Next.js 14 Frontend application
│   ├── app/              # App router pages (Dashboard, Quizzes, etc.)
│   ├── components/       # Reusable UI & Layout components
│   ├── config/           # App configuration files (env, design system)
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Helper utilities and API Client integrations
│   ├── package.json      # Node dependencies
│   └── tailwind.config.ts# Global styling configuration
├── backend/              # Spring Boot Backend source code
│   ├── src/              # Java source & configuration
│   ├── pom.xml           # Maven configuration
│   └── Dockerfile        # Production container configuration
└── README.md             # Root documentation file
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

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

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

---

## ☁️ Deployment Guide

### 1. Deploying the Backend on Render

Since the backend includes a Dockerfile, deploying as a Docker container is the recommended and simplest path.

#### Step 1.1: Deploy Redis
1. Sign in to **[Render](https://render.com/)**.
2. Click **New +** -> **Redis**.
3. Enter a Name, choose the region, and click **Create Redis**.
4. Once deployed, copy the **Internal Redis URL** (e.g., `redis://red-xxxxxxxx:6379`).

#### Step 1.2: Deploy the Web Service
1. Click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the following service settings:
   - **Name**: `mindrift-backend`
   - **Root Directory**: `backend`
   - **Runtime**: `Docker`
4. Expand **Advanced** and add the following **Environment Variables**:
   - `SPRING_DATASOURCE_URL` = `jdbc:postgresql://your-neon-db-url/neondb?sslmode=require`
   - `SPRING_DATASOURCE_USERNAME` = `your_neon_db_username`
   - `SPRING_DATASOURCE_PASSWORD` = `your_neon_db_password`
   - `SPRING_PROFILES_ACTIVE` = `prod`
   - `GEMINI_API_KEY` = `your_gemini_api_key`
   - `OPENAI_API_KEY` = `your_openai_api_key`
   - `RESEND_API_KEY` = `your_resend_api_key`
   - `SUPABASE_URL` = `your_supabase_url`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your_supabase_service_role_key`
   - `SUPABASE_STORAGE_BUCKET` = `mindrift-storage`
   - `SUPABASE_PUBLIC_URL` = `your_supabase_public_url`
   - `REDIS_URL` = `redis://red-xxxxxxxx:6379` *(The Internal Redis URL copied from Step 1.1)*
5. Click **Create Web Service**. Render will automatically build the Docker image and deploy it.
6. Copy your public service URL (e.g., `https://mindrift-backend.onrender.com`).

---

### 2. Deploying the Frontend on Vercel

Vercel is the natural choice for Next.js applications and handles routing and building out-of-the-box.

#### Step 2.1: Configure Vercel Project
1. Sign in to **[Vercel](https://vercel.com/)**.
2. Click **Add New** -> **Project**.
3. Import your GitHub repository.
4. Configure the Project Settings:
   - **Framework Preset**: `Next.js`
   - **Root Directory**: Click *Edit* and select **`frontend`**.
5. Expand **Environment Variables** and add the following configurations:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` = `your_clerk_publishable_key`
   - `CLERK_SECRET_KEY` = `your_clerk_secret_key`
   - `NEXT_PUBLIC_API_URL` = `https://mindrift-backend.onrender.com/api/v1` *(The backend URL from Render)*
6. Click **Deploy**. Vercel will build your application and launch it live.
