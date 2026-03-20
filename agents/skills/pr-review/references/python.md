# Python Reference

## Framework Detection Matrix

Check these files/patterns to determine what the project uses:

### Package Manager
| Signal | Manager | Install | Run |
|--------|---------|---------|-----|
| `pyproject.toml` with `[tool.poetry]` | Poetry | `poetry install` | `poetry run` |
| `pyproject.toml` with `[tool.uv]` or `uv.lock` | uv | `uv sync` | `uv run` |
| `Pipfile` | Pipenv | `pipenv install` | `pipenv run` |
| `requirements.txt` only | pip | `pip install -r requirements.txt` | (direct) |
| `pyproject.toml` with `[tool.hatch]` | Hatch | `hatch env create` | `hatch run` |

### Test Frameworks
| Signal | Framework | Run Tests | Coverage |
|--------|-----------|-----------|----------|
| `pytest` in deps, `conftest.py`, `pytest.ini` | pytest | `pytest` | `pytest --cov --cov-report=json` |
| `unittest` imports | unittest | `python -m unittest` | `coverage run -m unittest && coverage json` |
| `nose2` in deps | nose2 | `nose2` | `nose2 --with-coverage` |

### E2E Frameworks
| Signal | Framework | Run | Screenshots |
|--------|-----------|-----|-------------|
| `playwright` in deps, `pytest-playwright` | Playwright | `pytest --browser chromium` | `page.screenshot()` |
| `selenium` in deps | Selenium | (custom runner) | `driver.save_screenshot()` |
| `splinter` in deps | Splinter | (custom runner) | `browser.screenshot()` |

### Linters & Type Checkers
| Signal | Tool | Run |
|--------|------|-----|
| `mypy` in deps, `mypy.ini`, `[tool.mypy]` | mypy | `mypy .` |
| `pyright` in deps, `pyrightconfig.json` | Pyright | `pyright` |
| `ruff` in deps, `ruff.toml`, `[tool.ruff]` | Ruff | `ruff check .` |
| `flake8` in deps, `.flake8` | Flake8 | `flake8 .` |
| `pylint` in deps, `.pylintrc` | Pylint | `pylint src/` |
| `black` in deps | Black | `black --check .` |

### App Frameworks
| Signal | Framework | Dev Server |
|--------|-----------|------------|
| `fastapi` in deps | FastAPI | `uvicorn main:app --reload` |
| `django` in deps, `manage.py` | Django | `python manage.py runserver` |
| `flask` in deps | Flask | `flask run` or `python app.py` |
| `streamlit` in deps | Streamlit | `streamlit run app.py` |

## Running Tests with Coverage

### pytest
```bash
# Install coverage if needed
pip install pytest-cov

# Run with coverage
pytest --cov=src --cov-report=json --cov-report=term -v

# Coverage output: coverage.json (or .coverage for raw data)
```

### Coverage.py (standalone)
```bash
pip install coverage

coverage run -m pytest
coverage json          # produces coverage.json
coverage report        # terminal summary
```

### Reading Coverage JSON

The `coverage.json` format:
```json
{
  "files": {
    "src/utils.py": {
      "executed_lines": [1, 2, 5, 6, 10],
      "missing_lines": [3, 4, 7, 8, 9],
      "excluded_lines": [],
      "summary": {
        "covered_lines": 5,
        "num_statements": 10,
        "percent_covered": 50.0
      }
    }
  }
}
```

To find uncovered changed lines:
1. Get changed lines from `git diff`
2. Check `missing_lines` for each file
3. Intersect changed lines with missing lines

## Bootstrapping Playwright

When no e2e framework exists:

```bash
pip install playwright pytest-playwright
playwright install --with-deps chromium
```

Create `conftest.py` for Playwright (if not present):
```python
import pytest

@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {**browser_context_args, "viewport": {"width": 1280, "height": 720}}
```

Create `e2e/` directory for test files.

### Playwright with pytest

```python
# e2e/test_checkout.py
import pytest
from playwright.sync_api import Page, expect

def test_checkout_form(page: Page):
    page.goto("/checkout")
    page.screenshot(path="screenshots/checkout-initial.png", full_page=True)

    page.fill('[name="cardNumber"]', '4242424242424242')
    page.fill('[name="expiry"]', '12/25')
    page.click('button[type="submit"]')

    page.screenshot(path="screenshots/checkout-submitted.png", full_page=True)
    expect(page.locator('.success-message')).to_be_visible()
```

Run:
```bash
pytest e2e/ --browser chromium --screenshot on
```

## Bootstrapping Selenium

If Selenium is already the project's convention:

```bash
pip install selenium webdriver-manager
```

## Screenshot Patterns

### Playwright (Python)
```python
# Full page
page.screenshot(path="screenshots/name.png", full_page=True)

# Specific element
page.locator(".component").screenshot(path="screenshots/component.png")

# After waiting for content
page.wait_for_load_state("networkidle")
page.screenshot(path="screenshots/loaded.png")
```

### Selenium
```python
driver.save_screenshot("screenshots/name.png")
element = driver.find_element(By.CSS_SELECTOR, ".component")
element.screenshot("screenshots/component.png")
```

## Common Python Patterns to Watch For

When reviewing Python PRs, pay special attention to:

- Missing `None` checks, especially with Optional types
- Mutable default arguments (`def f(items=[])` — classic bug)
- Bare `except:` clauses swallowing exceptions
- Missing `async`/`await` — forgetting to await a coroutine
- SQL injection via string formatting instead of parameterized queries
- File handles not using `with` statements (resource leaks)
- `isinstance` checks that miss subclasses
- Missing `__init__.py` breaking imports
- Django/FastAPI: missing authentication decorators on new endpoints
- Incorrect `__eq__` without `__hash__` for objects used in sets/dicts
