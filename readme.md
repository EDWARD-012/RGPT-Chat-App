# 💬 RGPT - A Personalized AI Chat Application

A full-stack AI-powered chat application built with a **Django REST Framework backend** and a **React frontend**, powered by the **Google Gemini API**.  
It offers real-time chatting, Google authentication, chat history, and a modern responsive UI.

🔗 **Live Demo:** [RGPT Chat App](https://rgpt-chat-app.vercel.app/)  
⚙️ *(Note: The app may load slowly initially as the backend is hosted on Render free tier.)*  
🔗 **Backend API:** [https://rgpt-chat-app-backend.onrender.com](https://rgpt-chat-app-backend.onrender.com)

---

## 🚀 Features

- 💬 Real-time chat interface  
- 🔐 User authentication via **Google Sign-In**  
- 💾 Persistent, user-specific chat histories  
- 🧠 AI responses powered by **Google Gemini Pro API**  
- 🖼️ Image analysis capabilities  
- 🧩 Markdown & code block rendering for AI responses  
- 📁 Collapsible sidebar with chat management (rename, pin, delete)  
- 🌗 Light/Dark theme toggle  
- ⚙️ REST API communication between React and Django  

---

## 🛠️ Tech Stack

### **Backend**
- Python / Django / Django REST Framework  
- Google Gemini API  
- `django-allauth` for Google authentication  
- Deployed on **Render**

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
````

---

### 2️⃣ Backend Setup

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### ⚙️ Create a `.env` file inside `backend/` and add:

```
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

---

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

#### ⚙️ Create a `.env` file inside `frontend/` and add:

```
VITE_BACKEND_URL=https://rgpt-chat-app-backend.onrender.com
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

> 🔹 The frontend uses environment variables for Google Authentication and backend API requests.
> 🔹 Ensure `.env` is configured before running locally.

---

## 🗂️ Project Structure

```
RGPT-Chat-App/
├── frontend/         # React + Vite + Tailwind frontend
│   ├── src/
│   └── .env
├── backend/          # Django + DRF backend
│   ├── chat/
│   ├── users/
│   └── .env
└── README.md
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


