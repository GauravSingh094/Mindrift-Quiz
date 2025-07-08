
# 🧠 Mindrift - Quiz Web Application (Old Version)

**Mindrift** is a full-stack quiz web application designed to host real-time and offline quiz competitions. Built with modern UI libraries and basic backend features, it enables participants to join quizzes, view leaderboards, and admins to manage content.

> ⚠️ This is the legacy version of Mindrift. It may not include the latest updates, optimizations, or 3D/UI improvements available in the current version.

---

## 📌 Features

### ✅ Functional Components
- Email/Password login (basic session-based)
- Create and join quizzes via code
- Competition creation panel
- Scheduled quiz activation
- Real-time leaderboard updates (basic polling)
- Light/Dark mode toggle
- Admin and Participant roles

### ⚠️ Partially Working / Incomplete Features
- Analytics and Dashboard (structure present, logic incomplete)
- Filter system (UI shown, not fully applied)
- Guest login (UI present, logic missing)
- Quiz review after submission
- Tab-switch detection logic (partially implemented)
- Footer hyperlinks not fully routed

### ❌ Known Issues
- Dashboard/Leaderboard/Quizzes buttons not navigating properly
- Quiz repeat prevention not consistent
- Login system throws "invalid credentials" even after registration
- Firebase-related errors if configured
- 404 errors on static footer links
- Mobile responsiveness incomplete in some views

---

## 🧱 Tech Stack (Old Version)

| Layer         | Stack                    |
|---------------|---------------------------|
| Frontend      | Next.js (App Router), JavaScript, Tailwind CSS |
| Backend       | Node.js, Express.js       |
| Database      | MongoDB Atlas             |
| Authentication| Custom Auth (bcrypt + session/token) |
| Hosting       | Vercel / Render           |

---

## 📁 Project Structure

```
/app
  /auth
  /dashboard
  /quizzes
  /competitions
  /leaderboard
  /components
  /admin
  /lib
  /api
```

---

## 🔧 Getting Started

1. Clone the repository:
```bash
git clone https://github.com/GauravSingh094/mindrift-old.git
cd mindrift-old
```

2. Install dependencies:
```bash
npm install
```

3. Add your environment variables in `.env.local` (MongoDB URI, session secret, etc.)

4. Run the development server:
```bash
npm run dev
```

---

## 👨‍💻 Developer Info

**Developer:** Gaurav Singh  
📧 Email: gauravsinghx2510@gmail.com  
🔗 [LinkedIn](https://www.linkedin.com/in/gaurav-singh-276944292)  
🔗 [GitHub](https://github.com/gauravsinghx2510)

---

## 📄 License
This project is licensed under the MIT License.
