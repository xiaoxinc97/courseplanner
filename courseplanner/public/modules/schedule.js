// Convert time to minutes
const timeToMinutes = function(time) {
    const [hour, minute] = time.split(':').map(Number);
    return hour * 60 + minute;
}

// Format minutes as "hh:mm" time string
const timeFormatter = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

// Convert the 12-hour time format to 24-hour
const convertTo24Hour = function(time) {
    let [hours, minutes] = time.split(':');
    let modifier = minutes.slice(-2);
    minutes = minutes.slice(0, -2);

    if (modifier.toLowerCase() === 'pm' && hours !== '12') {
        hours = parseInt(hours, 10) + 12;
    }
    if (modifier.toLowerCase() === 'am' && hours === '12') {
        hours = '00';
    }
    return `${hours}:${minutes}`;
}

// Extract course time from one course
function extractCourseTime(courseRow) {
    // Map to convert day abbreviations to full names
    let dayMap = {'M': 'Mon', 'Tu': 'Tue', 'W': 'Wed', 'Th': 'Thu', 'F': 'Fri'};
    let times = [];
    let cells = courseRow.cells;
    let classTitle = cells[0] ? cells[0].innerText.trim() : "";
    
    let daysStrings = cells[7] ? cells[7].innerHTML.replace("Arranged", "").trim().split('<br>') : [""];
    let startTimesStrings = cells[8] ? cells[8].innerHTML.trim().split('<br>') : [""];
    let stopTimesStrings = cells[9] ? cells[9].innerHTML.trim().split('<br>') : [""];

    for (let i = 0; i < daysStrings.length; i++) {
        let days = daysStrings[i].split(',');
        let startTimes = startTimesStrings[i] !== undefined ? startTimesStrings[i].trim().split(' ') : [""];
        let stopTimes = stopTimesStrings[i] !== undefined ? stopTimesStrings[i].trim().split(' ') : [""];
        
        for (let j = 0; j < days.length; j++) {
            let day = dayMap[days[j].trim()] || days[j].trim();
            let startTime = startTimes[0].trim();
            let stopTime = stopTimes[0].trim();

            if(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(day)) {
                times.push([classTitle, day, startTime, stopTime]);
            }
        }
    }
    return times;
}

// Extract courses from schedule-list table for schedule chart
// [classTitle, day, starttime, stoptime]
function extractCourses() {
    let rows = document.querySelectorAll('#schedule-list tbody tr');
    let courses = [];

    for(let i = 0; i < rows.length; i++) {
        let courseTime = extractCourseTime(rows[i]);
        courses = courses.concat(courseTime);
    }
    return courses;
}

// Validate new course addition by checking for duplicate names
function checkDuplicateCourse(courseRow) {
    let newCourseName = courseRow.querySelector("td:first-child").textContent.trim();
    let rows = document.querySelectorAll('#schedule-list tbody tr');
    let courseNames = [];
    for (let i = 0; i < rows.length; i++) {
        let courseName = rows[i].querySelector("td:first-child").textContent;
        courseNames.push(courseName);
    }
    if (courseNames.includes(newCourseName)) {
        return {
            'valid': false,
            'error': `Unable to add ${newCourseName}. A course with the same name already exists in the schedule.`
        };
    }
    return { 'valid': true };
}

// Validate new course addition by checking for time conflicts
function checkTimeConflict(newCourseTimes, allCoursesTimes) {
    for (let newTime of newCourseTimes) {
        let [newClassTitle, newDay, newStartTime, newStopTime] = newTime;
        let newStartMinutes = timeToMinutes(convertTo24Hour(newStartTime));
        let newStopMinutes = timeToMinutes(convertTo24Hour(newStopTime));
        
        for (let courseTime of allCoursesTimes) {
            let [classTitle, day, startTime, stopTime] = courseTime;
            let startMinutes = timeToMinutes(convertTo24Hour(startTime));
            let stopMinutes = timeToMinutes(convertTo24Hour(stopTime));

            if (newDay === day) {
                if ((newStartMinutes >= startMinutes && newStartMinutes < stopMinutes) || 
                    (newStopMinutes > startMinutes && newStopMinutes <= stopMinutes) ||
                    (newStartMinutes <= startMinutes && newStopMinutes >= stopMinutes)) {
                        return {
                            'valid': false, 
                            'error': `Unable to add ${newClassTitle}. There is a scheduling conflict with ${classTitle} on ${day}.`
                        };
                }
            }
        }
    }
    return { 'valid': true };
}

// Set total course unit
const setUnit = () => {
    let rows = document.querySelectorAll('#schedule-list tbody tr');
    let unitText = document.getElementById('unitText');
    let units = 0;
    for(let i = 0; i < rows.length; i++) {
        let cells = rows[i].cells;
        if (cells[2] && !isNaN(cells[2].innerText)) {
            let unit = Number(cells[2].innerText);
            units += unit;
        }
    }
    unitText.innerText = `Unit: ${units}`;
}

