import os
import shutil
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def mover_si_existe(src: Path, dst: Path) -> None:
    if src.exists():
        ensure_dir(dst.parent)
        print(f"Moviendo {src} -> {dst}")
        shutil.move(str(src), str(dst))
    else:
        print(f"No encontrado, se omite: {src}")


def main() -> None:
    # Carpetas objetivo principales
    app_dir = BASE_DIR / "app"
    data_dir = BASE_DIR / "data"
    scripts_dir = BASE_DIR / "scripts"
    integrations_dir = BASE_DIR / "integrations"
    docs_dir = BASE_DIR / "docs"

    # Subcarpetas de datos
    data_datasets_dir = data_dir / "datasets"
    data_processed_dir = data_dir / "processed"
    data_models_dir = data_dir / "models"

    # Crear carpetas base (no mueve nada todavía)
    for d in [
        app_dir,
        data_dir,
        scripts_dir,
        integrations_dir,
        docs_dir,
        data_datasets_dir,
        data_processed_dir,
        data_models_dir,
    ]:
        ensure_dir(d)

    # --- Mover scripts de ejemplo / utilidad a scripts/ ---
    mover_si_existe(BASE_DIR / "api_ejemplo.py", scripts_dir / "api_ejemplo.py")
    mover_si_existe(BASE_DIR / "seed_nlp_dataset.py", scripts_dir / "seed_nlp_dataset.py")

    # --- Mover documentación a docs/ (dejando README.md en la raíz) ---
    mover_si_existe(BASE_DIR / "ESTRUCTURA_PROYECTO.md", docs_dir / "ESTRUCTURA_PROYECTO.md")
    mover_si_existe(BASE_DIR / "GUIA_SWAGGER.md", docs_dir / "GUIA_SWAGGER.md")
    mover_si_existe(BASE_DIR / "INTEGRACION_WASI.md", docs_dir / "INTEGRACION_WASI.md")
    mover_si_existe(BASE_DIR / "Propiedades_Wasi.pdf", docs_dir / "Propiedades_Wasi.pdf")

    # --- Archivos de integración WASI ---
    wasi_dir = integrations_dir / "wasi"
    ensure_dir(wasi_dir)
    mover_si_existe(BASE_DIR / "openapi_wasi.yaml", wasi_dir / "openapi_wasi.yaml")

    # --- Datasets y modelos principales (WASI + NLP) ---
    mover_si_existe(BASE_DIR / "inmuebles_wasi_real.csv", data_datasets_dir / "inmuebles_wasi_real.csv")
    mover_si_existe(BASE_DIR / "dataset_nlp_inmuebles_5000.csv", data_datasets_dir / "dataset_nlp_inmuebles_5000.csv")
    mover_si_existe(BASE_DIR / "modelo_wasi.pkl", data_models_dir / "modelo_wasi.pkl")
    mover_si_existe(BASE_DIR / "modelo_nlp_inmuebles.pkl", data_models_dir / "modelo_nlp_inmuebles.pkl")

    print("\nEstructura base organizada. Revisa los movimientos anteriores.")


if __name__ == "__main__":
    main()
