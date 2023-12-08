from bs4 import BeautifulSoup
import requests
import random


# Retrieves the search options.
def get_search_options(url):
    semlist, subject, mtgday, mtgtime, college = {}, {}, {}, {}, []
    headers = {
        "User-Agent": f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.{random.randrange(99)} "
                      f"(KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
    }
    response = requests.get(url, headers=headers)
    content = response.content
    bs = BeautifulSoup(content, "lxml")
    table = bs.find_all('select')
    for row in table:
        if row["name"] == "SemList":
            options_to_dict(row, semlist)
        elif row["name"] == "College":
            college = [i.text.strip() for i in row.find_all('option')[1:]]
        elif row["name"] == "Subject":
            options_to_dict(row, subject)
        elif row["name"] == "MtgDay":
            options_to_dict(row, mtgday)
        elif row["name"] == "MtgTime":
            options_to_dict(row, mtgtime)

    return {'SemList': semlist, 'College': college, 'Subject': subject, 'Mtgday': mtgday, 'Mtgtime': mtgtime}


# Converts the provided HTML option elements into a dictionary
def options_to_dict(row, option_dict):
    options = row.find_all('option', {'value': True})
    for option in options:
        option_dict[option.text.strip()] = option['value']


