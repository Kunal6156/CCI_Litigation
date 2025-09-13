# CCI Litigation Management System

[![Backend](https://img.shields.io/badge/backend-Django-blue)](https://www.djangoproject.com/)
[![Frontend](https://img.shields.io/badge/frontend-React-green)](https://reactjs.org/)
[![License](https://img.shields.io/badge/license-MIT-yellow)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.11-blue)](https://www.python.org/)
[![Node.js](https://img.shields.io/badge/node.js-18-green)](https://nodejs.org/)

**Live Demo:** [Your Live Website](https://your-frontend-live-link.com)
**GitHub Repository:** [https://github.com/Kunal6156/CCI\_Litigation](https://github.com/Kunal6156/CCI_Litigation)

---

## **Table of Contents**

1. [Project Structure](#project-structure)
2. [Features](#features)
3. [Technologies Used](#technologies-used)
4. [Screenshots](#screenshots)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Running the Application](#running-the-application)
8. [API Documentation](#api-documentation)
9. [Backend Details](#backend-details)
10. [Frontend Details](#frontend-details)
11. [Deployment](#deployment)
12. [Contributing](#contributing)
13. [License](#license)

---

## **Project Structure**

```
cci-litigation/
├── cci-litigation-backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── .env
│   ├── cci_litigation_backend/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── litigation_api/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── permissions.py
│       ├── middleware/
│       │   └── draft_cleanup.py
│       └── management/commands/
│           └── cleanup_old_drafts.py
│
└── cci-litigation-frontend/
    ├── package.json
    ├── .env
    ├── public/
    └── src/
        ├── components/
        ├── pages/
        ├── services/
        └── utils/
```

---

## **Features**

* User authentication with role-based access
* Case CRUD operations (Create, Read, Update, Delete)
* Draft recovery with automatic cleanup
* Notifications system for users
* Dashboard with statistics and metrics
* Responsive React frontend UI
* Secure REST API with Django

---

## **Technologies Used**

* **Backend:** Python, Django, Django REST Framework
* **Frontend:** React, JavaScript, HTML5, CSS3
* **Database:** SQLite (development) / PostgreSQL (production)
* **Other:** Axios, CRACO, Node.js, npm, JWT authentication

---

## **Screenshots**

*Replace with your actual images:*

* **Dashboard:**
  ![Dashboard Screenshot](screenshots/dashboard.png)

* **Case Entry Page:**
  ![Case Entry Screenshot](screenshots/case_entry.png)

* **Notifications:**
  ![Notifications Screenshot](screenshots/notifications.png)

---

## **Installation**

### **Backend**

```powershell
cd cci-litigation-backend
python -m venv venv
venv\Scripts\activate           # Windows
# source venv/bin/activate      # macOS/Linux
pip install -r requirements.txt
python manage.py migrate
```

### **Frontend**

```powershell
cd cci-litigation-frontend
npm install
npm start
```

Frontend runs on `http://localhost:3000`.

---

## **Configuration**

**Backend `.env` example:**

```env
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=sqlite:///db.sqlite3
```

**Frontend `.env` example:**

```env
REACT_APP_API_URL=http://localhost:8000/api/
```

---

## **Running the Application**

1. Start backend:

```powershell
cd cci-litigation-backend
python manage.py runserver
```

2. Start frontend:

```powershell
cd cci-litigation-frontend
npm start
```

---

## **API Documentation**

| Endpoint              | Method | Description                 |
| --------------------- | ------ | --------------------------- |
| `/api/cases/`         | GET    | List all cases              |
| `/api/cases/`         | POST   | Create a new case           |
| `/api/cases/<id>/`    | GET    | Retrieve case details       |
| `/api/cases/<id>/`    | PUT    | Update a case               |
| `/api/cases/<id>/`    | DELETE | Delete a case               |
| `/api/notifications/` | GET    | List user notifications     |
| `/api/users/`         | GET    | List all users (admin only) |

---

## **Backend Details**

* **Middleware:** `draft_cleanup.py` automatically removes expired draft cases
* **Management Command:** `cleanup_old_drafts.py` to purge old drafts manually:

```bash
python manage.py cleanup_old_drafts
```

* **Signals:** Trigger notifications or cleanup on case creation/update
* **Permissions:** Custom classes for role-based access control

---

## **Frontend Details**

* **Components:** Modular components in `src/components/`
* **Pages:** Routes like Dashboard, Case Entry, Case List, Login, User Management
* **Services:** API calls centralized in `src/services/`
* **Utils:** Helper functions in `src/utils/`

---

## **Deployment**

* **Backend:** Heroku, AWS, or DigitalOcean. Set environment variables and production DB.
* **Frontend:** Netlify, Vercel, or any static host. Update `REACT_APP_API_URL` to point to production backend.

**Demo Links:**

* Live Frontend: [Your Live Website](https://your-frontend-live-link.com)
* Backend API Docs: [Your API Docs](https://your-backend-api-link.com)

---

## **Contributing**

1. Fork the repo
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -m "Add feature"`
4. Push branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## **License**

MIT License © 2025 [KUNAL](https://github.com/Kunal6156)

---

