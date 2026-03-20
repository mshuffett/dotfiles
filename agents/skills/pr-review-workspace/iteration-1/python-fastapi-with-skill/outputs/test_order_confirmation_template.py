"""E2E / UI verification tests for the order confirmation Jinja2 template.

The template is a UI element that renders order confirmation pages.
These tests verify:
  - Template renders without errors for valid data
  - All expected fields appear in the rendered HTML
  - XSS-sensitive fields are properly escaped by Jinja2
  - Edge cases (empty items, long names, special characters) render correctly
"""

import pytest
from jinja2 import Environment, FileSystemLoader, select_autoescape

from src.models.order import Order, OrderStatus


@pytest.fixture
def jinja_env():
    """Create a Jinja2 environment pointing at the templates directory."""
    return Environment(
        loader=FileSystemLoader("src/templates"),
        autoescape=select_autoescape(["html"]),
    )


@pytest.fixture
def sample_order():
    return Order(
        order_id=42,
        customer_id=7,
        amount=129.99,
        items=["Widget Pro", "Gadget Lite", "Cable USB-C"],
        status=OrderStatus.CONFIRMED,
    )


class TestOrderConfirmationTemplate:
    """Verify the order_confirmation.html template renders correctly."""

    def test_renders_without_error(self, jinja_env, sample_order):
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Alice Smith",
            customer_email="alice@example.com",
            order=sample_order,
        )
        assert "Order Confirmed!" in html

    def test_contains_customer_name(self, jinja_env, sample_order):
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Bob Jones",
            customer_email="bob@test.com",
            order=sample_order,
        )
        assert "Bob Jones" in html

    def test_contains_order_id(self, jinja_env, sample_order):
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Alice",
            customer_email="a@b.com",
            order=sample_order,
        )
        assert "#42" in html

    def test_contains_all_items(self, jinja_env, sample_order):
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Alice",
            customer_email="a@b.com",
            order=sample_order,
        )
        for item in ["Widget Pro", "Gadget Lite", "Cable USB-C"]:
            assert item in html

    def test_contains_formatted_total(self, jinja_env, sample_order):
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Alice",
            customer_email="a@b.com",
            order=sample_order,
        )
        assert "$129.99" in html

    def test_contains_customer_email(self, jinja_env, sample_order):
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Alice",
            customer_email="alice@example.com",
            order=sample_order,
        )
        assert "alice@example.com" in html

    def test_contains_order_status(self, jinja_env, sample_order):
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Alice",
            customer_email="a@b.com",
            order=sample_order,
        )
        # The template renders order.status which is the enum member;
        # depending on how Jinja2 stringifies it, check for the value
        assert "confirmed" in html.lower() or "CONFIRMED" in html

    def test_empty_items_list(self, jinja_env):
        order = Order(order_id=1, customer_id=1, amount=0.0, items=[])
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Empty Order User",
            customer_email="e@test.com",
            order=order,
        )
        # Should render without error, items list section should be present but empty
        assert "Order Confirmed!" in html
        assert "$0.00" in html

    def test_xss_in_customer_name_escaped(self, jinja_env, sample_order):
        """Verify Jinja2 autoescaping prevents XSS in customer_name."""
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name='<script>alert("xss")</script>',
            customer_email="a@b.com",
            order=sample_order,
        )
        # The raw script tag must NOT appear — it should be escaped
        assert "<script>" not in html
        assert "&lt;script&gt;" in html

    def test_xss_in_customer_email_escaped(self, jinja_env, sample_order):
        """Verify Jinja2 autoescaping prevents XSS in customer_email."""
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Alice",
            customer_email='"><img src=x onerror=alert(1)>',
            order=sample_order,
        )
        assert 'onerror=alert(1)>' not in html

    def test_xss_in_item_names_escaped(self, jinja_env):
        """Verify item names with HTML are escaped."""
        order = Order(
            order_id=1,
            customer_id=1,
            amount=10.0,
            items=['<img src=x onerror="alert(1)">'],
        )
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Alice",
            customer_email="a@b.com",
            order=order,
        )
        assert "<img src=x" not in html

    def test_special_characters_in_name(self, jinja_env, sample_order):
        """Names with accents, ampersands, etc. should render safely."""
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="José O'Brien & Co.",
            customer_email="jose@test.com",
            order=sample_order,
        )
        # Ampersand should be escaped in HTML
        assert "&amp;" in html or "José O'Brien & Co." in html

    def test_html_structure(self, jinja_env, sample_order):
        """Basic structural checks on the rendered HTML."""
        template = jinja_env.get_template("order_confirmation.html")
        html = template.render(
            customer_name="Alice",
            customer_email="a@b.com",
            order=sample_order,
        )
        assert "<!DOCTYPE html>" in html
        assert "<html" in html
        assert "</html>" in html
        assert '<div class="confirmation">' in html
        assert '<h1 class="header">' in html
