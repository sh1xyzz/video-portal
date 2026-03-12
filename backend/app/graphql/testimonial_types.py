# backend/app/graphql/testimonial_types.py
import strawberry
from typing import Optional


@strawberry.type
class TestimonialType:
    id:     int
    name:   str
    role:   Optional[str]
    avatar: Optional[str]
    color:  Optional[str]
    rating: float
    text:   str


@strawberry.input
class TestimonialInput:
    name:   str
    text:   str
    role:   Optional[str] = None
    avatar: Optional[str] = None
    color:  Optional[str] = "#6c63ff"
    rating: float         = 5.0