# graphql/types.py — описывает форму данных в GraphQL
#
# CourseType — это то, что возвращается при запросе
# CourseInput — это то, что передаётся при создании
#
# @strawberry.type = "я это отдаю"
# @strawberry.input = "я это принимаю"

import strawberry
from typing import Optional


@strawberry.type
class CourseType:
    id:           int
    title:        str
    instructor:   str
    avatar:       Optional[str]
    rating:       float
    students:     int
    duration:     Optional[str]
    level:        Optional[str]
    tag:          Optional[str]
    tag_color:    Optional[str]   # tagColor на фронте (Strawberry сам конвертирует)
    thumb:        Optional[str]
    price:        Optional[str]


@strawberry.input
class CourseInput:
    """Что нужно передать чтобы создать курс."""
    title:        str
    instructor:   str
    avatar:       Optional[str] = None
    rating:       float         = 0.0
    students:     int           = 0
    duration:     Optional[str] = None
    level:        Optional[str] = None
    tag:          Optional[str] = None
    tag_color:    Optional[str] = None
    thumb:        Optional[str] = None
    price:        Optional[str] = None