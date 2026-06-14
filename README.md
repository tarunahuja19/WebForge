# WebForge 🚀

WebForge is a comprehensive, multi-role **Hostel Management System (HMS)** designed to streamline hostel operations, enhance student living experiences, and leverage machine learning to optimize mess planning and roommate allocations. 

Built as a monorepo using `pnpm` workspaces, WebForge coordinates a React SPA client, an Express API server with PostgreSQL/Drizzle ORM, a Redis caching layer for roommate matching, and a FastAPI Python service for mess prediction modeling.

---

## 🏗️ System Architecture

WebForge uses a decoupled, microservices-style architecture that bridges a modern web ecosystem with a Python machine learning runtime.

```mermaid
graph TD
    subgraph Client ["Client Layer (hostel-app)"]
        ViteReact["React Single Page App (TypeScript + Tailwind)"]
    end

    subgraph API ["Server Layer (api-server)"]
        ExpressServer["Express API Server (TypeScript)"]
        RedisCache[("Upstash Redis Cache <br> (Roommate profiles)")]
    end

    subgraph Data ["Data Layer"]
        PostgresDB[("PostgreSQL Database <br> (Supabase + Drizzle ORM)")]
    end

    subgraph ML ["Machine Learning Layer (backend)"]
        FastAPIService["FastAPI Service (Python)"]
        AttendanceModel["Attendance Model (attendance_model.pkl)"]
        WasteModel["Waste Model (waste_model.pkl)"]
    end

    ViteReact -- "HTTPS / REST API Requests" --> ExpressServer
    ExpressServer -- "Drizzle ORM Queries" --> PostgresDB
    ExpressServer -- "Read / Write Cached Profiles" --> RedisCache
    ExpressServer -- "HTTP POST /predict" --> FastAPIService
    FastAPIService -- "Load & Run Inference" --> AttendanceModel
    FastAPIService -- "Load & Run Inference" --> WasteModel
```

### Core Architecture Components

1. **Vite React Frontend (`artifacts/hostel-app`)**: An interactive student, warden, and admin portal built using TypeScript, Tailwind CSS, Framer Motion, and Wouter for client-side routing.
2. **Express API Server (`artifacts/api-server`)**: Coordinates core business logic, permissions, JWT authentication, and queries the database using Drizzle ORM.
3. **FastAPI ML Backend (`backend`)**: A lightweight Python server that hosts our predictive models, exposing an endpoint to run mess attendance and food waste forecasts.
4. **PostgreSQL Database (`lib/db`)**: Holds schema definitions for users, students, wardens, rooms, gate passes, complaints, and meals.
5. **Redis Cache Layer**: Caches roommate profiles to reduce database load and compute times when calculating similarity matrices.

---

## 📂 Repository Layout & Navigation

Below is a map of the WebForge workspace to help you find your way around the codebase:

```
WebForge/
├── artifacts/
│   ├── api-server/              # Express API Server (Node.js/TypeScript)
│   │   ├── src/                 # Server endpoints, middlewares & DB routes
│   │   ├── .env.example         # Example local environment settings
│   │   └── package.json         # Node server package configurations
│   └── hostel-app/              # React Frontend Portal (Vite/TypeScript/Tailwind)
│       ├── src/                 # Pages, components, hooks, and styles
│       └── package.json         # Client package configurations
├── backend/                     # FastAPI inference service (Python)
│   ├── app.py                   # FastAPI server application
│   ├── predict.py               # Chained XGBoost inference logic
│   └── *_model.pkl              # Serialized prediction models
├── lib/                         # Shared monorepo packages & libraries
│   ├── api-client-react/        # React API client query hooks
│   ├── api-spec/                # Shared OpenAPI specifications
│   ├── api-zod/                 # Generated schema validation types
│   └── db/                      # Drizzle configuration, schemas & migrations
│       └── src/schema/          # PostgreSQL table schemas
├── mess-model/                  # Mess attendance & food waste ML training pipeline
│   ├── meal_summary.csv         # Synthetic meal dataset
│   ├── generate_data.py         # Script to generate synthetic dataset
│   ├── train_pipeline.py        # XGBoost training pipeline (ONNX export)
│   └── train_pkl.py             # XGBoost training pipeline (Pickle export)
├── roommate-model/              # Roommate similarity matching engine
│   ├── roommate_data.csv        # Synthetic student dataset
│   ├── generate_data.py         # Script to generate synthetic roommates
│   ├── encode_data.py           # Encodes categorical features to weighted vectors
│   ├── inference.py             # KNN-based cosine distance matching engine
│   └── encoding_metadata.json   # Feature weights and mappings metadata
├── package.json                 # Monorepo root configuration (pnpm workspaces)
├── pnpm-workspace.yaml          # Monorepo workspace boundaries & global catalogs
└── tsconfig.json                # Root TypeScript configuration
```

