import pandas as pd
import numpy as np
import datetime
import os

# Set seed for reproducibility
np.random.seed(42)

# Date Configuration (3 Years: 2026, 2027, 2028)
START_DATE = datetime.date(2026, 1, 1)
END_DATE = datetime.date(2028, 12, 31)
DAYS = (END_DATE - START_DATE).days + 1
dates = [START_DATE + datetime.timedelta(days=i) for i in range(DAYS)]

# 1. Expanded Menu Pools (20 items per meal)
menus_by_meal = {
    'Breakfast': [
        ('Masala Dosa', 'Dosa/Idli', 40),
        ('Idli Sambhar', 'Dosa/Idli', 40),
        ('Rava Dosa', 'Dosa/Idli', 40),
        ('Uttapam', 'Dosa/Idli', 40),
        ('Idli Vada Combo', 'Dosa/Idli', 40),
        ('Aloo Paratha', 'Chole dishes', 50),
        ('Paneer Paratha', 'Paneer dishes', 120),
        ('Chole Bhature Breakfast', 'Chole dishes', 50),
        ('Puri Sabji', 'Chole dishes', 50),
        ('Poha', 'Dal Rice', 0),
        ('Plain Upma', 'Dal Rice', 0),
        ('Methi Thepla', 'Dal Rice', 0),
        ('Bread Butter Jam', 'Dal Rice', 0),
        ('Veg Sandwich', 'Dal Rice', 0),
        ('Rava Upma', 'Dal Rice', 0),
        ('Cornflakes & Milk', 'Dal Rice', 0),
        ('Vermicelli Upma', 'Dal Rice', 0),
        ('Masala Khichdi', 'Khichdi', -80),
        ('Oats Porridge', 'Khichdi', -80),
        ('Plain Khichdi Breakfast', 'Khichdi', -80),
    ],
    'Lunch': [
        ('Kadhai Paneer & Roti', 'Paneer dishes', 120),
        ('Paneer Butter Masala', 'Paneer dishes', 120),
        ('Palak Paneer & Rice', 'Paneer dishes', 120),
        ('Shahi Paneer & Naan', 'Paneer dishes', 120),
        ('Rajma Chawal', 'Rajma dishes', 70),
        ('Rajma Masala & Roti', 'Rajma dishes', 70),
        ('Vegetable Biryani', 'Rajma dishes', 70),
        ('Chole Bhature', 'Chole dishes', 50),
        ('Chole Masala & Rice', 'Chole dishes', 50),
        ('Dal Tadka & Rice', 'Dal Rice', 0),
        ('Jeera Rice & Dal Fry', 'Dal Rice', 0),
        ('Dal Makhani & Roti', 'Dal Rice', 0),
        ('Aloo Gobhi & Roti', 'Dal Rice', 0),
        ('Mix Veg & Paratha', 'Dal Rice', 0),
        ('Veg Khichdi', 'Khichdi', -80),
        ('Moong Dal Khichdi', 'Khichdi', -80),
        ('Lauki Ki Sabji', 'Lauki/Tinda', -150),
        ('Lauki Kofta Curry', 'Lauki/Tinda', -150),
        ('Tinda Masala & Roti', 'Lauki/Tinda', -150),
        ('Tinda Tomato Curry', 'Lauki/Tinda', -150),
    ],
    'Dinner': [
        ('Paneer Tikka Masala', 'Paneer dishes', 120),
        ('Matar Paneer & Roti', 'Paneer dishes', 120),
        ('Paneer Bhurji & Paratha', 'Paneer dishes', 120),
        ('Paneer Kofta', 'Paneer dishes', 120),
        ('Chicken Biryani / Veg Biryani', 'Paneer dishes', 120),
        ('Rajma Masala Dinner', 'Rajma dishes', 70),
        ('Kashmiri Rajma & Rice', 'Rajma dishes', 70),
        ('Egg Curry & Rice', 'Rajma dishes', 70),
        ('Chole Kulche', 'Chole dishes', 50),
        ('Amritsari Chole', 'Chole dishes', 50),
        ('Dal Fry & Jeera Rice', 'Dal Rice', 0),
        ('Bhindi Masala & Roti', 'Dal Rice', 0),
        ('Aloo Methi & Paratha', 'Dal Rice', 0),
        ('Baingan Bharta & Roti', 'Dal Rice', 0),
        ('Yellow Dal & Steamed Rice', 'Dal Rice', 0),
        ('Veg Pulao & Raita', 'Dal Rice', 0),
        ('Dal Khichdi Dinner', 'Khichdi', -80),
        ('Plain Khichdi & Papad', 'Khichdi', -80),
        ('Lauki Ki Bhurji', 'Lauki/Tinda', -150),
        ('Stuffed Tinda Curry', 'Lauki/Tinda', -150),
    ]
}

