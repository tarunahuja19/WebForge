import os
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from skl2onnx import convert_sklearn, update_registered_converter
from skl2onnx.common.data_types import FloatTensorType, StringTensorType, Int64TensorType
from skl2onnx.common.shape_calculator import calculate_linear_regressor_output_shapes
from onnxmltools.convert.xgboost.operator_converters.XGBoost import convert_xgboost

# Register XGBRegressor converter with skl2onnx
update_registered_converter(
    xgb.XGBRegressor,
    'XGBRegressor',
    calculate_linear_regressor_output_shapes,
    convert_xgboost,
    options={'nestimator': None}
)

def main():
    print("--- Starting Mess Waste Prediction ML Pipeline (ONNX Export Edition) ---")
    
    current_dir = os.path.dirname(os.path.abspath(__file__))
    # 1. Load Dataset
    data_path = os.path.join(current_dir, 'meal_summary.csv')
    if not os.path.exists(data_path):
        raise FileNotFoundError(f"Dataset not found at {data_path}")
        
    df = pd.read_csv(data_path)
    print(f"Loaded dataset containing {len(df)} rows.")

    # ----------------------------------------------------
    # MODEL 1: ATTENDANCE PREDICTION
    # ----------------------------------------------------
    print("\n--- Training Model 1 (Attendance Prediction) ---")
    
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
    
    # Format numerical values to int64 for ONNX type matching
    for col in numerical_cols_1:
        df[col] = df[col].astype(np.int64)
        
    X_1 = df[features_1]
    y_1 = df[target_1]
    
    X_train_1, X_test_1, y_train_1, y_test_1 = train_test_split(
        X_1, y_1, test_size=0.2, random_state=42
    )
    
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
    
    pipeline_1.fit(X_train_1, y_train_1)
    
    # Evaluate Model 1
    y_pred_1 = pipeline_1.predict(X_test_1)
    # Clip predictions to [0, Capacity]
    y_pred_1 = np.maximum(0, y_pred_1)
    y_pred_1 = np.minimum(X_test_1['Capacity'].values, y_pred_1)
    
    mae_1 = mean_absolute_error(y_test_1, y_pred_1)
    rmse_1 = np.sqrt(mean_squared_error(y_test_1, y_pred_1))
    r2_1 = r2_score(y_test_1, y_pred_1)
    
    print("Model 1 Metrics (Attendance):")
    print(f"  MAE: {mae_1:.4f} students")
    print(f"  RMSE: {rmse_1:.4f} students")
    print(f"  R² Score: {r2_1:.4f}")
    
    # Export Model 1 Pipeline to ONNX
    initial_types_1 = [
        ('DayOfWeek', StringTensorType([None, 1])),
        ('Month', Int64TensorType([None, 1])),
        ('SemesterWeek', Int64TensorType([None, 1])),
        ('Weekend', Int64TensorType([None, 1])),
        ('Meal', StringTensorType([None, 1])),
        ('Menu', StringTensorType([None, 1])),
        ('Capacity', Int64TensorType([None, 1])),
        ('ExamWeek', Int64TensorType([None, 1])),
        ('MidSem', Int64TensorType([None, 1])),
        ('EndSem', Int64TensorType([None, 1])),
        ('Festival', Int64TensorType([None, 1])),
        ('HolidayTomorrow', Int64TensorType([None, 1])),
        ('HolidayAfter2Days', Int64TensorType([None, 1])),
        ('HolidayNear', Int64TensorType([None, 1])),
        ('Rain', Int64TensorType([None, 1]))
    ]
    
    onnx_model_1 = convert_sklearn(
        pipeline_1,
        name="attendance_prediction_pipeline",
        initial_types=initial_types_1,
        target_opset={'': 15, 'ai.onnx.ml': 3}
    )
    
    onnx_path_1 = os.path.join(current_dir, 'attendance_model.onnx')
    with open(onnx_path_1, 'wb') as f:
        f.write(onnx_model_1.SerializeToString())
    print(f"Exported Model 1 ONNX model to {onnx_path_1}")

    # ----------------------------------------------------
    # MODEL 2 PREPARATION: KITCHEN PLANNING SIMULATION
    # ----------------------------------------------------
    print("\n--- Running Inference for Model 2 Preparation ---")
    
    df['PredictedAttendance'] = pipeline_1.predict(X_1)
    df['PredictedAttendance'] = np.maximum(0, df['PredictedAttendance'])
    df['PredictedAttendance'] = np.minimum(df['Capacity'], df['PredictedAttendance'])
    
    np.random.seed(42)
    safety_factors = np.random.uniform(1.05, 1.20, size=len(df))
    df['PredictedExpectedAttendance'] = df['PredictedAttendance'] * safety_factors
    
    consumption_rates = {'Breakfast': 0.8, 'Lunch': 1.2, 'Dinner': 1.0}
    df['PredictedPreparedFood_kg'] = df['PredictedExpectedAttendance'] * df['Meal'].map(consumption_rates)
    
    # Cast generated float features to float32 for ONNX matching
    float_features_2 = ['PredictedAttendance', 'PredictedExpectedAttendance', 'PredictedPreparedFood_kg']
    for col in float_features_2:
        df[col] = df[col].astype(np.float32)

    # ----------------------------------------------------
    # MODEL 2: WASTE PREDICTION
    # ----------------------------------------------------
    print("\n--- Training Model 2 (Waste Prediction) ---")
    
    features_2 = [
        'PredictedAttendance', 'PredictedExpectedAttendance', 'PredictedPreparedFood_kg',
        'Meal', 'Menu', 'ExamWeek', 'MidSem', 'EndSem', 'Festival', 'HolidayNear', 'Rain'
    ]
    target_2 = 'Waste_kg'
    
    categorical_cols_2 = ['Meal', 'Menu']
    numerical_cols_2 = [
        'ExamWeek', 'MidSem', 'EndSem', 'Festival', 'HolidayNear', 'Rain'
    ]
    
    # Format integers to int64 for ONNX type matching
    for col in numerical_cols_2:
        df[col] = df[col].astype(np.int64)
        
    X_2 = df[features_2]
    y_2 = df[target_2]
    
    X_train_2, X_test_2, y_train_2, y_test_2 = train_test_split(
        X_2, y_2, test_size=0.2, random_state=42
    )
    
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
    
    pipeline_2.fit(X_train_2, y_train_2)
    
    # Evaluate Model 2
    y_pred_2 = pipeline_2.predict(X_test_2)
    y_pred_2 = np.maximum(0, y_pred_2)
    
    mae_2 = mean_absolute_error(y_test_2, y_pred_2)
    rmse_2 = np.sqrt(mean_squared_error(y_test_2, y_pred_2))
    r2_2 = r2_score(y_test_2, y_pred_2)
    
    print("Model 2 Metrics (Waste):")
    print(f"  MAE: {mae_2:.4f} kg")
    print(f"  RMSE: {rmse_2:.4f} kg")
    print(f"  R² Score: {r2_2:.4f}")
    
    # Export Model 2 Pipeline to ONNX
    initial_types_2 = [
        ('PredictedAttendance', FloatTensorType([None, 1])),
        ('PredictedExpectedAttendance', FloatTensorType([None, 1])),
        ('PredictedPreparedFood_kg', FloatTensorType([None, 1])),
        ('Meal', StringTensorType([None, 1])),
        ('Menu', StringTensorType([None, 1])),
        ('ExamWeek', Int64TensorType([None, 1])),
        ('MidSem', Int64TensorType([None, 1])),
        ('EndSem', Int64TensorType([None, 1])),
        ('Festival', Int64TensorType([None, 1])),
        ('HolidayNear', Int64TensorType([None, 1])),
        ('Rain', Int64TensorType([None, 1]))
    ]
    
    onnx_model_2 = convert_sklearn(
        pipeline_2,
        name="waste_prediction_pipeline",
        initial_types=initial_types_2,
        target_opset={'': 15, 'ai.onnx.ml': 3}
    )
    
    onnx_path_2 = os.path.join(current_dir, 'waste_model.onnx')
    with open(onnx_path_2, 'wb') as f:
        f.write(onnx_model_2.SerializeToString())
    print(f"Exported Model 2 ONNX model to {onnx_path_2}")
    
    print("\n--- Training & ONNX Export Complete ---")

if __name__ == '__main__':
    main()
