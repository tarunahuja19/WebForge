import os
import csv
import math
import json

def parse_time_to_hour(time_str):
    """
    Parses a time string like '11:30 PM' or '12:00 AM' into a float hour (0.0 to 24.0).
    """
    try:
        parts = time_str.strip().split()
        if len(parts) != 2:
            raise ValueError(f"Invalid time format: {time_str}")
        time_part, period = parts[0], parts[1].upper()
        
        time_subparts = time_part.split(':')
        if len(time_subparts) != 2:
            raise ValueError(f"Invalid time format: {time_str}")
            
        hour = int(time_subparts[0])
        minute = int(time_subparts[1])
        
        # Convert to 24 hour basis
        hour = hour % 12
        if period == "PM":
            hour += 12
            
        return hour + (minute / 60.0)
    except Exception as e:
        print(f"Error parsing time '{time_str}': {e}")
        return 0.0

def encode_dataset():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    input_path = os.path.join(base_dir, "roommate_data.csv")
    output_path = os.path.join(base_dir, "roommate_encoded.csv")
    metadata_path = os.path.join(base_dir, "encoding_metadata.json")
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found. Please run the generation script first.")
        return
        
    print(f"Reading dataset from {input_path}...")
    
    # Define categorical options
    gender_options = ["Female", "Male", "Non-binary"]
    diet_options = ["eggetarian", "no_pref", "nonveg", "veg", "vegan"]
    study_time_options = ["afternoon", "morning", "night"]
    
    # Define features to include in the vector (dropped course, age, friends_in_room, wake_time)
    features = [
        "study_hours_per_day",
        "cleanliness",
        "noise_tolerance",
        "introvert_extrovert",
        "year",
        "guest_freq"
    ]
    
    for g in gender_options:
        features.append(f"gender_{g}")
    for d in diet_options:
        features.append(f"diet_{d}")
    for s in study_time_options:
        features.append(f"study_time_{s}")
        
    features.extend([
        "sleep_sin", "sleep_cos"
    ])
    
    # Define feature weights for KNN distance calculations
    weights = {
        "cleanliness": 2.0,
        "sleep_sin": 1.8,
        "sleep_cos": 1.8,
        "noise_tolerance": 1.5,
        "diet_eggetarian": 1.3,
        "diet_no_pref": 1.3,
        "diet_nonveg": 1.3,
        "diet_veg": 1.3,
        "diet_vegan": 1.3
    }
    
    # Maps for ordinal encoding
    year_map = {"1st year": 0.0, "2nd year": 1/3, "3rd year": 2/3, "4th year": 1.0}
    guest_map = {"never": 0.0, "sometimes": 0.5, "often": 1.0}
    
    encoded_rows = []
    
    with open(input_path, "r", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            name = row["name"]
            
            # Base scaled/mapped values
            study_hours = (float(row["study_hours_per_day"]) - 1.0) / 9.0
            cleanliness = (float(row["cleanliness"]) - 1.0) / 4.0
            noise_tolerance = (float(row["noise_tolerance"]) - 1.0) / 4.0
            introvert_extrovert = (float(row["introvert_extrovert"]) - 1.0) / 4.0
            year = year_map.get(row["year"], 0.0)
            guest_freq = guest_map.get(row["guest_freq"], 0.0)
            
            raw_vals = {
                "study_hours_per_day": study_hours,
                "cleanliness": cleanliness,
                "noise_tolerance": noise_tolerance,
                "introvert_extrovert": introvert_extrovert,
                "year": year,
                "guest_freq": guest_freq
            }
            
            # One-hot genders
            g_val = row["gender"]
            for g in gender_options:
                raw_vals[f"gender_{g}"] = 1.0 if g_val == g else 0.0
                
            # One-hot diets
            d_val = row["diet"]
            for d in diet_options:
                raw_vals[f"diet_{d}"] = 1.0 if d_val == d else 0.0
                
            # One-hot study times
            s_val = row["study_time"]
            for s in study_time_options:
                raw_vals[f"study_time_{s}"] = 1.0 if s_val == s else 0.0
                
            # Cyclical sleep time
            sleep_hour = parse_time_to_hour(row["sleeping_time"])
            sleep_rad = 2.0 * math.pi * sleep_hour / 24.0
            raw_vals["sleep_sin"] = math.sin(sleep_rad)
            raw_vals["sleep_cos"] = math.cos(sleep_rad)
            
            # Build encoded row applying feature weights
            encoded_row = {"name": name}
            for feat in features:
                w = weights.get(feat, 1.0)
                encoded_row[feat] = round(raw_vals[feat] * w, 4)
                
            encoded_rows.append(encoded_row)
            
    # Write to CSV
    output_headers = ["name"] + features
    with open(output_path, "w", newline="", encoding="utf-8") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=output_headers)
        writer.writeheader()
        writer.writerows(encoded_rows)
        
    print(f"Successfully encoded {len(encoded_rows)} records in '{output_path}'.")
    
    # Save Metadata JSON
    metadata = {
        "dataset_size": len(encoded_rows),
        "num_features": len(features),
        "feature_names": features,
        "feature_weights": {feat: weights.get(feat, 1.0) for feat in features},
        "feature_descriptions": {
            "study_hours_per_day": "MinMax scaled [1, 10] to [0.0, 1.0]",
            "cleanliness": "MinMax scaled [1, 5] to [0.0, 1.0] | Weighted x2.0 (dealbreaker)",
            "noise_tolerance": "MinMax scaled [1, 5] to [0.0, 1.0] | Weighted x1.5",
            "introvert_extrovert": "MinMax scaled [1, 5] to [0.0, 1.0]",
            "year": "Ordinal mapping: 1st=0.0, 2nd=0.3333, 3rd=0.6667, 4th=1.0",
            "guest_freq": "Ordinal mapping: never=0.0, sometimes=0.5, often=1.0",
            "gender_*": "One-hot encoded flags",
            "diet_*": "One-hot encoded flags | Weighted x1.3",
            "study_time_*": "One-hot encoded flags",
            "sleep_sin / sleep_cos": "Sine/Cosine cyclical encoding of sleeping_time | Weighted x1.8"
        }
    }
    
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)
        
    print(f"Saved encoding metadata in '{metadata_path}'.")
    
    # Validation preview
    print("\nEncoding Verification Preview (Record 1):")
    sample_raw = {}
    with open(input_path, "r", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        sample_raw = next(reader)
        
    sample_enc = encoded_rows[0]
    print(f"Raw: {sample_raw}")
    print("\nEncoded vector (Weights Applied):")
    for k, v in sample_enc.items():
        if k != "name":
            weight = weights.get(k, 1.0)
            print(f"  {k:<30}: {v:<8} (weight: {weight})")
            
if __name__ == "__main__":
    encode_dataset()
