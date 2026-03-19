#!/usr/bin/env python3
"""
Interactive Climate Change Dashboard - Startup Script
Automated launcher for backend and frontend servers.

Detecta automáticamente si corre dentro de Docker y omite pasos
innecesarios (Docker check, instalación de deps, apertura de browser,
kill de procesos en puertos) para reducir uso de RAM/CPU.
"""

import subprocess
import sys
import os
import time
import signal
import socket
from pathlib import Path

# ── Detección de entorno Docker ────────────────────────────────────
IN_DOCKER = (
    os.path.isfile("/.dockerenv")
    or os.environ.get("container") == "docker"
    or os.environ.get("DOCKER", "") == "1"
)

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_header():
    print(f"\n{Colors.CYAN}{Colors.BOLD}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║     Interactive Climate Change Dashboard - Launcher       ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}")
    if IN_DOCKER:
        print(f"  {Colors.BLUE}▶ Modo Docker detectado (omitiendo pasos locales){Colors.ENDC}\n")

def print_step(step, total, message):
    print(f"{Colors.YELLOW}[{step}/{total}] {message}...{Colors.ENDC}")

def print_success(message):
    print(f"{Colors.GREEN}✓ {message}{Colors.ENDC}")

def print_error(message):
    print(f"{Colors.RED}✗ {message}{Colors.ENDC}")

def print_info(message):
    print(f"{Colors.CYAN}ℹ {message}{Colors.ENDC}")

