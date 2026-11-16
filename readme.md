# 💬 RGPT - A Personalized AI Chat Application

A full-stack AI-powered chat application built with a **Django REST Framework backend** and a **React frontend**, powered by the **Google Gemini API**.  
It offers real-time chatting, Google authentication, chat history, and a modern responsive UI.

🔗 **Live Demo:** [RGPT Chat App](https://rgpt-chat-app.vercel.app/)

The frontend and the Django API both run on Vercel in one project. The API lives under `/api/` on the same domain.

---

## 🚀 Features

- 💬 Real-time chat interface  
- 🔐 User authentication via **Google Sign-In**  
- 💾 Persistent, user-specific chat histories  
- 🧠 AI responses powered by the **Google Gemini API**, with earlier messages in the chat sent as context  
- 🖼️ Image analysis capabilities  
- 🧩 Markdown & code block rendering for AI responses  
- 📁 Collapsible sidebar with chat management (rename, pin, delete)  
- 🌗 Light/Dark theme toggle  
- ⚙️ REST API communication between React and Django  

---

## 🛠️ Tech Stack

### **Backend**
- Python / Django / Django REST Framework  
- Google Gemini API through the `google-genai` SDK  
- Google ID token verification with `google-auth`, DRF token auth for the API  
- Postgres (Neon) in production, SQLite locally  
- Deployed on **Vercel** as a Python function

### **Frontend**
- JavaScript / React / Vite  
- Tailwind CSS for styling  
- `@react-oauth/google` for login  
- `react-router-dom` for routing  
- `axios` for API communication  
- Deployed on **Vercel**

---

## 📦 Setup and Installation

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/EDWARD-012/RGPT-Chat-App.git
cd RGPT-Chat-App
```

---

### 2️⃣ Environment variables

Copy `.env.example` to `.env` in the repo root and fill it in. Both the backend and the Vite dev server read this one file. Leave `DATABASE_URL` empty to use SQLite.

---

### 3️⃣ Backend Setup (Python 3.12)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Run the tests with `python manage.py test api`.

---

### 4️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server proxies `/api`, `/admin` and `/static` to Django on port 8000, so open http://localhost:5173. Add `http://localhost:5173` to the authorized JavaScript origins of your Google OAuth client for sign-in to work locally.

---

## ▲ Deploying on Vercel

`vercel.json` defines two Vercel Services in one project: `frontend/` is built with Vite and `backend/` runs Django as a Python function. Requests to `/api/*`, `/admin*` and `/static/*` go to Django and everything else goes to the React app. Each build runs `migrate` when `DATABASE_URL` is set.

In the Vercel project settings, the Root Directory is the repo root and the Framework Preset is Services. Set these environment variables for Production and Preview:

| Variable | Notes |
| --- | --- |
| `DJANGO_SECRET_KEY` | Long random string |
| `GEMINI_API_KEY` | From Google AI Studio |
| `VITE_GOOGLE_CLIENT_ID` | OAuth web client ID, used by the frontend and the backend |
| `DATABASE_URL` | Added by the Neon integration when you connect a database |

`GET /api/health/` reports which of these the deployment can see, without showing their values.

Every Vercel origin that shows the sign-in button (the production domain and any preview URL you test on) has to be listed under Authorized JavaScript origins for the OAuth client in Google Cloud Console.

---

## 🗂️ Project Structure

```
RGPT-Chat-App/
├── frontend/         # React + Vite + Tailwind frontend
│   └── src/
├── backend/          # Django + DRF backend
│   ├── api/          # Models, views, serializers, tests
│   └── rgpt_backend/ # Settings and URLs
├── vercel.json       # Vercel Services config
├── .env.example
└── readme.md
```

---

## 🌟 Future Improvements

* ✨ UI redesign for a more polished and smooth experience
* 🎨 Improved theme animations and transitions
* 💬 Enhanced chat bubble design and message rendering
* 📱 Better mobile responsiveness
* ⚡ Performance optimization for faster load times

---

## 📸 Screenshots


<img width="1425" height="922" alt="Screenshot 2025-10-14 180245" src="https://github.com/user-attachments/assets/78e9178b-f306-4a97-9ed1-0fec6fa82d6c" />

<img width="2879" height="1333" alt="Screenshot 2025-10-14 180420" src="https://github.com/user-attachments/assets/fb6c18ee-485e-45bd-8542-70b9d388028e" />

<img width="2879" height="1349" alt="Screenshot 2025-10-14 180436" src="https://github.com/user-attachments/assets/43ebcc44-7efa-4970-87ad-7a4cd3fd717f" />

<img width="2079" height="425" alt="Screenshot 2025-10-14 180449" src="https://github.com/user-attachments/assets/46338b7f-a917-47bb-a353-a0dcef417bd4" />

<img width="2094" height="409" alt="Screenshot 2025-10-14 180458" src="https://github.com/user-attachments/assets/dbc03a98-c57c-454c-9c6b-4b8cf0acb8ce" />

<img width="2879" height="1350" alt="Screenshot 2025-10-14 180618" src="https://github.com/user-attachments/assets/52622bf0-e139-43bd-9a2e-fc0a7ff2c572" />

---

## 🤝 Contributing

Pull requests are welcome!
For major changes, please open an issue first to discuss what you’d like to improve.

---

## 📜 License

This project is open-source and available under the [MIT License](LICENSE).


