"""
RideWise Authentication & Database Module
Provides user auth, roles, and ride history storage
"""

import sqlite3
import hashlib
import secrets
from datetime import datetime, timedelta
from functools import wraps
from flask import request, jsonify, g

DATABASE = 'ridewise.db'

def get_db():
    """Get database connection"""
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    """Initialize database with tables"""
    db = get_db()
    cursor = db.cursor()
    
    # Users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            name TEXT NOT NULL,
            phone TEXT UNIQUE,
            role TEXT DEFAULT 'user',
            profile_photo TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_login DATETIME
        )
    ''')
    
    # Sessions table (for token management)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Zones removed - not using predefined zones anymore
    
    # Rides table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rides (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            user_name TEXT,
            user_email TEXT,
            pickup_location TEXT,
            drop_location TEXT,
            start_location TEXT NOT NULL DEFAULT 'Unknown',
            end_location TEXT NOT NULL DEFAULT 'Unknown',
            pickup_lat REAL,
            pickup_lon REAL,
            drop_lat REAL,
            drop_lon REAL,
            distance REAL,
            distance_km REAL,
            duration_mins INTEGER,
            fare REAL,
            passengers INTEGER DEFAULT 1,
            ride_date TEXT,
            ride_time TEXT,
            ride_type TEXT DEFAULT 'standard',
            status TEXT DEFAULT 'pending',
            driver_id INTEGER,
            driver_name TEXT,
            vehicle_number TEXT,
            rating INTEGER,
            feedback TEXT,
            city TEXT DEFAULT 'Pune',
            cancelled_at DATETIME,
            cancelled_reason TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (driver_id) REFERENCES driver_profiles (id)
        )
    ''')
    
    # Notifications table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'info',
            read INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Driver profiles table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS driver_profiles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            license_number TEXT UNIQUE NOT NULL,
            vehicle_number TEXT NOT NULL,
            vehicle_type TEXT NOT NULL,
            vehicle_model TEXT,
            vehicle_color TEXT,
            vehicle_photo TEXT,
            license_expiry DATE NOT NULL,
            insurance_number TEXT,
            insurance_expiry DATE,
            aadhar_number TEXT,
            pan_number TEXT,
            address TEXT,
            emergency_contact TEXT,
            emergency_phone TEXT,
            years_experience INTEGER DEFAULT 0,
            total_rides INTEGER DEFAULT 0,
            rating REAL DEFAULT 0.0,
            total_ratings INTEGER DEFAULT 0,
            status TEXT DEFAULT 'pending',
            verified INTEGER DEFAULT 0,
            available INTEGER DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Driver reviews table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS driver_reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            ride_id INTEGER,
            rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
            review_text TEXT,
            safety_rating INTEGER CHECK(safety_rating >= 1 AND safety_rating <= 5),
            punctuality_rating INTEGER CHECK(punctuality_rating >= 1 AND punctuality_rating <= 5),
            behavior_rating INTEGER CHECK(behavior_rating >= 1 AND behavior_rating <= 5),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (driver_id) REFERENCES driver_profiles (id),
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (ride_id) REFERENCES rides (id)
        )
    ''')
    
    # Create default admin if not exists
    cursor.execute("SELECT * FROM users WHERE email = 'admin@ridewise.com'")
    if not cursor.fetchone():
        admin_hash = hash_password('admin123')
        cursor.execute('''
            INSERT INTO users (email, password_hash, name, role) 
            VALUES (?, ?, ?, ?)
        ''', ('admin@ridewise.com', admin_hash, 'Admin', 'admin'))
    
    db.commit()
    db.close()
    print("[OK] Database initialized successfully!")

def hash_password(password):
    """Hash password with salt using SHA-256"""
    salt = "ridewise_salt_2024"  # In production, use unique salt per user
    return hashlib.sha256((password + salt).encode()).hexdigest()

def verify_password(password, password_hash):
    """Verify password against hash"""
    return hash_password(password) == password_hash

def generate_token():
    """Generate a secure random token"""
    return secrets.token_urlsafe(32)

def create_session(user_id):
    """Create a new session token for user"""
    db = get_db()
    cursor = db.cursor()
    
    token = generate_token()
    expires_at = datetime.now() + timedelta(days=7)  # Token valid for 7 days
    
    cursor.execute('''
        INSERT INTO sessions (user_id, token, expires_at)
        VALUES (?, ?, ?)
    ''', (user_id, token, expires_at))
    
    db.commit()
    db.close()
    return token

def validate_token(token):
    """Validate session token and return user"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        SELECT s.*, u.* FROM sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.token = ? AND s.expires_at > ?
    ''', (token, datetime.now()))
    
    result = cursor.fetchone()
    db.close()
    
    if result:
        return dict(result)
    return None