// Loads the course schedule to the schedule chart based on the schedule-list table.
function loadSchedule() {
    // Data for the y-axis intervals (30-minute intervals from 7:00am to 10:00pm)
    const timeIntervals = [];
    for (let hour = 7; hour <= 22; hour++) {
        for (let minute = 0; minute <= 55; minute += 5) {
            timeIntervals.push(`${String(hour)
                .padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
        }
    }
    
    const scheduleContainer = document.getElementById('schedule-container');
    const containerWidth = scheduleContainer.clientWidth;
    let containerHeight = scheduleContainer.clientHeight;
    const margin = { top: 30, right: 60, bottom: 0, left: 60 };
    const width = containerWidth - margin.left - margin.right;
    const height = containerHeight - margin.top - margin.bottom;

    // Create x and y scales
    const xScale = d3.scaleBand()
        .domain(['Mon', 'Tue', 'Wed', 'Thu', 'Fri'])
        .range([0, width]);

    const yScale = d3
        .scaleBand()
        .domain(timeIntervals.map(timeToMinutes))
        .range([0, height])
        .padding(1);
    // Create the SVG element
    const svg = d3.select('#schedule')
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    // Create horizontal grid lines
    svg.selectAll('.grid-line')
        .data(timeIntervals.filter((_, i) => i % 6 === 0))
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', d => yScale(timeToMinutes(d)) + yScale.bandwidth()/2)
        .attr('y2', d => yScale(timeToMinutes(d)) + yScale.bandwidth()/2);
    // Create vertical grid lines between each two weekday columns
    svg.selectAll('.weekday-separator')
        .data(['Mon', 'Tue', 'Wed', 'Thu'])
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', d => xScale(d) + xScale.bandwidth())
        .attr('x2', d => xScale(d) + xScale.bandwidth())
        .attr('y1', 0)
        .attr('y2', height);
    // Create the bars
    svg.selectAll('.bar')
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => xScale(d.day))
        .attr('y', d => yScale(timeToMinutes(d.value))) 
        .attr('width', xScale.bandwidth())
        .attr('height', d => height - yScale(timeToMinutes(d.value)));
    // Create x-axis (at the top) and hide the ticks
    svg.append('g')
        .attr('class', 'x-axis')
        .call(d3.axisTop(xScale).tickSize(0));
    // Create y-axis (at the left) and customize tick format
    svg.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(yScale)
        .tickValues(d3.range(420, 1380, 60))
        .tickFormat(d => timeFormatter(d)).tickSize(0));
    // Create the solid right line
    svg.append('line')
        .attr('class', 'grid-line y-axis-line')
        .attr('x1', width)
        .attr('x2', width)
        .attr('y1', 0)
        .attr('y2', height);
    // Create the solid bottom line
    svg.append('line')
        .attr('class', 'grid-line x-axis-line')
        .attr('x1', 0)
        .attr('x2', width)
        .attr('y1', height)
        .attr('y2', height);

    // add courses to the chart
    let courses = extractCourses();
    for (let course of courses) {
        addCourse(svg, xScale, yScale, course[0], course[1], 
            convertTo24Hour(course[2]), convertTo24Hour(course[3]));
    }
    setUnit();
}

// Adds a course to the schedule chart
function addCourse(svg, xScale, yScale, text, day, startTime, endTime) {
    // Calculate the position and height for the course bar
    const startTimeMinutes = timeToMinutes(startTime);
    const endTimeMinutes = timeToMinutes(endTime);
    const courseHeight = yScale(endTimeMinutes) - yScale(startTimeMinutes);
    const courseWidth = xScale.bandwidth() - 10;
    let Colors = [
        "#FFFFE0", // Light Yellow
        "#ADD8E6", // Light Blue
        "#F08080", // Light Coral
        "#E0FFFF", // Light Cyan
        "#FAFAD2", // Light Golden Rod Yellow
        "#D3D3D3", // Light Gray
        "#90EE90", // Light Green
        "#FFB6C1", // Light Pink
        "#FFA07A", // Light Salmon
        "#87CEFA"  // Light Sky Blue
    ];

    function hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash += str.charCodeAt(i) * (i+1);
        }
        return hash % Colors.length;
    }

    // Add the course bar
    svg.append('rect')
        .attr('class', 'bar')
        .attr('x', xScale(day) + 5)
        .attr('y', yScale(startTimeMinutes))
        .attr('width', courseWidth)
        .attr('height', courseHeight)
        .style('fill', Colors[hashString(text)]);

    // Add the course label
    let courseLabel = svg.append('text')
        .attr('x', xScale(day) + xScale.bandwidth() / 2)
        .attr('y', (startTimeMinutes < endTimeMinutes 
            ? yScale(startTimeMinutes) : yScale(endTimeMinutes)) + courseHeight / 2)
        .attr('class', 'course-label');

    // Split the text and add each word as a separate 'tspan'
    let words = text.split(' ');
    let lineHeight = 1.6; // ems
    for (let i = 0; i < words.length; i++) {
        courseLabel.append('tspan')
            .attr('x', courseLabel.attr('x'))
            .attr('dy', `${(i > 0 ? lineHeight : 0)}em`)
            .text(words[i]);
    }
}

// Handles the course addition when a course is selected
const handleCourseSelection = function(event) {
    let targetTable = document.querySelector("#schedule-list tbody");
    let sourceRow = event.target.parentNode;
    let allCoursesTimes = extractCourses();
    const newCourseTimes = extractCourseTime(sourceRow);

    let duplicateResult = checkDuplicateCourse(sourceRow);
    if (!duplicateResult['valid']) {
        window.alert(duplicateResult['error']);
        return;
    }

    let timeConflictResult = checkTimeConflict(newCourseTimes, allCoursesTimes);
    if (!timeConflictResult['valid']) {
        window.alert(timeConflictResult['error']);
        return;
    }

    let clonedRow = sourceRow.cloneNode(true);
    targetTable.appendChild(clonedRow);
    reloadSchedule();
}