# 2. Base Weekly Menu Schedule (Index in menu pool, 0-19)
base_weekly_menu = {
    'Breakfast': {
        0: 0,   # Mon: Masala Dosa
        1: 9,   # Tue: Poha
        2: 5,   # Wed: Aloo Paratha
        3: 12,  # Thu: Bread Butter Jam
        4: 17,  # Fri: Masala Khichdi
        5: 15,  # Sat: Cornflakes & Milk
        6: 4,   # Sun: Idli Vada Combo
    },
    'Lunch': {
        0: 9,   # Mon: Dal Tadka & Rice
        1: 4,   # Tue: Rajma Chawal
        2: 16,  # Wed: Lauki Ki Sabji
        3: 0,   # Thu: Kadhai Paneer & Roti
        4: 7,   # Fri: Chole Bhature
        5: 14,  # Sat: Veg Khichdi
        6: 6,   # Sun: Vegetable Biryani
    },
    'Dinner': {
        0: 10,  # Mon: Dal Fry & Jeera Rice
        1: 18,  # Tue: Lauki Ki Bhurji
        2: 0,   # Wed: Paneer Tikka Masala
        3: 5,   # Thu: Rajma Masala Dinner
        4: 8,   # Fri: Chole Kulche
        5: 16,  # Sat: Dal Khichdi Dinner
        6: 4,   # Sun: Chicken Biryani / Veg Biryani
    }
}