def check_command(command):
    try:
        if sys.platform == "win32":
            try:
                subprocess.run(
                    [f"{command}.cmd", "--version"],
                    stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                    check=True, shell=True
                )
                return True
            except Exception:
                pass
        subprocess.run(
            [command, "--version"],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            check=True, shell=(sys.platform == "win32")
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "localhost"

def check_port_available(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

def kill_process_on_port(port):
    """Kill process using a specific port — omitido dentro de Docker."""
    if IN_DOCKER:
        return True
    try:
        if sys.platform == "win32":
            result = subprocess.run(
                f'netstat -ano | findstr :{port}',
                shell=True, capture_output=True, text=True
            )
            if result.stdout:
                pids = set()
                for line in result.stdout.strip().split('\n'):
                    parts = line.split()
                    if len(parts) >= 5 and parts[-1].isdigit():
                        pids.add(parts[-1])
                for pid in pids:
                    try:
                        subprocess.run(f'taskkill /F /PID {pid}', shell=True,
                                       capture_output=True, timeout=5)
                        print_info(f"Killed process {pid} on port {port}")
                    except Exception:
                        pass
                time.sleep(3)
                for _ in range(5):
                    if check_port_available(port):
                        return True
                    time.sleep(1)
                return check_port_available(port)
        else:
            result = subprocess.run(f'lsof -ti:{port}', shell=True,
                                    capture_output=True, text=True)
            if result.stdout:
                for pid in result.stdout.strip().split('\n'):
                    try:
                        subprocess.run(f'kill -9 {pid}', shell=True, timeout=5)
                        print_info(f"Killed process {pid} on port {port}")
                    except Exception:
                        pass
                time.sleep(3)
                for _ in range(5):
                    if check_port_available(port):
                        return True
                    time.sleep(1)
                return check_port_available(port)
        return False
    except Exception as e:
        print_error(f"Error killing process on port {port}: {e}")
        return False

# ── Dependencias ───────────────────────────────────────────────────

def verify_dependencies():
    """Verificar dependencias (simplificado en Docker)."""
    if IN_DOCKER:
        print_step(1, 5, "Verificando entorno Docker")
        print_success("Entorno Docker — dependencias ya instaladas en la imagen")
        return

    print_step(1, 7, "Verifying dependencies")

    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print_success(f"Python {python_version} installed")

    if check_command("docker"):
        result = subprocess.run(["docker", "--version"],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print_success(f"Docker installed ({result.stdout.strip()})")
    else:
        print_info("Docker not found — PostgreSQL must be running externally")

    if not check_command("node"):
        print_error("Node.js is not installed")
        sys.exit(1)

    result = subprocess.run(["node", "--version"],
                            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    print_success(f"Node.js {result.stdout.strip()} installed")

    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    try:
        result = subprocess.run([npm_cmd, "--version"],
                                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                                text=True, shell=(sys.platform == "win32"))
        if result.stdout.strip():
            print_success(f"npm {result.stdout.strip()} installed")
        else:
            raise RuntimeError("npm not found")
    except Exception:
        print_error("npm is not installed")
        sys.exit(1)


def install_backend_dependencies():
    if IN_DOCKER:
        print_step(2, 5, "Backend dependencies (Docker — ya instaladas)")
        print_success("Skipped (imagen Docker)")
        return

    print_step(2, 7, "Installing backend dependencies")
    backend_path = Path(__file__).parent / "backend"
    requirements_file = backend_path / "requirements.txt"
    if not requirements_file.exists():
        print_error(f"requirements.txt not found at {requirements_file}")
        sys.exit(1)
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", "-r", str(requirements_file)],
            cwd=str(backend_path), check=True
        )
        print_success("Backend dependencies installed")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install backend dependencies: {e}")
        sys.exit(1)


def install_frontend_dependencies():
    """Instalar deps frontend — en Docker solo si faltan node_modules."""
    step = 3
    total = 5 if IN_DOCKER else 7
    print_step(step, total, "Installing frontend dependencies")

    frontend_path = Path(__file__).parent / "frontend"
    node_modules = frontend_path / "node_modules"

    if node_modules.exists():
        print_success("Frontend dependencies already installed")
        return

    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    try:
        subprocess.run(
            [npm_cmd, "install"],
            cwd=str(frontend_path), check=True,
            stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            shell=(sys.platform == "win32")
        )
        print_success("Frontend dependencies installed")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install frontend dependencies: {e}")
        sys.exit(1)


# ── Servicios ──────────────────────────────────────────────────────

def start_database():
    """Iniciar PostgreSQL — en Docker la BD es manejada por docker-compose."""
    if IN_DOCKER:
        print_step(4, 5, "Esperando base de datos")
        # Esperar a que PostgreSQL esté listo (docker-compose healthcheck)
        for i in range(30):
            if not check_port_available(5432):
                print_success("PostgreSQL listo en puerto 5432")
                return
            time.sleep(1)
        print_info("PostgreSQL puede seguir arrancando — el backend reintentará")
        return

    print_step(4, 7, "Starting PostgreSQL database")
    script_dir = Path(__file__).parent

    compose_cmd = None
    for cmd in [["docker", "compose"], ["docker-compose"]]:
        try:
            subprocess.run(cmd + ["version"],
                           stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            compose_cmd = cmd
            break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue

    if compose_cmd is None:
        print_info("docker-compose not found — assuming PostgreSQL is running externally")
        if not check_port_available(5432):
            print_success("PostgreSQL appears to be running on port 5432")
        else:
            print_info("PostgreSQL not detected on port 5432")
        return

    try:
        subprocess.run(compose_cmd + ["up", "-d", "db"],
                        cwd=str(script_dir), check=True,
                        stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        for _ in range(30):
            if not check_port_available(5432):
                print_success("PostgreSQL is ready on port 5432")
                return
            time.sleep(1)
        print_info("PostgreSQL may still be starting")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to start PostgreSQL: {e}")


def start_backend():
    step = 5 if IN_DOCKER else 5
    total = 5 if IN_DOCKER else 7
    print_step(step, total, "Starting backend server")

    backend_path = Path(__file__).parent / "backend"

    if not IN_DOCKER and not check_port_available(8000):
        print_info("Port 8000 is already in use, stopping existing process...")
        kill_process_on_port(8000)
        if not check_port_available(8000):
            print_error("Failed to free port 8000 automatically")
            sys.exit(1)

    try:
        # En Docker, NO usar --reload para ahorrar RAM (watchfiles consume mucho)
        reload_flag = [] if IN_DOCKER else ["--reload"]
        backend_process = subprocess.Popen(
            [sys.executable, "-m", "uvicorn", "app.main:app"]
            + reload_flag
            + ["--host", "0.0.0.0", "--port", "8000"],
            cwd=str(backend_path),
            stdout=None if IN_DOCKER else subprocess.PIPE,
            stderr=None if IN_DOCKER else subprocess.PIPE,
        )
        time.sleep(3)
        if backend_process.poll() is None:
            print_success("Backend server started on port 8000")
            if IN_DOCKER:
                print_info("Hot-reload desactivado en Docker para ahorrar RAM")
            return backend_process
        else:
            print_error("Backend server failed to start")
            sys.exit(1)
    except Exception as e:
        print_error(f"Failed to start backend: {e}")
        sys.exit(1)


def start_frontend():
    step = 5 if IN_DOCKER else 6
    total = 5 if IN_DOCKER else 7
    # En Docker steps se compactan, recalcular
    if IN_DOCKER:
        step = 5
        total = 5
    print_step(step, total, "Starting frontend server")

    frontend_path = Path(__file__).parent / "frontend"

    if not IN_DOCKER and not check_port_available(5173):
        print_info("Port 5173 is already in use, stopping existing process...")
        kill_process_on_port(5173)
        if not check_port_available(5173):
            print_error("Failed to free port 5173 automatically")
            sys.exit(1)

    try:
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"

        if sys.platform == "win32":
            frontend_process = subprocess.Popen(
                [npm_cmd, "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"],
                cwd=str(frontend_path),
                creationflags=subprocess.CREATE_NEW_CONSOLE,
                shell=True
            )
        else:
            frontend_process = subprocess.Popen(
                ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"],
                cwd=str(frontend_path),
                stdout=None if IN_DOCKER else subprocess.PIPE,
                stderr=None if IN_DOCKER else subprocess.PIPE,
            )

        time.sleep(5)
        if frontend_process.poll() is None:
            print_success("Frontend server started on port 5173")
            return frontend_process
        else:
            print_error("Frontend server failed to start")
            sys.exit(1)
    except Exception as e:
        print_error(f"Failed to start frontend: {e}")
        sys.exit(1)


def display_access_info():
    local_ip = get_local_ip()

    print(f"\n{Colors.GREEN}{Colors.BOLD}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║          Application Started Successfully!                 ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}\n")

    print(f"{Colors.CYAN}📍 Local Access:{Colors.ENDC}")
    print(f"   Frontend: {Colors.BOLD}http://localhost:5173{Colors.ENDC}")
    print(f"   Backend:  {Colors.BOLD}http://localhost:8000{Colors.ENDC}")
    print(f"   API Docs: {Colors.BOLD}http://localhost:8000/docs{Colors.ENDC}")

    if local_ip != "localhost":
        print(f"\n{Colors.CYAN}📡 Network Access:{Colors.ENDC}")
        print(f"   Frontend: {Colors.BOLD}http://{local_ip}:5173{Colors.ENDC}")
        print(f"   Backend:  {Colors.BOLD}http://{local_ip}:8000{Colors.ENDC}")

    if IN_DOCKER:
        print(f"\n{Colors.YELLOW}💡 Docker:{Colors.ENDC}")
        print(f"   • uvicorn --reload desactivado para ahorrar RAM")
        print(f"   • Vite watch usa inotify (no polling)")
        print(f"   • Para reiniciar: docker compose restart app")
    else:
        print(f"\n{Colors.YELLOW}💡 Tips:{Colors.ENDC}")
        print(f"   • Servers are running in separate windows")
        print(f"   • Close the windows to stop the servers")

    print()


def open_browser():
    """Abrir navegador — omitido dentro de Docker."""
    if IN_DOCKER:
        return
    import webbrowser
    time.sleep(2)
    webbrowser.open("http://localhost:5173")


# ── Main ───────────────────────────────────────────────────────────

def main():
    try:
        print_header()

        script_dir = Path(__file__).parent
        os.chdir(script_dir)

        verify_dependencies()
        install_backend_dependencies()
        install_frontend_dependencies()
        start_database()

        backend_process = start_backend()
        frontend_process = start_frontend()

        display_access_info()
        open_browser()

        print(f"{Colors.YELLOW}Press Ctrl+C to stop all servers...{Colors.ENDC}\n")

        # En Docker, propagar SIGTERM correctamente
        if IN_DOCKER:
            def handle_signal(signum, frame):
                print(f"\n{Colors.YELLOW}Señal {signum} recibida, deteniendo...{Colors.ENDC}")
                backend_process.terminate()
                frontend_process.terminate()
                backend_process.wait(timeout=10)
                frontend_process.wait(timeout=10)
                sys.exit(0)
            signal.signal(signal.SIGTERM, handle_signal)
            signal.signal(signal.SIGINT, handle_signal)

        try:
            while True:
                time.sleep(5)  # Revisar cada 5s en vez de 1s — menos CPU
                if backend_process.poll() is not None:
                    print_error("Backend server stopped unexpectedly")
                    break
                if frontend_process.poll() is not None:
                    print_error("Frontend server stopped unexpectedly")
                    break
        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}Stopping servers...{Colors.ENDC}")
            try:
                backend_process.terminate()
                frontend_process.terminate()
                backend_process.wait(timeout=5)
                frontend_process.wait(timeout=5)
                print_success("Servers stopped")
            except Exception as e:
                print_error(f"Error stopping servers: {e}")
            print(f"\n{Colors.CYAN}Thank you for using Climate Dashboard!{Colors.ENDC}\n")

    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
