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
        
        hour = hour % 12
        if period == "PM":
            hour += 12
            
        return hour + (minute / 60.0)
    except Exception as e:
        print(f"Error parsing time '{time_str}': {e}")
        return 0.0

def dot_product(v1, v2):
    return sum(x * y for x, y in zip(v1, v2))

def norm(v):
    return math.sqrt(sum(x * x for x in v))

def cosine_distance(v1, v2):
    n1 = norm(v1)
    n2 = norm(v2)
    if n1 == 0.0 or n2 == 0.0:
        return 1.0  # Max distance if a vector is zero
    return 1.0 - (dot_product(v1, v2) / (n1 * n2))

class RoommateMatcher:
    def __init__(self):
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.encoded_path = os.path.join(self.base_dir, "roommate_encoded.csv")
        self.raw_path = os.path.join(self.base_dir, "roommate_data.csv")
        self.metadata_path = os.path.join(self.base_dir, "encoding_metadata.json")
        
        self.features = []
        self.weights = {}
        self.names = []
        self.vectors = []
        self.raw_profiles = {}
        
        self._load_metadata()
        self._load_datasets()

    def _load_metadata(self):
        if not os.path.exists(self.metadata_path):
            raise FileNotFoundError(f"Metadata file not found: {self.metadata_path}. Run encode_data.py first.")
        
        with open(self.metadata_path, "r", encoding="utf-8") as f:
            meta = json.load(f)
        self.features = meta["feature_names"]
        self.weights = meta["feature_weights"]

    def _load_datasets(self):
        # 1. Load raw profiles for validation/display
        if not os.path.exists(self.raw_path):
            raise FileNotFoundError(f"Raw data file not found: {self.raw_path}. Run generate_data.py first.")
            
        with open(self.raw_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.raw_profiles[row["name"].strip()] = row

        # 2. Load encoded matrices
        if not os.path.exists(self.encoded_path):
            raise FileNotFoundError(f"Encoded data file not found: {self.encoded_path}. Run encode_data.py first.")
            
        with open(self.encoded_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                self.names.append(row["name"].strip())
                vec = [float(row[feat]) for feat in self.features]
                self.vectors.append(vec)

    def encode_profile(self, raw_profile):
        """
        Encodes a raw profile dictionary into a weighted 19-dimensional vector,
        matching the logic used in encode_data.py.
        """
        # Mappings
        year_map = {"1st year": 0.0, "2nd year": 1/3, "3rd year": 2/3, "4th year": 1.0}
        guest_map = {"never": 0.0, "sometimes": 0.5, "often": 1.0}
        
        gender_options = ["Female", "Male", "Non-binary"]
        diet_options = ["eggetarian", "no_pref", "nonveg", "veg", "vegan"]
        study_time_options = ["afternoon", "morning", "night"]
        
        # Normalize numeric variables
        study_hours = (float(raw_profile["study_hours_per_day"]) - 1.0) / 9.0
        cleanliness = (float(raw_profile["cleanliness"]) - 1.0) / 4.0
        noise_tolerance = (float(raw_profile["noise_tolerance"]) - 1.0) / 4.0
        introvert_extrovert = (float(raw_profile["introvert_extrovert"]) - 1.0) / 4.0
        year = year_map.get(raw_profile["year"], 0.0)
        guest_freq = guest_map.get(raw_profile["guest_freq"], 0.0)
        
        raw_vals = {
            "study_hours_per_day": study_hours,
            "cleanliness": cleanliness,
            "noise_tolerance": noise_tolerance,
            "introvert_extrovert": introvert_extrovert,
            "year": year,
            "guest_freq": guest_freq
        }
        
        # One-hot categorical mappings
        g_val = raw_profile["gender"]
        for g in gender_options:
            raw_vals[f"gender_{g}"] = 1.0 if g_val == g else 0.0
            
        d_val = raw_profile["diet"]
        for d in diet_options:
            raw_vals[f"diet_{d}"] = 1.0 if d_val == d else 0.0
            
        s_val = raw_profile["study_time"]
        for s in study_time_options:
            raw_vals[f"study_time_{s}"] = 1.0 if s_val == s else 0.0
            
        # Cyclical sleep time
        sleep_hour = parse_time_to_hour(raw_profile["sleeping_time"])
        sleep_rad = 2.0 * math.pi * sleep_hour / 24.0
        raw_vals["sleep_sin"] = math.sin(sleep_rad)
        raw_vals["sleep_cos"] = math.cos(sleep_rad)
        
        # Build query vector applying feature weights
        query_vec = []
        for feat in self.features:
            weight = self.weights.get(feat, 1.0)
            val = raw_vals[feat] * weight
            query_vec.append(val)
            
        return query_vec

    def find_matches(self, query_input, k=5):
        """
        Finds the top k roommate matches.
        query_input can be:
          - A string (representing the name of a student in the database)
          - A dictionary (a custom raw student profile)
        """
        is_existing_student = False
        query_name = "New Custom Profile"
        
        if isinstance(query_input, str):
            query_input = query_input.strip()
            if query_input not in self.raw_profiles:
                raise KeyError(f"Student '{query_input}' not found in database.")
            raw_profile = self.raw_profiles[query_input]
            query_name = query_input
            is_existing_student = True
        else:
            raw_profile = query_input
            
        # Encode the query row
        query_vec = self.encode_profile(raw_profile)
        
        # Calculate distances to all vectors
        scored_matches = []
        query_gender = raw_profile.get("gender")
        for name, db_vec in zip(self.names, self.vectors):
            if is_existing_student and name == query_name:
                continue
                
            # Strict gender matching constraint: boys and girls are placed in separate hostels/rooms
            db_profile = self.raw_profiles[name]
            if db_profile.get("gender") != query_gender:
                continue
                
            dist = cosine_distance(query_vec, db_vec)
            scored_matches.append((dist, name))
            
        # Sort by distance ascending
        scored_matches.sort(key=lambda x: x[0])
        
        matched_profiles = []
        matched_distances = []
        
        for dist, name in scored_matches[:k]:
            matched_profiles.append(self.raw_profiles[name])
            matched_distances.append(dist)
                
        return raw_profile, query_name, matched_profiles, matched_distances

    def print_comparison_dashboard(self, raw_query, query_name, matches, distances):
        """
        Displays a beautiful side-by-side terminal comparison dashboard between the query and matches.
        """
        print("\n" + "="*95)
        print(f" ROOMMATE COMPATIBILITY DASHBOARD FOR: {query_name.upper()} ")
        print("="*95)
        
        # Define display names and attributes to print
        attrs = [
            ("academic_year", "year"),
            ("gender", "gender"),
            ("diet", "diet"),
            ("cleanliness", "cleanliness"),
            ("noise_tolerance", "noise_tolerance"),
            ("introvert_extrovert", "introvert_extrovert"),
            ("sleep_time", "sleeping_time"),
            ("guest_frequency", "guest_freq"),
            ("study_hours", "study_hours_per_day"),
            ("preferred_study", "study_time"),
            ("course", "course")  # Included for visual display context only!
        ]
        
        # Build headers
        header_line = f" {'Attribute':<18} | {'Query Profile':<18} |"
        for i, (match, dist) in enumerate(zip(matches, distances)):
            # Convert cosine distance to compatibility similarity score
            compatibility = max(0.0, 1.0 - dist) * 100.0
            short_name = match["name"].split()[0] + " " + match["name"].split()[-1][0] + "." # E.g. Abhishek S.
            header_line += f" Rank {i+1}: {short_name:<11} ({compatibility:4.1f}%) |"
            
        print(header_line)
        print("-"*95)
        
        # Print attributes side by side
        for label, key in attrs:
            line = f" {label:<18} | {raw_query[key]:<18} |"
            for match in matches:
                val = match[key]
                line += f" {val:<19} |"
            print(line)
            
        print("="*95 + "\n")

if __name__ == "__main__":
    matcher = RoommateMatcher()
    
    # 1. Test by querying an existing roommate
    test_name = matcher.names[0] # Usually 'Naman Chaudhary'
    print(f"Querying for matches for existing student: '{test_name}'...")
    raw_q, q_name, matches, dists = matcher.find_matches(test_name, k=3)
    matcher.print_comparison_dashboard(raw_q, q_name, matches, dists)
    
    # 2. Test by querying a custom profile
    custom_profile = {
        "gender": "Male",
        "year": "2nd year",
        "course": "Computer Science",
        "sleeping_time": "12:00 AM",
        "study_hours_per_day": "4",
        "diet": "veg",
        "cleanliness": "4",
        "noise_tolerance": "2",
        "guest_freq": "sometimes",
        "introvert_extrovert": "2",
        "study_time": "night"
    }
    print("Querying for matches for a CUSTOM profile...")
    raw_q, q_name, matches, dists = matcher.find_matches(custom_profile, k=3)
    matcher.print_comparison_dashboard(raw_q, q_name, matches, dists)
