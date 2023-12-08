from bs4 import BeautifulSoup
import requests
import random
import re

COURSE_URL = "https://www.bu.edu/link/bin/uiscgi_studentlink.pl/1690767042?"


# Prepare the headers and parameters needed to fetch courses by class number.
def prepare_class_num(sem_code, college, dept, course, section, CRC):
    headers = {"User-Agent": f"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.{random.randrange(99)} "
                             f"(KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"}
    params = {
        "ModuleName": "univschr.pl",
        "SearchOptionDesc": "Class+Number",
        "SearchOptionCd": "S",
        "College": college,
        "KeySem": sem_code,
        "Dept": dept,
        "Course": course,
        "Section": section,
        "MainCampusInd": CRC
    }
    return headers, params


# Prepare the headers and parameters needed to fetch courses by class subject.
def prepare_class_subject(sem_code, subject, mtgday, mtgtime, CRC):
    headers = {"User-Agent": f"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.{random.randrange(99)} "
                             f"(KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36"}
    params = {
        "ModuleName": "univschr.pl",
        "SearchOptionDesc": "Class+Subject",
        "SearchOptionCd": "C",
        "KeySem": sem_code,
        "Subject": subject,
        "MtgDay": mtgday,
        "MtgTime": mtgtime,
        "MainCampusInd": CRC
    }
    return headers, params


# Prepare the headers and parameters needed to fetch online courses.
def prepare_online(sem_code):
    headers = {"User-Agent": f"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.{random.randrange(99)} "
                             f"(KHTML, like Gecko) Chrome/87.0.4280.67 Safari/537.36"}
    params = {
        "ModuleName": "univschr.pl",
        "SearchOptionDesc": "Distance+Education",
        "SearchOptionCd": "D",
        "KeySem": sem_code
    }
    return headers, params


# Sends a GET request with the provided headers and parameters to get the courses data response.
def fetch_content(headers, params):
    response = requests.get(COURSE_URL, params=params, headers=headers)
    return response.content


# Converts the HTML content of the response into a list of courses.
def convert_to_course_list(content, search_para):
    """
    Extract course information from HTML and convert them to a list of courses.
    """
    courses = []
    bs = BeautifulSoup(content, "lxml")
    table_rows = bs.find_all('tr', {'align': 'center', 'valign': 'top'})
    for row in table_rows:
        data = row.find_all('td')
        # empty first cell represents a course row
        if data[0].text == "":
            courseData = []
            for cell in data:
                cell_data = cell.get_text(separator="<br>").strip().replace(u'\xa0', u' ')
                cell_data = '<br>'.join([item.strip() for item in cell_data.split('<br>')])
                courseData.append(cell_data)
            courseData.pop(3)
            # If course title is not empty
            if courseData[1] != "":
                courses.append(courseData[1:])
    # record course data for continue search
    script_tags = bs.find_all('script')
    more_ind_value = None
    for script in script_tags:
        if script.string:
            match = re.search(r'var\s*MoreInd\s*=\s*"(.*?)";', script.string)
            if match:
                more_ind_value = match.group(1)
                break
    if more_ind_value == 'Y':
        college = bs.find('input', {'name': 'College'}).get('value')
        dept = bs.find('input', {'name': 'Dept'}).get('value')
        course = bs.find('input', {'name': 'Course'}).get('value')
        section = bs.find('input', {'name': 'Section'}).get('value')
        last_course = [college, dept, course, section, search_para[0], search_para[1]]
        return {"course": courses, "continueFrom": last_course}
    return {"course": courses}


if __name__ == "__main__":

    headers, params = prepare_class_subject('20241', "", "MWF", "", "")
    content = fetch_content(headers, params)
    result = convert_to_course_list(content, ['20241', ""])
    print(result)
    course, last_course = result["course"], result.get("continueFrom")
    for i in course:
        print(i)
    print(last_course)
