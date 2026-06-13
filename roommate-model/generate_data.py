import os
import random
import csv
import math

def format_hour(float_hour):
    """
    Converts a float hour representation (e.g. 23.5 or 1.25) to a formatted 
    time string like '11:30 PM' or '01:15 AM' rounded to the nearest 30-minute block.
    """
    # Round to nearest 0.5 hours (30 minutes)
    rounded_hour = round(float_hour * 2) / 2
    minutes = int(rounded_hour * 60)
    hours = (minutes // 60) % 24
    mins = minutes % 60
    
    period = "AM"
    if hours >= 12:
        period = "PM"
        
    display_hour = hours % 12
    if display_hour == 0:
        display_hour = 12
        
    return f"{display_hour}:{mins:02d} {period}"

def generate_dataset(num_records=5000):
    # Determine absolute paths
    base_dir = os.path.dirname(os.path.abspath(__file__))
    first_names_path = os.path.join(base_dir, "2. First.txt")
    last_names_path = os.path.join(base_dir, "5. Last.txt")
    output_path = os.path.join(base_dir, "roommate_data.csv")
    
    # Read names
    with open(first_names_path, "r", encoding="utf-8") as f:
        first_names = [line.strip() for line in f if line.strip()]
        
    with open(last_names_path, "r", encoding="utf-8") as f:
        last_names = [line.strip() for line in f if line.strip()]
        
    print(f"Loaded {len(first_names)} first names and {len(last_names)} last names.")
    print(f"Total potential unique name combinations: {len(first_names) * len(last_names)}")
    
    # Courses
    courses = [
        "Computer Science",
        "Mechanical Engineering",
        "Electrical Engineering",
        "Business Administration",
        "Psychology",
        "English Literature",
        "Biology",
        "Mathematics",
        "Chemistry"
    ]
    
    # Academic years
    years = ["1st year", "2nd year", "3rd year", "4th year"]
    
    # Diets
    diets = ["veg", "nonveg", "eggetarian", "vegan", "no_pref"]
    diet_weights = [0.35, 0.50, 0.08, 0.02, 0.05]
    
    # Set seed for reproducibility
    random.seed(42)
    
    records = []
    
    for i in range(num_records):
        # 1. Name
        f_name = random.choice(first_names)
        l_name = random.choice(last_names)
        name = f"{f_name} {l_name}"
        
        # 2. Year and Age (Correlated)
        year = random.choice(years)
        if year == "1st year":
            age = random.choices([17, 18, 19], weights=[0.10, 0.80, 0.10])[0]
        elif year == "2nd year":
            age = random.choices([18, 19, 20], weights=[0.10, 0.80, 0.10])[0]
        elif year == "3rd year":
            age = random.choices([19, 20, 21], weights=[0.10, 0.80, 0.10])[0]
        else:  # 4th year
            age = random.choices([20, 21, 22, 23], weights=[0.10, 0.75, 0.12, 0.03])[0]
            
        # 3. Course
        course = random.choice(courses)
        
        # 4. Gender (Correlated with Course)
        if course in ["Computer Science", "Mechanical Engineering", "Electrical Engineering"]:
            # STEM fields skewed Male
            gender = random.choices(["Male", "Female", "Non-binary"], weights=[0.70, 0.25, 0.05])[0]
        elif course in ["Psychology", "English Literature", "Biology"]:
            # Humanities/Bio skewed Female
            gender = random.choices(["Male", "Female", "Non-binary"], weights=[0.30, 0.65, 0.05])[0]
        else:
            # Balanced
            gender = random.choices(["Male", "Female", "Non-binary"], weights=[0.47, 0.48, 0.05])[0]
            
        # 5. Introvert/Extrovert scale (1-5)
        introvert_extrovert = random.choices([1, 2, 3, 4, 5], weights=[0.15, 0.25, 0.30, 0.20, 0.10])[0]
        
        # 6. Guest Frequency (Correlated with Introvert/Extrovert)
        if introvert_extrovert in [1, 2]:
            guest_freq = random.choices(["never", "sometimes", "often"], weights=[0.60, 0.38, 0.02])[0]
        elif introvert_extrovert == 3:
            guest_freq = random.choices(["never", "sometimes", "often"], weights=[0.15, 0.70, 0.15])[0]
        else: # 4 or 5
            guest_freq = random.choices(["never", "sometimes", "often"], weights=[0.05, 0.50, 0.45])[0]
            
        # 7. Friends in Room (Correlated with Introvert/Extrovert and Guest Freq)
        # If guest_freq is 'never', highly likely 'No'. If 'often', highly likely 'Yes'.
        if guest_freq == "never":
            friends_in_room = random.choices(["Yes", "No"], weights=[0.05, 0.95])[0]
        elif guest_freq == "sometimes":
            if introvert_extrovert in [1, 2]:
                friends_in_room = random.choices(["Yes", "No"], weights=[0.30, 0.70])[0]
            elif introvert_extrovert == 3:
                friends_in_room = random.choices(["Yes", "No"], weights=[0.50, 0.50])[0]
            else:
                friends_in_room = random.choices(["Yes", "No"], weights=[0.75, 0.25])[0]
        else: # often
            friends_in_room = random.choices(["Yes", "No"], weights=[0.90, 0.10])[0]
            
        # 8. Noise Tolerance (Correlated with Introvert/Extrovert)
        # We will use normal distribution around a mean based on sociability index
        if introvert_extrovert in [1, 2]:
            noise_mean = 2.1
        elif introvert_extrovert == 3:
            noise_mean = 3.0
        else:
            noise_mean = 3.9
        noise_val = round(random.normalvariate(noise_mean, 0.8))
        noise_tolerance = max(1, min(5, noise_val))
        
        # 9. Cleanliness (Normally distributed)
        clean_val = round(random.normalvariate(3.2, 0.9))
        cleanliness = max(1, min(5, clean_val))
        
        # 10. Study Hours Per Day (Correlated with Introvert/Extrovert)
        if introvert_extrovert in [1, 2]:
            study_mean = 5.5
        elif introvert_extrovert == 3:
            study_mean = 4.0
        else:
            study_mean = 2.8
        study_val = round(random.normalvariate(study_mean, 1.3))
        study_hours_per_day = max(1, min(10, study_val))
        
        # 11. Study Time (Correlated with Introvert/Extrovert)
        if introvert_extrovert in [1, 2]:
            # Introverts prefer morning/night to avoid afternoon distractions
            study_time = random.choices(["morning", "afternoon", "night"], weights=[0.45, 0.15, 0.40])[0]
        elif introvert_extrovert == 3:
            study_time = random.choices(["morning", "afternoon", "night"], weights=[0.30, 0.40, 0.30])[0]
        else:
            # Extroverts prefer night study or afternoon
            study_time = random.choices(["morning", "afternoon", "night"], weights=[0.15, 0.35, 0.50])[0]
            
        # 12. Diet
        diet = random.choices(diets, weights=diet_weights)[0]
        
        # 13. Sleep Time and Wake Time (Correlated with Study Time)
        # Sleep time is represented as hour from 0 to 24 (22 = 10 PM, 23 = 11 PM, 24 = 12 AM, 25 = 1 AM, etc.)
        if study_time == "morning":
            sleep_mean = 22.5  # 10:30 PM
            sleep_sd = 0.5
        elif study_time == "afternoon":
            sleep_mean = 23.5  # 11:30 PM
            sleep_sd = 0.7
        else: # night
            sleep_mean = 25.5  # 1:30 AM
            sleep_sd = 1.0
            
        sleep_hour_raw = random.normalvariate(sleep_mean, sleep_sd)
        
        # Wake time is sleep time + sleep duration (mean 7.6, sd 0.7 hours)
        sleep_duration = random.normalvariate(7.6, 0.7)
        # Sleep duration should be at least 5 hours and at most 10 hours
        sleep_duration = max(5.0, min(10.0, sleep_duration))
        
        wake_hour_raw = sleep_hour_raw + sleep_duration
        
        sleeping_time = format_hour(sleep_hour_raw)
        wake_time = format_hour(wake_hour_raw)
        
        records.append({
            "name": name,
            "age": age,
            "gender": gender,
            "year": year,
            "course": course,
            "sleeping_time": sleeping_time,
            "wake_time": wake_time,
            "study_hours_per_day": study_hours_per_day,
            "diet": diet,
            "cleanliness": cleanliness,
            "noise_tolerance": noise_tolerance,
            "guest_freq": guest_freq,
            "introvert_extrovert": introvert_extrovert,
            "study_time": study_time,
            "friends_in_room": friends_in_room
        })
        
    # Write to CSV
    fieldnames = [
        "name", "age", "gender", "year", "course", "sleeping_time", "wake_time", 
        "study_hours_per_day", "diet", "cleanliness", "noise_tolerance", 
        "guest_freq", "introvert_extrovert", "study_time", "friends_in_room"
    ]
    
    with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)
        
    print(f"Successfully generated {num_records} records in '{output_path}'.")
    return records

