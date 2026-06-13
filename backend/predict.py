import datetime
import numpy as np
import pandas as pd

def get_semester_and_capacity(dt):
    year = dt.year
    month = dt.month
    day = dt.day
    
    # Semester mapping
    # Spring: Jan 1 to May 31
    # Summer (Vacation): June 1 to July 31
    # Fall: Aug 1 to Dec 31
    
    if month in [1, 2, 3, 4, 5]:
        semester = 'Spring'
        sem_start = datetime.date(year, 1, 1)
        sem_week = ((dt - sem_start).days // 7) + 1
        
        # Capacities by semester
        capacities = {2026: 980, 2027: 995, 2028: 1005}
        capacity = capacities.get(year, 1000)
        
    elif month in [6, 7]:
        semester = 'Summer'
        sem_week = 0 # vacation term
        capacities = {2026: 250, 2027: 280, 2028: 310}
        capacity = capacities.get(year, 300)
        
    else: # Fall: Aug to Dec
        semester = 'Fall'
        sem_start = datetime.date(year, 8, 1)
        sem_week = ((dt - sem_start).days // 7) + 1
        
        capacities = {2026: 1020, 2027: 1015, 2028: 1030}
        capacity = capacities.get(year, 1000)
        
    return capacity, sem_week

def make_prediction(attendance_model, waste_model, input_data):
    # input_data keys: date (YYYY-MM-DD), meal (Breakfast/Lunch/Dinner), menu (string),
    # examWeek (bool), festival (bool), holidayNear (bool), rain (bool)
    dt = datetime.datetime.strptime(input_data["date"], "%Y-%m-%d").date()
    day_name = dt.strftime('%A')
    day_of_week = dt.weekday()  # Monday=0, Sunday=6
    month = dt.month
    is_weekend = 1 if day_of_week >= 5 else 0
    
    capacity, sem_week = get_semester_and_capacity(dt)
    
    # User toggles
    exam_week = 1 if input_data.get("examWeek", False) else 0
    midsem = 0
    endsem = 0
    festival = 1 if input_data.get("festival", False) else 0
    holiday_near = 1 if input_data.get("holidayNear", False) else 0
    rain = 1 if input_data.get("rain", False) else 0
    
    # Holiday indicators (simplified, we use holiday_near for tomorrow and after_2_days)
    holiday_tomorrow = 0
    holiday_after_2_days = 0
    
    # Create DataFrame for Model 1 (Attendance)
    features_1 = pd.DataFrame([{
        "DayOfWeek": day_name,
        "Month": month,
        "SemesterWeek": sem_week,
        "Weekend": is_weekend,
        "Meal": input_data["meal"],
        "Menu": input_data["menu"],
        "Capacity": capacity,
        "ExamWeek": exam_week,
        "MidSem": midsem,
        "EndSem": endsem,
        "Festival": festival,
        "HolidayTomorrow": holiday_tomorrow,
        "HolidayAfter2Days": holiday_after_2_days,
        "HolidayNear": holiday_near,
        "Rain": rain
    }])
    
    # Cast variables to exactly match training types
    features_1["Month"] = features_1["Month"].astype(np.int64)
    features_1["SemesterWeek"] = features_1["SemesterWeek"].astype(np.int64)
    features_1["Weekend"] = features_1["Weekend"].astype(np.int64)
    features_1["Capacity"] = features_1["Capacity"].astype(np.int64)
    features_1["ExamWeek"] = features_1["ExamWeek"].astype(np.int64)
    features_1["MidSem"] = features_1["MidSem"].astype(np.int64)
    features_1["EndSem"] = features_1["EndSem"].astype(np.int64)
    features_1["Festival"] = features_1["Festival"].astype(np.int64)
    features_1["HolidayTomorrow"] = features_1["HolidayTomorrow"].astype(np.int64)
    features_1["HolidayAfter2Days"] = features_1["HolidayAfter2Days"].astype(np.int64)
    features_1["HolidayNear"] = features_1["HolidayNear"].astype(np.int64)
    features_1["Rain"] = features_1["Rain"].astype(np.int64)
    
    # Predict attendance using model 1
    pred_attendance_raw = attendance_model.predict(features_1)[0]
    predicted_attendance = float(np.clip(pred_attendance_raw, 0, capacity))
    
    # Safety margin for expected attendance (expected_attendance = predicted_attendance * 1.10)
    expected_attendance = predicted_attendance * 1.10
    
    # Prepared food using avg consumption rate
    # Breakfast: 0.8kg, Lunch: 1.2kg, Dinner: 1.0kg
    consumption_rates = {"Breakfast": 0.8, "Lunch": 1.2, "Dinner": 1.0}
    avg_consumption = consumption_rates.get(input_data["meal"], 1.2)
    prepared_food = expected_attendance * avg_consumption
    
    # Create DataFrame for Model 2 (Waste)
    features_2 = pd.DataFrame([{
        "PredictedAttendance": float(predicted_attendance),
        "PredictedExpectedAttendance": float(expected_attendance),
        "PredictedPreparedFood_kg": float(prepared_food),
        "Meal": input_data["meal"],
        "Menu": input_data["menu"],
        "ExamWeek": exam_week,
        "MidSem": midsem,
        "EndSem": endsem,
        "Festival": festival,
        "HolidayNear": holiday_near,
        "Rain": rain
    }])
    
    # Cast float features to float32 and integers to int64 for model 2
    features_2["PredictedAttendance"] = features_2["PredictedAttendance"].astype(np.float32)
    features_2["PredictedExpectedAttendance"] = features_2["PredictedExpectedAttendance"].astype(np.float32)
    features_2["PredictedPreparedFood_kg"] = features_2["PredictedPreparedFood_kg"].astype(np.float32)
    for col in ["ExamWeek", "MidSem", "EndSem", "Festival", "HolidayNear", "Rain"]:
        features_2[col] = features_2[col].astype(np.int64)
        
    # Predict waste using model 2
    pred_waste_raw = waste_model.predict(features_2)[0]
    predicted_waste = float(np.maximum(0.0, pred_waste_raw))
    
    return {
        "attendance": int(round(predicted_attendance)),
        "expectedAttendance": int(round(expected_attendance)),
        "preparedFoodKg": int(round(prepared_food)),
        "wasteKg": int(round(predicted_waste))
    }
