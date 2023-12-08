// Fetches and appends options for add-course-window.
const populateOptions = () => {
    fetch(`${serverURI}/options`)
        .then(response => response.json())
        .then(data => {
            appendOptions('semesterSelect', data.SemList);
            appendOptions('collegeSelect', data.College, true);
            appendOptions('subjectSelect', data.Subject);
            appendOptions('MtgDaySelect', data.Mtgday);
            appendOptions('MtgTimeSelect', data.Mtgtime);
        })
        .catch(error => {
            console.error('Error fetching options:', error);
        });
}

// Appends options to a specified select element.
const appendOptions = (selectId, optionsObj, isArray = false) => {
    const selectElement = document.getElementById(selectId);
    selectElement.innerHTML = '';
  
    if(isArray) {
        optionsObj.forEach(option => {
            const optionElement = document.createElement('option');
            optionElement.textContent = option;
            selectElement.appendChild(optionElement);
      });
    } else {
        Object.entries(optionsObj).forEach(([text, value]) => {
            const optionElement = document.createElement('option');
            optionElement.textContent = text;
            optionElement.value = value;
            selectElement.appendChild(optionElement);
        });
    }
}

// Show the course search result and hide the schedule list
const showCourseResult = () => {
    let addCourse = document.getElementById('add-course-window');
    let courseResult = document.getElementById('course-result-window');
    let scheduleList = document.getElementById('schedule-list');
    let courseResultTable = document.getElementById('course-search-result');
    let continueBtn = document.getElementById('continueButton');
    let deleteBtn = document.getElementById('deleteButton');
    addCourse.style.display = 'none';
    courseResult.style.display = 'block';
    scheduleList.style.display = 'none';
    courseResultTable.style.display = 'block';
    continueBtn.style.display = 'inline-block';
    deleteBtn.style.display = 'none';
}

// Sends search query and record the last course data for continue search.
const handleSearch = (endpoint, data, clearTable = true) => {
    return fetch(`${serverURI}/${endpoint}`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        // console.log('Success:', data);
        renderCourseResult(data.course, clearTable);
        if (data.continueFrom) {
            document.getElementById('lastCol').value = data.continueFrom[0];
            document.getElementById('lastDept').value = data.continueFrom[1];
            document.getElementById('lastCrse').value = data.continueFrom[2];
            document.getElementById('lastSec').value = data.continueFrom[3];
            document.getElementById('lastSem').value = data.continueFrom[4];
            document.getElementById('crc').value = data.continueFrom[5];
        } else {
            document.getElementById('lastSem').value = "";
        }
    })
    .catch((error) => {
        console.error('Error:', error);
    });
}

// Renders course search results on the course-search-result table.
const renderCourseResult = (courseData, clearTable) => {
    let tbody = document.querySelector('#course-search-result tbody');
    if (clearTable) {
        tbody.innerHTML = "";
    }
    for(let course of courseData) {
        let row = tbody.insertRow();
        for(let cellContent of course) {
            row.insertCell().innerHTML = cellContent;
        }
    }
    showCourseResult();
    if (clearTable) {
        document.querySelector('#course-search-result').scrollTop = 0;
    }
    jumpToTable();
}

// Search by class number
const searchByClassNum = (event) => {
    event.preventDefault();
    let data = {
        "KeySem": document.getElementById("semesterSelect").value,
        "College": document.getElementById("collegeSelect").value,
        "Dept": document.getElementById("deptInput").value,
        "Course": document.getElementById("courseInput").value,
        "Section": document.getElementById("sectionInput").value,
        "MainCampusInd": document.getElementById("MainCampus-1").checked ? "Y" : "N"
    };
    // console.log(data);
    handleSearch('searchByClassNum', data);
}

// Search by class subject
const searchByClassSubject = (event) => {
    event.preventDefault();
    let data = {
        "KeySem": document.getElementById("semesterSelect").value,
        "Subject": document.getElementById("subjectSelect").value,
        "Mtgday": document.getElementById("MtgDaySelect").value,
        "Mtgtime": document.getElementById("MtgTimeSelect").value,
        "MainCampusInd": document.getElementById("MainCampus-2").checked ? "Y" : "N"
    };

    handleSearch('searchByClassSubject', data);
}

// Search for online courses
const searchByOnlineCourse = (event) => {
    event.preventDefault();
    let data = {
        "KeySem": document.getElementById("semesterSelect").value,
    };

    handleSearch('onlineCourse', data);
}

// // Continues showing course data
function continueSearch() {
    let data = {
        "KeySem": document.getElementById("lastSem").value,
        "College": document.getElementById("lastCol").value,
        "Dept": document.getElementById("lastDept").value,
        "Course": document.getElementById("lastCrse").value,
        "Section": document.getElementById("lastSec").value,
        "MainCampusInd": document.getElementById("crc").value
    };
    if (document.getElementById('lastSem').value != "") {
        handleSearch('searchByClassNum', data, false);
    }
}