def run_validation(records):
    print("\n" + "="*40 + "\nDATASET VALIDATION & SUMMARY STATISTICS\n" + "="*40)
    
    # 1. Gender distribution by course type
    course_genders = {}
    for r in records:
        c = r["course"]
        g = r["gender"]
        if c not in course_genders:
            course_genders[c] = {"Male": 0, "Female": 0, "Non-binary": 0}
        course_genders[c][g] += 1
        
    print("Gender Distribution by Course:")
    for course, counts in sorted(course_genders.items()):
        total = sum(counts.values())
        print(f"  {course:<25}: Male={counts['Male']/total*100:5.1f}%, Female={counts['Female']/total*100:5.1f}%, Non-binary={counts['Non-binary']/total*100:4.1f}% (N={total})")
        
    # 2. Year vs Age distribution
    year_ages = {}
    for r in records:
        y = r["year"]
        a = r["age"]
        if y not in year_ages:
            year_ages[y] = []
        year_ages[y].append(a)
        
    print("\nAge Ranges by Year of Study:")
    for yr in sorted(year_ages.keys()):
        ages = year_ages[yr]
        avg_age = sum(ages) / len(ages)
        min_age = min(ages)
        max_age = max(ages)
        print(f"  {yr:<10}: Average Age = {avg_age:.2f} (Min: {min_age}, Max: {max_age})")
        
    # 3. Introvert/Extrovert vs Guest Freq, Noise Tolerance, Friends in Room, and Study Hours
    ie_stats = {}
    for r in records:
        ie = r["introvert_extrovert"]
        if ie not in ie_stats:
            ie_stats[ie] = {
                "noise": [],
                "study_hours": [],
                "guest_freq": {"never": 0, "sometimes": 0, "often": 0},
                "friends": {"Yes": 0, "No": 0}
            }
        ie_stats[ie]["noise"].append(r["noise_tolerance"])
        ie_stats[ie]["study_hours"].append(r["study_hours_per_day"])
        ie_stats[ie]["guest_freq"][r["guest_freq"]] += 1
        ie_stats[ie]["friends"][r["friends_in_room"]] += 1
        
    print("\nCorrelations with Introvert/Extrovert Scale (1=Introvert, 5=Extrovert):")
    for ie in sorted(ie_stats.keys()):
        stats = ie_stats[ie]
        avg_noise = sum(stats["noise"]) / len(stats["noise"])
        avg_study = sum(stats["study_hours"]) / len(stats["study_hours"])
        total_guests = sum(stats["guest_freq"].values())
        total_friends = sum(stats["friends"].values())
        
        freq_str = ", ".join(f"{k}={v/total_guests*100:.0f}%" for k, v in stats["guest_freq"].items())
        friends_str = f"Yes={stats['friends']['Yes']/total_friends*100:.0f}%"
        
        print(f"  IE Level {ie}: Noise Tolerance Avg = {avg_noise:.2f} | Study Hours Avg = {avg_study:.2f} | Guest Freq ({freq_str}) | Friends in Room ({friends_str})")

    # 4. Study Time vs. Sleeping Time distributions
    st_sleep = {}
    for r in records:
        st = r["study_time"]
        sl = r["sleeping_time"]
        if st not in st_sleep:
            st_sleep[st] = {}
        st_sleep[st][sl] = st_sleep[st].get(sl, 0) + 1
        
    print("\nMost Common Sleep Times by Preferred Study Time:")
    for st, sleep_counts in sorted(st_sleep.items()):
        sorted_sleep = sorted(sleep_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        sleep_str = ", ".join(f"{time} ({count} records)" for time, count in sorted_sleep)
        print(f"  Study Time '{st:<9}': Top sleep times = {sleep_str}")

if __name__ == "__main__":
    records = generate_dataset()
    run_validation(records)