# Helper to determine academic semester blocks and capacities
def get_semester_and_capacity(date):
    year = date.year
    month = date.month
    day = date.day
    
    # Semester mapping
    # Spring: Jan 1 to May 31
    # Summer (Vacation): June 1 to July 31
    # Fall: Aug 1 to Dec 31
    
    if month in [1, 2, 3, 4, 5]:
        semester = 'Spring'
        sem_start = datetime.date(year, 1, 1)
        sem_week = ((date - sem_start).days // 7) + 1
        
        # Capacities by semester
        capacities = {2026: 980, 2027: 995, 2028: 1005}
        capacity = capacities[year]
        
        # Exams
        midsem = 1 if sem_week in [9, 10] else 0
        endsem = 1 if sem_week in [21, 22] else 0
        exam_week = 1 if sem_week in [8, 9, 10, 20, 21, 22] else 0
        
    elif month in [6, 7]:
        semester = 'Summer'
        sem_week = 0 # vacation term
        capacities = {2026: 250, 2027: 280, 2028: 310}
        capacity = capacities[year]
        midsem = 0
        endsem = 0
        exam_week = 0
        
    else: # Fall: Aug to Dec
        semester = 'Fall'
        sem_start = datetime.date(year, 8, 1)
        sem_week = ((date - sem_start).days // 7) + 1
        
        capacities = {2026: 1020, 2027: 1015, 2028: 1030}
        capacity = capacities[year]
        
        # Exams
        midsem = 1 if sem_week in [9, 10] else 0
        endsem = 1 if sem_week in [21, 22] else 0
        exam_week = 1 if sem_week in [8, 9, 10, 20, 21, 22] else 0
        
    return semester, capacity, sem_week, midsem, endsem, exam_week

# Helper to check if date is a holiday
def check_holiday(date):
    month = date.month
    day = date.day
    
    # Standard public holidays
    if (month == 1 and day == 26) or \
       (month == 5 and day == 1) or \
       (month == 8 and day == 15) or \
       (month == 10 and day == 2) or \
       (month == 12 and day == 25):
        return True
    
    # Floating holidays by day of year (approximated)
    doy = date.timetuple().tm_yday
    if doy in [74, 102, 305, 306]: # Holi, Good Friday, Diwali, Govardhan Puja
        return True
        
    return False

# Precompute holidays
holiday_dates = {d for d in dates if check_holiday(d)}

df_list = []

for date in dates:
    day_name = date.strftime('%A')
    day_of_week = date.weekday()  # Monday=0, Sunday=6
    month = date.month
    is_weekend = 1 if day_of_week >= 5 else 0
    
    semester, capacity, sem_week, midsem, endsem, exam_week = get_semester_and_capacity(date)
    
    # Holiday indicators
    holiday_tomorrow = 1 if (date + datetime.timedelta(days=1)) in holiday_dates else 0
    holiday_after_2_days = 1 if (date + datetime.timedelta(days=2)) in holiday_dates else 0
    holiday_near = 1 if (holiday_tomorrow or holiday_after_2_days or date in holiday_dates) else 0
    
    # Festivals (actual festival days)
    doy = date.timetuple().tm_yday
    is_festival = 0
    if date in holiday_dates and (doy in [74, 305, 306] or (month == 12 and date.day == 25)):
        is_festival = 1
        
    # Rain (Monsoons: June-Sept higher prob)
    rain_prob = 0.35 if month in [6, 7, 8, 9] else 0.05
    rain = 1 if np.random.rand() < rain_prob else 0
    
    for meal in ['Breakfast', 'Lunch', 'Dinner']:
        # Base weekly menu index
        base_idx = base_weekly_menu[meal][day_of_week]
        
        # 15% chance to swap dish from the pool of 20
        if np.random.rand() < 0.15:
            options = [i for i in range(20) if i != base_idx]
            menu_idx = np.random.choice(options)
        else:
            menu_idx = base_idx
            
        menu_name, menu_cat, menu_score = menus_by_meal[meal][menu_idx]
        
        # Base Attendance by Meal
        if meal == 'Breakfast':
            base_att = np.random.uniform(0.60, 0.80) * capacity
            avg_consumption = 0.8  # kg
        elif meal == 'Lunch':
            base_att = np.random.uniform(0.75, 0.95) * capacity
            avg_consumption = 1.2  # kg
        else:  # Dinner
            base_att = np.random.uniform(0.70, 0.90) * capacity
            avg_consumption = 1.0  # kg
            
        # Add Menu Popularity Effect
        attendance = base_att + menu_score
        
        # Day Effects
        if day_of_week == 6 and meal == 'Breakfast':  # Sunday breakfast
            attendance -= np.random.uniform(0.35, 0.45) * base_att
        elif day_of_week == 4 and meal == 'Dinner':  # Friday dinner
            attendance -= 40
        elif is_weekend:
            attendance -= 50
            
        # Academic Effects
        if exam_week:
            attendance += 30
        if midsem:
            attendance += 40
        if endsem:
            attendance -= 200  # students leave campus
            
        # Holiday Effects
        if holiday_tomorrow:
            attendance -= 120
        if holiday_near:
            attendance -= 60
        if is_festival:
            attendance += np.random.uniform(-180, 80)
            
        # Weather Effects
        if rain:
            attendance += 25
            
        # Add Gaussian Noise
        noise = np.random.normal(0, 20)
        attendance += noise
        
        # Clip Attendance to Capacity bounds
        attendance = int(round(max(0, min(capacity, attendance))))
        
        # Introduce Forecast Error (Kitchen plans with error relative to true attendance)
        forecast_error = np.random.normal(0, 50)
        expected_attendance = int(round(max(0, min(capacity, attendance + forecast_error))))
        
        # Food Preparation (kg) using expected attendance and safety factor
        safety_factor = np.random.uniform(1.05, 1.20)
        prepared_food = expected_attendance * safety_factor * avg_consumption
        prepared_food = round(max(0.0, prepared_food), 2)
        
        # Waste Generation
        # Consumption ratio based on menu popularity category
        if menu_score > 0:
            consumption_ratio = np.random.uniform(1.00, 1.05)
        elif menu_score < 0:
            consumption_ratio = np.random.uniform(0.85, 0.95)
        else:
            consumption_ratio = 1.0
            
        # Actual Eaten food cannot exceed Prepared Food
        actual_eaten = min(prepared_food, attendance * avg_consumption * consumption_ratio)
        
        # Operational waste noise (base waste for preparation, kitchen mistakes, plate scraping)
        op_noise = np.random.normal(15, 10)
        waste = prepared_food - actual_eaten + op_noise
        
        # Clamp waste to minimum non-negative baseline
        waste = round(max(5.0, waste), 2)
        
        df_list.append({
            'Date': date.strftime('%Y-%m-%d'),
            'DayOfWeek': day_name,
            'Month': month,
            'SemesterWeek': sem_week,
            'Weekend': is_weekend,
            'Meal': meal,
            'Menu': menu_name,
            'Attendance': attendance,
            'Capacity': capacity,
            'ExamWeek': exam_week,
            'MidSem': midsem,
            'EndSem': endsem,
            'Festival': is_festival,
            'HolidayTomorrow': holiday_tomorrow,
            'HolidayAfter2Days': holiday_after_2_days,
            'HolidayNear': holiday_near,
            'Rain': rain,
            'ExpectedAttendance': expected_attendance,
            'PreparedFood_kg': prepared_food,
            'Waste_kg': waste
        })

df = pd.DataFrame(df_list)
current_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(current_dir, 'meal_summary.csv')
df.to_csv(csv_path, index=False)
print(f"Data generation complete. 3 years of data saved to {csv_path}. Total rows: {len(df)}")