def delete_session(token):
    """Delete session (logout)"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('DELETE FROM sessions WHERE token = ?', (token,))
    db.commit()
    db.close()

# Decorator for protected routes
def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = validate_token(token)
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        
        if not token:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = validate_token(token)
        if not user:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        if user.get('role') != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        g.current_user = user
        return f(*args, **kwargs)
    return decorated_function

# User CRUD operations
def register_user(email, password, name, phone=None, role='user'):
    """Register a new user with validation"""
    db = get_db()
    cursor = db.cursor()
    
    try:
        # Check if email already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        if cursor.fetchone():
            db.close()
            return {'success': False, 'error': 'Email already registered'}
        
        # Check if phone already exists (if provided)
        if phone:
            cursor.execute('SELECT id FROM users WHERE phone = ?', (phone,))
            if cursor.fetchone():
                db.close()
                return {'success': False, 'error': 'Phone number already registered'}
        
        password_hash = hash_password(password)
        cursor.execute('''
            INSERT INTO users (email, password_hash, name, phone, role)
            VALUES (?, ?, ?, ?, ?)
        ''', (email, password_hash, name, phone, role))
        
        user_id = cursor.lastrowid
        db.commit()
        db.close()
        return {'success': True, 'user_id': user_id}
    except sqlite3.IntegrityError as e:
        db.close()
        return {'success': False, 'error': 'Registration failed. Email or phone already exists.'}

def login_user(email, password):
    """Login user and return token"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
    user = cursor.fetchone()
    
    if user and verify_password(password, user['password_hash']):
        # Update last login
        cursor.execute('UPDATE users SET last_login = ? WHERE id = ?', 
                      (datetime.now(), user['id']))
        db.commit()
        db.close()
        
        token = create_session(user['id'])
        return {
            'success': True,
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'name': user['name'],
                'role': user['role']
            }
        }
    
    db.close()
    return {'success': False, 'error': 'Invalid email or password'}

def get_user_by_id(user_id):
    """Get user by ID"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT id, email, name, phone, role, profile_photo, created_at FROM users WHERE id = ?', (user_id,))
    user = cursor.fetchone()
    db.close()
    return dict(user) if user else None

def get_all_users():
    """Get all users (admin only)"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT id, email, name, role, created_at, last_login FROM users')
    users = [dict(row) for row in cursor.fetchall()]
    db.close()
    return users

# Ride CRUD operations
def save_ride(user_id, start_location, end_location, distance_km=None, 
              duration_mins=None, fare=None, ride_type='standard', city='Pune',
              driver_name=None, vehicle_number=None):
    """Save a new ride"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        INSERT INTO rides (user_id, start_location, end_location, distance_km, 
                          duration_mins, fare, ride_type, city, driver_name, vehicle_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, start_location, end_location, distance_km, duration_mins, fare, ride_type, city, driver_name, vehicle_number))
    
    ride_id = cursor.lastrowid
    db.commit()
    db.close()
    
    # Create notification for new ride
    create_notification(user_id, "Ride Booked", f"Your ride from {start_location} to {end_location} is confirmed!", "success")
    
    return ride_id

def get_user_rides(user_id, limit=50):
    """Get rides for a user"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        SELECT * FROM rides WHERE user_id = ?
        ORDER BY ride_date DESC LIMIT ?
    ''', (user_id, limit))
    
    rides = [dict(row) for row in cursor.fetchall()]
    db.close()
    return rides

def get_user_stats(user_id):
    """Get user ride statistics"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        SELECT 
            COUNT(*) as total_rides,
            COALESCE(SUM(distance_km), 0) as total_distance,
            COALESCE(SUM(fare), 0) as total_spent,
            COALESCE(AVG(rating), 0) as avg_rating
        FROM rides WHERE user_id = ?
    ''', (user_id,))
    
    stats = dict(cursor.fetchone())
    db.close()
    return stats

