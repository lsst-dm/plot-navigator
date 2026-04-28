
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from lsst.plot_navigator.app_factory import app_factory
from lsst.plot_navigator.config import Settings, get_settings
from lsst.plot_navigator.make_test_butler import make_test_butler


@pytest.fixture(scope="session")
def test_butler():
    repo_dir = Path("testing_butler")

    make_test_butler(repo_dir, "testing_butler")

    return repo_dir

@pytest.fixture
def local_test_settings() -> Settings:
    return Settings(
        enable_test_images=True,
        butler_repo_names=["testing_butler"],
    )

@pytest.fixture
def client(local_test_settings: Settings) -> Iterator[TestClient]:
    app = app_factory(local_test_settings)
    app.dependency_overrides[get_settings] = lambda: local_test_settings
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
