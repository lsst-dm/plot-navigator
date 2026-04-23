
from collections.abc import Iterator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from lsst.plot_navigator.config import Settings, get_settings
from lsst.plot_navigator.main import app
from lsst.plot_navigator.make_test_butler import create_temp_butler, ingest_to_temp_butler


@pytest.fixture(scope="session")
def test_butler():
    repo_dir = Path("testing_butler")
    if not repo_dir.exists():
        create_temp_butler(range(1461,1480))
        ingest_to_temp_butler("test_assets/images/debug/6b2b562b-9a4b-493a-9c59-a55e1a47e43c.png", 1461)
        ingest_to_temp_butler("test_assets/images/debug/e5aba659-e379-47e2-ba1c-d93bfea1a4fa.png", 1463)
    return repo_dir

@pytest.fixture
def local_test_settings() -> Settings:
    return Settings(
        enable_test_images=True,
        butler_repo_names=["testing_butler"],
    )

@pytest.fixture
def client(local_test_settings: Settings) -> Iterator[TestClient]:
    app.dependency_overrides[get_settings] = lambda: local_test_settings
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