---

## 🧠 Machine Learning Integration

WebForge embeds machine learning directly into its workflows:

### 1. Mess Attendance & Waste Forecasting
* **Chained Prediction**: The system uses two sequential XGBoost models:
  1. **Model 1 (Attendance)**: Uses features like Day of the Week, Meal type, Menu item, Capacity, Exam Week, Holidays, and Rain to predict the number of students who will attend the meal.
  2. **Model 2 (Food Waste)**: Takes the predicted attendance, expected attendance (with safety buffer), expected prepared food amount, and external factors (rain, exams, etc.) to estimate the food waste generated in kilograms.
* **Integration Flow**: When a warden checks the Mess Dashboard, the Express server sends a POST request to `http://127.0.0.1:8000/predict` containing the date and meal details. The FastAPI backend runs the chained prediction and returns the metrics to Express, which are then rendered on the dashboard.

### 2. Roommate Compatibility Matching
* **Cosine Similarity Vectors**: Students fill out a personality test covering cleanliness, noise tolerance, study hours, sleeping habits, diet, and guest preferences.
* **Feature Weights**: The system scales and maps these responses into a 19-dimensional vector, applying priority weights (e.g., cleanliness is weighted $2.0\times$ and sleeping habits are weighted $1.8\times$).
* **KNN Matching**: A K-Nearest Neighbors (KNN) algorithm calculates the Cosine Distance between the query vector and all other roommate profiles, outputting the most compatible roommate candidates with a strict gender segregation constraint.

For detailed information on model training, architectures, and datasets, see the directory-specific READMEs:
* Read the [Mess Model README](file:///home/jemin/Projects/design/WebForge/mess-model/README.md)
* Read the [Roommate Model README](file:///home/jemin/Projects/design/WebForge/roommate-model/README.md)

---

## 🚀 Getting Started

Follow these steps to set up and run the entire WebForge stack on your local machine:

### 📋 Prerequisites

Ensure you have the following installed:
* **Node.js** (v18.x or v20.x recommended)
* **pnpm** (v9.x or v10.x) - Install globally with `npm install -g pnpm`
* **Python 3.9+** (with `pip` and `venv`)
* **PostgreSQL Database** (e.g. via local Postgres installation or a Supabase instance)

---

### 🔧 1. Local Configuration Setup

1. Copy the root `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your Supabase or PostgreSQL connection string:
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:6543/postgres"
   ```
3. Copy the Express API Server `.env.example` to `.env`:
   ```bash
   cp artifacts/api-server/.env.example artifacts/api-server/.env
   ```
4. Verify the connection details and set a port (defaults to `3000`):
   ```env
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@db.YOUR_PROJECT_ID.supabase.co:6543/postgres"
   PORT=3000
   ```

---

### 📦 2. Installing Node Dependencies

Install the project dependencies inside the workspace using `pnpm`:
```bash
pnpm install
```

---

### 🗄️ 3. Database Setup (Migrations & Seeding)

With your database URL correctly configured, push the schema to PostgreSQL and seed the database with mock data:

1. **Push Schema to DB**:
   ```bash
   pnpm --filter @workspace/db run push
   ```
2. **Seed Initial Database Tables**:
   ```bash
   pnpm --filter @workspace/scripts run seed
   ```
3. **Seed Roommate Compatibility Database**:
   ```bash
   pnpm --filter @workspace/scripts run seed-roommates
   ```

---

### 🐍 4. Python ML Backend Setup

The FastAPI server handles model inference for the mess metrics. Setting it up:

1. Navigate to the root directory (or create a virtual environment in the `backend/` folder):
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
2. Install the required Python packages:
   ```bash
   pip install fastapi uvicorn pydantic pandas numpy xgboost scikit-learn joblib
   ```
3. Start the FastAPI backend:
   ```bash
   python backend/app.py
   ```
   The ML backend will start running on `http://127.0.0.1:8000`.

---

### 💻 5. Running the Web Application

With the FastAPI service running, start the Node.js API server and the React frontend:

1. **Start Express API Server**:
   ```bash
   pnpm --filter @workspace/api-server run dev
   ```
   The server will start listening on `http://localhost:3000`.

2. **Start Vite React Frontend**:
   ```bash
   pnpm --filter @workspace/hostel-app run dev
   ```
   Open your browser and navigate to the local server URL (usually `http://localhost:5173`) to view the application!

---

## 🔒 License

This project is licensed under the MIT License. See the LICENSE file for details.