def get_system_stats():
    """Get system-wide statistics (admin)"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('SELECT COUNT(*) as total_users FROM users')
    total_users = cursor.fetchone()['total_users']
    
    cursor.execute('SELECT COUNT(*) as total_rides FROM rides')
    total_rides = cursor.fetchone()['total_rides']
    
    cursor.execute('SELECT COALESCE(SUM(fare), 0) as total_revenue FROM rides')
    total_revenue = cursor.fetchone()['total_revenue']
    
    cursor.execute('''
        SELECT COUNT(*) as active_today FROM users 
        WHERE date(last_login) = date('now')
    ''')
    active_today = cursor.fetchone()['active_today']
    
    db.close()
    return {
        'total_users': total_users,
        'total_rides': total_rides,
        'total_revenue': round(total_revenue, 2),
        'active_today': active_today
    }

# Rating and Feedback
def rate_ride(ride_id, rating, feedback=None):
    """Rate a completed ride"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        UPDATE rides SET rating = ?, feedback = ?
        WHERE id = ?
    ''', (rating, feedback, ride_id))
    
    db.commit()
    db.close()
    return True

def cancel_ride(ride_id, reason=None):
    """Cancel a ride"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        UPDATE rides SET status = 'cancelled', cancelled_at = ?, cancelled_reason = ?
        WHERE id = ?
    ''', (datetime.now(), reason, ride_id))
    
    # Get user_id for notification
    cursor.execute('SELECT user_id FROM rides WHERE id = ?', (ride_id,))
    result = cursor.fetchone()
    
    db.commit()
    db.close()
    
    if result:
        create_notification(result['user_id'], "Ride Cancelled", 
                          f"Your ride has been cancelled. {reason if reason else ''}", "warning")
    
    return True

