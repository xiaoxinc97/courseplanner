// Reload the schedule
const reloadSchedule = function() {
	const existingSVG = document.getElementById('schedule');
	if (existingSVG) {
		while (existingSVG.firstChild) {
		existingSVG.removeChild(existingSVG.firstChild);
		}
	}
	loadSchedule();
};

// Show the add course window and hide the course result window
const backToAddCourse = function() {
	let addCourse = document.getElementById('add-course-window');
	let courseResult = document.getElementById('course-result-window');
	addCourse.style.display = 'block';
	courseResult.style.display = 'none';
};

// Show the schedule list and hide the course search result
function showScheduleList() {
	let addCourse = document.getElementById('add-course-window');
	let courseResult = document.getElementById('course-result-window');
	let scheduleList = document.getElementById('schedule-list');
	let courseResultTable = document.getElementById('course-search-result');
	let continueBtn = document.getElementById('continueButton');
	let deleteBtn = document.getElementById('deleteButton');
	addCourse.style.display = 'none';
	courseResult.style.display = 'block';
	scheduleList.style.display = 'block';
	courseResultTable.style.display = 'none';
	continueBtn.style.display = 'none';
	deleteBtn.style.display = 'inline-block';
}

// clear all the rows in the schedule-list table
const clearScheduleList = function() {
	let tableBody = document.querySelector('#schedule-list tbody');
	tableBody.innerHTML = '';
	setUnit();
	reloadSchedule();
};

// Reset the login form
const resetLoginForm = function() {
  	document.getElementById("loginForm").reset();
};

// Reset the register form
function resetRegisterForm() {
	document.getElementById("registerForm").reset();
	let qrCodeContainer = document.getElementById('qrCodeContainer');
	qrCodeContainer.innerHTML = "";
}

// Validate OTP and update UI
const validateOTP = async (usernameId, otpId) => {
	const username = document.getElementById(usernameId).value;
	const otp = document.getElementById(otpId).value;

	try {
		const response = await fetch(`${serverURI}/validate?username=${username}&otp=${otp}`);
		const data = await response.json();
		if (data.result == 'success') {
		let userText = document.getElementById('userText');
		userText.textContent = username;
		userText.style.display = 'inline-block';
		
		loadCoursesToTable(data.schedule);
		reloadSchedule();
		} else {
		window.alert(data.error);
		}
	} catch (error) {
		console.error('Error in validate function:', error);
	}
}

// Generate QR code for registration
const generateQRcode = () => {
  	const username = document.getElementById('registerUsername').value;

	if (!username) {
		window.alert('Username must not be empty');
		return;
	}
  
	fetch(`${serverURI}/register`, {
		method: 'POST',
		headers: {
		'Content-Type': 'application/json'
		},
		body: JSON.stringify({'username': username})
	})
	.then(response => response.json())
	.then(data => {
		const otpAuthUri = data.qr_code;
		document.getElementById('registerTotpSecret').value = data.totp_secret;
		let qrCodeContainer = document.getElementById('qrCodeContainer');
		qrCodeContainer.innerHTML = `<img src="${otpAuthUri}"  class="form-control"/>`;
	})
	.catch(error => console.error('Error:', error));
	}

// Confirm registration
const confirmRegistration = async (usernameId, totpSecretId) => {
	const username = document.getElementById(usernameId).value;
	const totpSecret = document.getElementById(totpSecretId).value;

	if (!username || !totpSecret) {
		window.alert('Username and OTP must not be empty');
		return;
	}

	try {
		const response = await fetch(`${serverURI}/commit`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			username: username,
			totp_secret: totpSecret
		})
		});
		const data = await response.json();
		if (data.result == 'success') {
		window.alert('Successfully registered!');
		}
		else {
		window.alert(data.error);
		}

	} catch (error) {
		console.error('Error in commit function:', error);
	}
}

// Logout and reset schedule
const logout = () => {
	let userText = document.getElementById('userText');
	if (userText.textContent !== '') {
		userText.textContent = '';
		userText.style.display = 'none';
		let tbody = document.querySelector('#schedule-list tbody');
		tbody.innerHTML = '';
		reloadSchedule();
	}
}

// Extract course data from schedule-list table.
const getAllCourses = () => {
	let scheduleTable = document.getElementById('schedule-list');
	let rows = Array.from(scheduleTable.querySelectorAll('tbody tr'));
	let courses = [];
	
	for (let row of rows) {
		let cells = Array.from(row.querySelectorAll('td'));
		let course = {
			Class: cells[0].innerHTML,
			Title: cells[1].innerHTML,
			CrHrs: cells[2].innerHTML,
			Type: cells[3].innerHTML,
			OpenSeats: cells[4].innerHTML,
			Bld: cells[5].innerHTML,
			Room: cells[6].innerHTML,
			Day: cells[7].innerHTML,
			Start: cells[8].innerHTML,
			Stop: cells[9].innerHTML,
			Notes: cells[10] ? cells[10].innerHTML : ""
		};
		courses.push(course);
	}

	return courses;
}

// Populate schedule-list table with courses
const loadCoursesToTable = (courses) => {
	let keys = ['Class', 'Title', 'CrHrs', 'Type', 'OpenSeats', 'Bld', 'Room', 'Day', 'Start', 'Stop', 'Notes'];
	let tbody = document.querySelector('#schedule-list tbody');
	// empty the current content of the tbody
	tbody.innerHTML = '';
	
	for (let course of courses) {
		let row = document.createElement('tr');
		for (let key of keys) {
			let cell = document.createElement('td');
			cell.innerHTML = course[key];
			row.appendChild(cell);
		}
		tbody.appendChild(row);
	}
}

// Save current schedule to server
async function saveSchedule() {
	const username = document.getElementById('userText').textContent;
	if (username == '') {
		window.alert("Please login to save the schedule.")
		return;
	}
	const scheduleData = {
		username: username,
		schedule: getAllCourses()
	};

	try {
		const response = await fetch(`${serverURI}/saveSchedule`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(scheduleData)
		});

		if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
		}

		const data = await response.json();
		if (data.result == 'success') {
		window.alert('Successfully save your schedule!');
		}
		else {
		window.alert(data.error);
		}
	} catch (error) {
		console.error('Error:', error);
	}
}

// Smoothly scrolls the view to schedule-chart
function jumpToChart() {
    let element = document.getElementById("schedule");
    element.scrollIntoView({behavior: "smooth"});
}

// Smoothly scrolls the view to course-search-result
function jumpToTable() {
    let element = document.getElementById("course-search-result");
    element.scrollIntoView({behavior: "smooth"});
}