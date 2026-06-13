import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
import joblib

def main():
    print("--- Training Models and Exporting to Pickle format ---")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # 1. Load Dataset
    data_path = os.path.join(current_dir, 'meal_summary.csv')
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")
        
    df = pd.read_csv(data_path)
    print(f"Loaded dataset containing {len(df)} rows.")

    # Create output directory for backend models if it doesn't exist
    backend_dir = os.path.join(current_dir, '../backend')
    os.makedirs(backend_dir, exist_ok=True)

    # ----------------------------------------------------
    # MODEL 1: ATTENDANCE PREDICTION
    # ----------------------------------------------------
    print("\nTraining Model 1 (Attendance)...")
    
    features_1 = [
        'DayOfWeek', 'Month', 'SemesterWeek', 'Weekend', 'Meal', 'Menu', 
        'Capacity', 'ExamWeek', 'MidSem', 'EndSem', 'Festival', 
        'HolidayTomorrow', 'HolidayAfter2Days', 'HolidayNear', 'Rain'
    ]
    target_1 = 'Attendance'
    
    categorical_cols_1 = ['DayOfWeek', 'Meal', 'Menu']
    numerical_cols_1 = [
        'Month', 'SemesterWeek', 'Weekend', 'Capacity', 'ExamWeek', 'MidSem', 
        'EndSem', 'Festival', 'HolidayTomorrow', 'HolidayAfter2Days', 
        'HolidayNear', 'Rain'
    ]
    
    # Format numerical values to int64 for type matching
    for col in numerical_cols_1:
        df[col] = df[col].astype(np.int64)
        
    X_1 = df[features_1]
    y_1 = df[target_1]
    
    preprocessor_1 = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols_1),
            ('num', 'passthrough', numerical_cols_1)
        ]
    )
    
    pipeline_1 = Pipeline([
        ('preprocessor', preprocessor_1),
        ('regressor', xgb.XGBRegressor(
            n_estimators=150,
            learning_rate=0.08,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        ))
    ])
    
    pipeline_1.fit(X_1, y_1)
    
    # Save Model 1 as pickle
    model1_path = os.path.join(backend_dir, 'attendance_model.pkl')
    joblib.dump(pipeline_1, model1_path)
    print(f"Exported attendance model to {model1_path}")

    # ----------------------------------------------------
    # MODEL 2 PREPARATION
    # ----------------------------------------------------
    df['PredictedAttendance'] = pipeline_1.predict(X_1)
    df['PredictedAttendance'] = np.maximum(0, df['PredictedAttendance'])
    df['PredictedAttendance'] = np.minimum(df['Capacity'], df['PredictedAttendance'])
    
    np.random.seed(42)
    safety_factors = np.random.uniform(1.05, 1.20, size=len(df))
    df['PredictedExpectedAttendance'] = df['PredictedAttendance'] * safety_factors
    
    consumption_rates = {'Breakfast': 0.8, 'Lunch': 1.2, 'Dinner': 1.0}
    df['PredictedPreparedFood_kg'] = df['PredictedExpectedAttendance'] * df['Meal'].map(consumption_rates)
    
    # Cast generated float features to float32
    float_features_2 = ['PredictedAttendance', 'PredictedExpectedAttendance', 'PredictedPreparedFood_kg']
    for col in float_features_2:
        df[col] = df[col].astype(np.float32)

    # ----------------------------------------------------
    # MODEL 2: WASTE PREDICTION
    # ----------------------------------------------------
    print("\nTraining Model 2 (Waste)...")
    
    features_2 = [
        'PredictedAttendance', 'PredictedExpectedAttendance', 'PredictedPreparedFood_kg',
        'Meal', 'Menu', 'ExamWeek', 'MidSem', 'EndSem', 'Festival', 'HolidayNear', 'Rain'
    ]
    target_2 = 'Waste_kg'
    
    categorical_cols_2 = ['Meal', 'Menu']
    numerical_cols_2 = [
        'ExamWeek', 'MidSem', 'EndSem', 'Festival', 'HolidayNear', 'Rain'
    ]
    
    # Format integers to int64
    for col in numerical_cols_2:
        df[col] = df[col].astype(np.int64)
        
    X_2 = df[features_2]
    y_2 = df[target_2]
    
    preprocessor_2 = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), categorical_cols_2),
            ('num', 'passthrough', float_features_2 + numerical_cols_2)
        ]
    )
    
    pipeline_2 = Pipeline([
        ('preprocessor', preprocessor_2),
        ('regressor', xgb.XGBRegressor(
            n_estimators=150,
            learning_rate=0.08,
            max_depth=6,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42
        ))
    ])
    
    pipeline_2.fit(X_2, y_2)
    
    # Save Model 2 as pickle
    model2_path = os.path.join(backend_dir, 'waste_model.pkl')
    joblib.dump(pipeline_2, model2_path)
    print(f"Exported waste model to {model2_path}")
    print("\nTraining and Pickle serialization complete!")

if __name__ == '__main__':
    main()