def update_ride_status(ride_id, status):
    """Update ride status"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('UPDATE rides SET status = ? WHERE id = ?', (status, ride_id))
    
    db.commit()
    db.close()
    return True

# Notifications
def create_notification(user_id, title, message, notification_type='info'):
    """Create a notification for user"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        INSERT INTO notifications (user_id, title, message, type)
        VALUES (?, ?, ?, ?)
    ''', (user_id, title, message, notification_type))
    
    db.commit()
    db.close()

def get_user_notifications(user_id, limit=20, unread_only=False):
    """Get notifications for a user"""
    db = get_db()
    cursor = db.cursor()
    
    if unread_only:
        cursor.execute('''
            SELECT * FROM notifications WHERE user_id = ? AND read = 0
            ORDER BY created_at DESC LIMIT ?
        ''', (user_id, limit))
    else:
        cursor.execute('''
            SELECT * FROM notifications WHERE user_id = ?
            ORDER BY created_at DESC LIMIT ?
        ''', (user_id, limit))
    
    notifications = [dict(row) for row in cursor.fetchall()]
    db.close()
    return notifications

def mark_notification_read(notification_id):
    """Mark notification as read"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('UPDATE notifications SET read = 1 WHERE id = ?', (notification_id,))
    db.commit()
    db.close()

def mark_all_notifications_read(user_id):
    """Mark all notifications as read for a user"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('UPDATE notifications SET read = 1 WHERE user_id = ?', (user_id,))
    db.commit()
    db.close()

# User Profile Management
def update_user_profile(user_id, name=None, phone=None, profile_photo=None):
    """Update user profile"""
    db = get_db()
    cursor = db.cursor()
    
    updates = []
    params = []
    
    if name:
        updates.append("name = ?")
        params.append(name)
    if phone:
        updates.append("phone = ?")
        params.append(phone)
    if profile_photo:
        updates.append("profile_photo = ?")
        params.append(profile_photo)
    
    if updates:
        params.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        cursor.execute(query, params)
        db.commit()
    
    db.close()
    return True

def get_rider_analytics(user_id):
    """Get detailed analytics for a rider"""
    db = get_db()
    cursor = db.cursor()
    
    # Frequent routes
    cursor.execute('''
        SELECT start_location, end_location, COUNT(*) as trip_count
        FROM rides WHERE user_id = ? AND status = 'completed'
        GROUP BY start_location, end_location
        ORDER BY trip_count DESC LIMIT 5
    ''', (user_id,))
    frequent_routes = [dict(row) for row in cursor.fetchall()]
    
    # Peak usage hours
    cursor.execute('''
        SELECT strftime('%H', ride_date) as hour, COUNT(*) as count
        FROM rides WHERE user_id = ? AND status = 'completed'
        GROUP BY hour ORDER BY count DESC LIMIT 5
    ''', (user_id,))
    peak_hours = [dict(row) for row in cursor.fetchall()]
    
    # City-wise distribution
    cursor.execute('''
        SELECT city, COUNT(*) as ride_count, COALESCE(SUM(fare), 0) as total_spent
        FROM rides WHERE user_id = ? AND status = 'completed'
        GROUP BY city
    ''', (user_id,))
    city_stats = [dict(row) for row in cursor.fetchall()]
    
    db.close()
    return {
        'frequent_routes': frequent_routes,
        'peak_hours': peak_hours,
        'city_stats': city_stats
    }

def get_all_zones(city=None):
    """Get all active zones, optionally filtered by city"""
    db = get_db()
    cursor = db.cursor()
    if city:
        cursor.execute('SELECT * FROM zones WHERE is_active = 1 AND city = ? ORDER BY name', (city,))
    else:
        cursor.execute('SELECT * FROM zones WHERE is_active = 1 ORDER BY city, name')
    zones = [dict(row) for row in cursor.fetchall()]
    db.close()
    return zones

def get_all_cities():
    """Get list of all cities with zones"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT DISTINCT city FROM zones WHERE is_active = 1 ORDER BY city')
    cities = [row[0] for row in cursor.fetchall()]
    db.close()
    return cities

def get_zone_by_id(zone_id):
    """Get zone by ID"""
    db = get_db()
    cursor = db.cursor()
    cursor.execute('SELECT * FROM zones WHERE id = ?', (zone_id,))
    row = cursor.fetchone()
    db.close()
    return dict(row) if row else None

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two coordinates using Haversine formula (in km)"""
    from math import radians, sin, cos, sqrt, atan2
    
    R = 6371  # Earth's radius in km
    
    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c
    
    return round(distance, 2)

def calculate_ride_price(pickup_zone_id, drop_zone_id, predicted_demand):
    """Calculate ride price based on distance and ML predicted demand"""
    pickup_zone = get_zone_by_id(pickup_zone_id)
    drop_zone = get_zone_by_id(drop_zone_id)
    
    if not pickup_zone or not drop_zone:
        return None
    
    # Calculate distance
    distance = calculate_distance(
        pickup_zone['latitude'], pickup_zone['longitude'],
        drop_zone['latitude'], drop_zone['longitude']
    )
    
    # Base price calculation: base_rate per km
    avg_base_rate = (pickup_zone['base_rate'] + drop_zone['base_rate']) / 2
    base_price = avg_base_rate * distance
    
    # Minimum fare
    if base_price < 30:
        base_price = 30
    
    # Apply surge based on ML predicted demand
    if predicted_demand > 200:
        surge_multiplier = 1.5
        surge_percent = 50
    elif predicted_demand > 150:
        surge_multiplier = 1.3
        surge_percent = 30
    elif predicted_demand > 100:
        surge_multiplier = 1.15
        surge_percent = 15
    else:
        surge_multiplier = 1.0
        surge_percent = 0
    
    final_price = base_price * surge_multiplier
    
    # Estimate time (assuming avg speed 25 km/h in Pune traffic)
    estimated_time = int((distance / 25) * 60)  # in minutes
    
    return {
        'distance': distance,
        'base_price': round(base_price, 2),
        'surge_multiplier': surge_multiplier,
        'surge_percent': surge_percent,
        'final_price': round(final_price, 2),
        'estimated_time': max(estimated_time, 10),  # minimum 10 min
        'pickup_zone': pickup_zone['name'],
        'drop_zone': drop_zone['name']
    }

def book_ride(user_id, pickup_zone_id, drop_zone_id, price_details):
    """Book a new ride with calculated price"""
    db = get_db()
    cursor = db.cursor()
    
    cursor.execute('''
        INSERT INTO rides (
            user_id, start_location, end_location, distance, 
            fare, status, ride_date, city
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        user_id,
        price_details['pickup_zone'],
        price_details['drop_zone'],
        price_details['distance'],
        price_details['final_price'],
        'booked',
        datetime.now().isoformat(),
        'Pune'
    ))
    
    ride_id = cursor.lastrowid
    db.commit()
    db.close()
    
    # Create notification
    create_notification(
        user_id,
        'Ride Booked Successfully',
        f"Your ride from {price_details['pickup_zone']} to {price_details['drop_zone']} has been booked. Estimated fare: ₹{price_details['final_price']} ({price_details['distance']} km, ~{price_details['estimated_time']} min)",
        'success'
    )
    
    return ride_id

# Initialize database on import
init_db()
