from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_mysqldb import MySQL
from flask_cors import CORS  # Import Flask-CORS
import MySQLdb.cursors
import re
from werkzeug.security import generate_password_hash, check_password_hash
from urllib.parse import quote
import datetime

app = Flask(__name__)

# Enable CORS for all routes
CORS(app)  # Add this line to enable CORS

# Database and secret key configurations
app.config['SECRET_KEY'] = 'your_secret_key_here'
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'root'
app.config['MYSQL_PASSWORD'] = ''
app.config['MYSQL_DB'] = 'linkedin_commenter_draft'

mysql = MySQL(app)

@app.route('/')
def home():
    if 'email' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        full_name = request.form['full_name']
        email = request.form['email']
        password = request.form['password']

        if not re.match(r'[A-Za-z0-9]+', full_name) or not re.match(r'[^@]+@[^@]+\.[^@]+', email):
            flash('Invalid input!', 'danger')
            return redirect(url_for('register'))

        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM user WHERE email = %s', (email,))
        if cursor.fetchone():
            flash('Account already exists!', 'danger')
            return redirect(url_for('register'))

        hashed_password = generate_password_hash(password, method='scrypt')
        cursor.execute('INSERT INTO user (full_name, email, password) VALUES (%s, %s, %s)', (full_name, email, hashed_password))
        mysql.connection.commit()
        flash('Registered successfully! Please login.', 'success')
        return redirect(url_for('login'))
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
        cursor.execute('SELECT * FROM user WHERE email = %s', (email,))
        account = cursor.fetchone()

        if account and check_password_hash(account['password'], password):
            session['email'] = email
            session['full_name'] = account['full_name']
            session['user_id'] = account['Id']  # Store user ID in session
            extension_id = request.args.get('ext_id', 'default_extension_id')
            full_name_encoded = quote(account['full_name'])
            user_id = account['Id']  # Retrieve user_id from the database
            # Pass both user_id and full_name in the redirect URL
            # Fetch today's request_count from daily_usage for this user
            today = datetime.date.today()
            cursor.execute('SELECT request_count FROM daily_usage WHERE user_id = %s AND date = %s', (user_id, today))
            usage = cursor.fetchone()

            request_count = usage['request_count'] if usage else 0  # Default to 0 if no usage record exists for today

            # Pass both user_id, full_name, and request_count in the redirect URL
            return redirect(f'http://{extension_id}.chromiumapp.org/?name={full_name_encoded}&user_id={user_id}&request_count={request_count}')
        else:
            flash('Invalid login attempt.', 'danger')
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'full_name' in session:
        return f"Hi {session['full_name']}"
    return redirect(url_for('login'))

@app.route('/logout')
def logout():
    session.pop('email', None)
    session.pop('full_name', None)
    session.pop('user_id', None)  # Clear user ID from session
    return redirect(url_for('login'))

# This route checks and updates daily usage limits for each user
@app.route('/check_usage', methods=['POST'])
def check_usage():
    data = request.json
    user_id = data['user_id']  # Get the user_id from the request

    if not user_id:
        return jsonify({"error": "User ID is missing"}), 400

    today = datetime.date.today()

    # Check usage for today
    cursor = mysql.connection.cursor(MySQLdb.cursors.DictCursor)
    cursor.execute('SELECT * FROM daily_usage WHERE user_id = %s AND date = %s', (user_id, today))
    usage = cursor.fetchone()

    if usage:
        # remaining_requests = 10 - usage['request_count']  # Calculate remaining requests #changed
        # If the user has reached the limit, return an error response
        if usage['request_count'] >= 10:  # Assuming 10 is the daily limit
            return jsonify({"error": "Daily limit reached"}), 429
            # return jsonify({"error": "Daily limit reached", "request_count": usage['request_count'], "remaining_requests": 0}), 429
        # Otherwise, increment the request count
        cursor.execute('UPDATE daily_usage SET request_count = request_count + 1 WHERE user_id = %s AND date = %s', (user_id, today))
    else:
        # If no entry exists for today, create a new record
        cursor.execute('INSERT INTO daily_usage (user_id, date, request_count) VALUES (%s, %s, 1)', (user_id, today))

    mysql.connection.commit()
    return jsonify({"message": "Usage updated"}), 200


if __name__ == '__main__':
    app.run(debug=True)
