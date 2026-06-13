import os
import joblib
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from predict import make_prediction

app = FastAPI(title="Mess Model API")

# Load models once at startup
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
attendance_model_path = os.path.join(BASE_DIR, "attendance_model.pkl")
waste_model_path = os.path.join(BASE_DIR, "waste_model.pkl")

if not os.path.exists(attendance_model_path) or not os.path.exists(waste_model_path):
    raise RuntimeError(f"Model files not found! Checked: {attendance_model_path} and {waste_model_path}")

attendance_model = joblib.load(attendance_model_path)
waste_model = joblib.load(waste_model_path)

class PredictRequest(BaseModel):
    date: str
    meal: str
    menu: str
    examWeek: bool
    festival: bool
    holidayNear: bool
    rain: bool

@app.post("/predict")
def predict_waste(req: PredictRequest):
    try:
        results = make_prediction(attendance_model, waste_model, req.model_dump())
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
