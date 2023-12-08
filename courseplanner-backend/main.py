from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import pyotp
import qrcode
import base64
import json
from option import get_search_options
from course import prepare_class_num, prepare_class_subject, prepare_online, fetch_content, convert_to_course_list
from io import BytesIO

SEARCH_URL = "https://www.bu.edu/link/bin/uiscgi_studentlink.pl/1665176065?ModuleName=univschs.pl"
app = Flask(__name__)
CORS(app, origins=['http://localhost:3000'])


Data = {}


# Validate the One-Time Password for a specific username and returns the schedule data if successful.
@app.route('/validate', methods=['GET'])
def validate():
    username = request.args.get('username')
    otp = request.args.get('otp')
    user_data = Data.get(username)
    if not user_data:
        return {"result": "fail", "error": "User not found."}, 404

    secret = user_data['totp_secret']

    # Validate the OTP
    totp = pyotp.TOTP(secret)
    if totp.verify(otp):
        return {"result": "success", "schedule": user_data["schedule"]}, 200
    else:
        return {"result": "fail", "error": "Validation failed."}, 400


# Generate and send back a new TOTP secret and corresponding QR code for the new user
@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data['username']
    # Generate a TOTP secret for this user.
    totp_secret = pyotp.random_base32()
    # Generate an otpauth:// URI for this secret, which can be converted into a QR code.
    totp_uri = pyotp.totp.TOTP(totp_secret).provisioning_uri(name=username, issuer_name='CoursePlanner')
    # Save the image to a BytesIO object.
    buffered = BytesIO()
    img = qrcode.make(totp_uri)
    img.save(buffered)
    img_str = "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode()
    # Return the otpauth:// URI and totp_secret to the client.
    return jsonify({"result": "success", "qr_code": img_str, "totp_secret": totp_secret})


# Commit the username and TOTP secret to the Database.
@app.route('/commit', methods=['POST'])
def commit():
    data = request.get_json()
    username = data['username']
    totp_secret = data['totp_secret']

    # Check if the username exists in Data
    if username not in Data:
        Data[username] = {'totp_secret': totp_secret, 'schedule': []}
        return {"result": "success"}, 200
    else:
        return {"result": "fail", "error": "Username already exists"}, 400


# Fetch and return search options.
@app.route('/options', methods=['GET'])
def options():
    search_options = get_search_options(SEARCH_URL)
    response = Response(json.dumps(search_options, sort_keys=False), mimetype='application/json')
    return response


# Retrieve and return a list of courses based on the class number.
@app.route('/searchByClassNum', methods=['POST'])
def search_by_class_num():
    # Grab the posted data
    data = request.get_json()
    sem_code = data.get('KeySem')
    college = data.get('College')
    dept = data.get('Dept', "")
    course = data.get('Course', "")
    section = data.get('Section', "")
    CRC = data.get('MainCampusInd', "")

    headers, params = prepare_class_num(sem_code, college, dept, course, section, CRC)
    content = fetch_content(headers, params)
    course_list = convert_to_course_list(content, [sem_code, CRC])
    return jsonify(course_list)


# Retrieve and return a list of courses based on the class subject.
@app.route('/searchByClassSubject', methods=['POST'])
def search_by_class_subject():
    # Grab the posted data
    data = request.get_json()
    sem_code = data.get('KeySem')
    subject = data.get('Subject', "")
    mtgday = data.get('Mtgday', "")
    mtgtime = data.get('Mtgtime', "")
    CRC = data.get('MainCampusInd', "")

    headers, params = prepare_class_subject(sem_code, subject, mtgday, mtgtime, CRC)
    content = fetch_content(headers, params)
    course_list = convert_to_course_list(content, [sem_code, CRC])
    return jsonify(course_list)


# Retrieve and return a list of online courses.
@app.route('/onlineCourse', methods=['POST'])
def online_course():
    # Grab the posted data
    data = request.get_json()
    sem_code = data.get('KeySem')

    headers, params = prepare_online(sem_code)
    content = fetch_content(headers, params)
    course_list = convert_to_course_list(content, [sem_code, ""])
    return jsonify(course_list)


# Save a user's schedule to the Data storage.
@app.route('/saveSchedule', methods=['POST'])
def save_schedule():
    data = request.get_json()
    username = data['username']
    schedule = data['schedule']

    user_data = Data.get(username)
    if not user_data:
        return {"result": "fail", "error": "User not found."}, 404

    user_data['schedule'] = schedule

    return {"result": "success"}, 200


if __name__ == '__main__':
    app.run(port=5000)
