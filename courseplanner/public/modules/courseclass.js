// just for showing, not using it
class CoursePlanner {
    constructor() {
        this.addCourseWindow = document.getElementById('add-course-window');
        this.courseResultWindow = document.getElementById('course-result-window');
        this.scheduleList = document.getElementById('schedule-list');
        this.courseSearchResult = document.getElementById('course-search-result');
    }
    
    showScheduleList() {
        this.addCourseWindow.style.display = 'none';
        this.courseResultWindow.style.display = 'block';
        this.scheduleList.style.display = 'block';
        this.courseSearchResult.style.display = 'none';
        this.scheduleList.scrollIntoView({behavior: "smooth"});
    }

    hideScheduleList() {
        this.addCourseWindow.style.display = 'block';
        this.courseResultWindow.style.display = 'none';
        this.scheduleList.style.display = 'none';
        this.courseSearchResult.style.display = 'block';
    }
    
    toggleScheduleList() {
        if (this.scheduleList.style.display === 'none') {
            this.showScheduleList();
        } else {
            this.hideScheduleList();
        }
    }
}
