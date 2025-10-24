#!/usr/bin/env python3
"""
Interactive Climate Change Dashboard - Startup Script
Automated launcher for backend and frontend servers
"""

import subprocess
import sys
import os
import time
import socket
from pathlib import Path

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
    """Print application header"""
    print(f"\n{Colors.CYAN}{Colors.BOLD}")
    print("╔════════════════════════════════════════════════════════════╗")
    print("║     Interactive Climate Change Dashboard - Launcher       ║")
    print("╚════════════════════════════════════════════════════════════╝")
    print(f"{Colors.ENDC}\n")

def print_step(step, total, message):
    """Print progress step"""
    print(f"{Colors.YELLOW}[{step}/{total}] {message}...{Colors.ENDC}")

def print_success(message):
    """Print success message"""
    print(f"{Colors.GREEN}✓ {message}{Colors.ENDC}")

def print_error(message):
    """Print error message"""
    print(f"{Colors.RED}✗ {message}{Colors.ENDC}")

def print_info(message):
    """Print info message"""
    print(f"{Colors.CYAN}ℹ {message}{Colors.ENDC}")

def check_command(command):
    """Check if a command exists"""
    try:
        # For Windows, try with .cmd extension first
        if sys.platform == "win32":
            try:
                subprocess.run(
                    [f"{command}.cmd", "--version"],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    check=True,
                    shell=True
                )
                return True
            except:
                pass
        
        subprocess.run(
            [command, "--version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            check=True,
            shell=True if sys.platform == "win32" else False
        )
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False

def get_local_ip():
    """Get local IP address"""
    try:
        # Create a socket to get local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
        return local_ip
    except Exception:
        return "localhost"

def check_port_available(port):
    """Check if a port is available"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) != 0

def kill_process_on_port(port):
    """Kill process using a specific port (Windows)"""
    try:
        if sys.platform == "win32":
            # Find process using the port
            result = subprocess.run(
                f'netstat -ano | findstr :{port}',
                shell=True,
                capture_output=True,
                text=True
            )
            
            if result.stdout:
                lines = result.stdout.strip().split('\n')
                pids = set()
                
                for line in lines:
                    parts = line.split()
                    if len(parts) >= 5:
                        pid = parts[-1]
                        if pid.isdigit():
                            pids.add(pid)
                
                # Kill all PIDs found
                for pid in pids:
                    try:
                        subprocess.run(
                            f'taskkill /F /PID {pid}',
                            shell=True,
                            capture_output=True,
                            timeout=5
                        )
                        print_info(f"Killed process {pid} on port {port}")
                    except:
                        pass
                
                # Wait longer for port to be released
                time.sleep(3)
                
                # Verify port is free
                max_retries = 5
                for i in range(max_retries):
                    if check_port_available(port):
                        return True
                    time.sleep(1)
                
                return check_port_available(port)
        else:
            # Unix/Linux/macOS
            result = subprocess.run(
                f'lsof -ti:{port}',
                shell=True,
                capture_output=True,
                text=True
            )
            
            if result.stdout:
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    try:
                        subprocess.run(f'kill -9 {pid}', shell=True, timeout=5)
                        print_info(f"Killed process {pid} on port {port}")
                    except:
                        pass
                
                time.sleep(3)
                
                # Verify port is free
                max_retries = 5
                for i in range(max_retries):
                    if check_port_available(port):
                        return True
                    time.sleep(1)
                
                return check_port_available(port)
        
        return False
    except Exception as e:
        print_error(f"Error killing process on port {port}: {e}")
        return False

def verify_dependencies():
    """Verify Python and Node.js are installed"""
    print_step(1, 6, "Verifying dependencies")
    
    # Check Python
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    print_success(f"Python {python_version} installed")
    
    # Check Node.js
    if not check_command("node"):
        print_error("Node.js is not installed")
        print_info("Please install Node.js from https://nodejs.org/")
        sys.exit(1)
    
    # Get Node.js version
    result = subprocess.run(
        ["node", "--version"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True
    )
    node_version = result.stdout.strip()
    print_success(f"Node.js {node_version} installed")
    
    # Check npm
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    try:
        result = subprocess.run(
            [npm_cmd, "--version"],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=True if sys.platform == "win32" else False
        )
        npm_version = result.stdout.strip()
        if npm_version:
            print_success(f"npm {npm_version} installed")
        else:
            print_error("npm is not installed")
            print_info("Please install Node.js from https://nodejs.org/")
            sys.exit(1)
    except Exception:
        print_error("npm is not installed")
        print_info("Please install Node.js from https://nodejs.org/")
        sys.exit(1)

def install_backend_dependencies():
    """Install Python backend dependencies"""
    print_step(2, 6, "Installing backend dependencies")
    
    backend_path = Path(__file__).parent / "backend"
    requirements_file = backend_path / "requirements.txt"
    
    if not requirements_file.exists():
        print_error(f"requirements.txt not found at {requirements_file}")
        sys.exit(1)
    
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-q", "-r", str(requirements_file)],
            cwd=str(backend_path),
            check=True
        )
        print_success("Backend dependencies installed")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install backend dependencies: {e}")
        sys.exit(1)

def install_frontend_dependencies():
    """Install Node.js frontend dependencies"""
    print_step(3, 6, "Installing frontend dependencies")
    
    frontend_path = Path(__file__).parent / "frontend"
    node_modules = frontend_path / "node_modules"
    
    if node_modules.exists():
        print_success("Frontend dependencies already installed")
        return
    
    npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
    
    try:
        subprocess.run(
            [npm_cmd, "install"],
            cwd=str(frontend_path),
            check=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            shell=True if sys.platform == "win32" else False
        )
        print_success("Frontend dependencies installed")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install frontend dependencies: {e}")
        sys.exit(1)

def start_backend():
    """Start backend server"""
    print_step(4, 6, "Starting backend server")
    
    backend_path = Path(__file__).parent / "backend"
    
    # Check if port 8000 is available
    if not check_port_available(8000):
        print_info("Port 8000 is already in use, stopping existing process...")
        killed = kill_process_on_port(8000)
        
        if not check_port_available(8000):
            print_error("Failed to free port 8000 automatically")
            print_info("Please manually close any process using port 8000 and try again")
            print_info("You can find it with: netstat -ano | findstr :8000")
            sys.exit(1)
    
    try:
        # Start uvicorn server in a new process
        if sys.platform == "win32":
            # Windows
            backend_process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "app.main:app", 
                 "--reload", "--host", "0.0.0.0", "--port", "8000"],
                cwd=str(backend_path),
                creationflags=subprocess.CREATE_NEW_CONSOLE
            )
        else:
            # Unix/Linux/macOS
            backend_process = subprocess.Popen(
                [sys.executable, "-m", "uvicorn", "app.main:app", 
                 "--reload", "--host", "0.0.0.0", "--port", "8000"],
                cwd=str(backend_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
        
        # Wait for backend to start
        time.sleep(3)
        
        # Check if backend is running
        if backend_process.poll() is None:
            print_success("Backend server started on port 8000")
            return backend_process
        else:
            print_error("Backend server failed to start")
            sys.exit(1)
    except Exception as e:
        print_error(f"Failed to start backend: {e}")
        sys.exit(1)

def start_frontend():
    """Start frontend server"""
    print_step(5, 6, "Starting frontend server")
    
    frontend_path = Path(__file__).parent / "frontend"
    
    # Check if port 5173 is available
    if not check_port_available(5173):
        print_info("Port 5173 is already in use, stopping existing process...")
        killed = kill_process_on_port(5173)
        
        if not check_port_available(5173):
            print_error("Failed to free port 5173 automatically")
            print_info("Please manually close any process using port 5173 and try again")
            print_info("You can find it with: netstat -ano | findstr :5173")
            sys.exit(1)
    
    try:
        # Start Vite dev server in a new process
        npm_cmd = "npm.cmd" if sys.platform == "win32" else "npm"
        
        if sys.platform == "win32":
            # Windows
            frontend_process = subprocess.Popen(
                [npm_cmd, "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"],
                cwd=str(frontend_path),
                creationflags=subprocess.CREATE_NEW_CONSOLE,
                shell=True
            )
        else:
            # Unix/Linux/macOS
            frontend_process = subprocess.Popen(
                ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"],
                cwd=str(frontend_path),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE
            )
        
        # Wait for frontend to start
        time.sleep(5)
        
        # Check if frontend is running
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
    """Display access information"""
    print_step(6, 6, "Application ready")
    
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
    
    print(f"\n{Colors.YELLOW}💡 Tips:{Colors.ENDC}")
    print(f"   • Servers are running in separate windows")
    print(f"   • Close the windows to stop the servers")
    print(f"   • Share the network URL with other devices on your local network")
    
    print(f"\n{Colors.CYAN}🌐 Opening browser...{Colors.ENDC}\n")

def open_browser():
    """Open the application in the default browser"""
    import webbrowser
    time.sleep(2)
    webbrowser.open("http://localhost:5173")

def main():
    """Main function"""
    try:
        print_header()
        
        # Change to script directory
        script_dir = Path(__file__).parent
        os.chdir(script_dir)
        
        # Verify dependencies
        verify_dependencies()
        
        # Install backend dependencies
        install_backend_dependencies()
        
        # Install frontend dependencies
        install_frontend_dependencies()
        
        # Start backend server
        backend_process = start_backend()
        
        # Start frontend server
        frontend_process = start_frontend()
        
        # Display access information
        display_access_info()
        
        # Open browser
        open_browser()
        
        print(f"{Colors.YELLOW}Press Ctrl+C to stop all servers...{Colors.ENDC}\n")
        
        # Keep script running
        try:
            while True:
                time.sleep(1)
                
                # Check if processes are still running
                if backend_process.poll() is not None:
                    print_error("Backend server stopped unexpectedly")
                    break
                
                if frontend_process.poll() is not None:
                    print_error("Frontend server stopped unexpectedly")
                    break
        
        except KeyboardInterrupt:
            print(f"\n\n{Colors.YELLOW}Stopping servers...{Colors.ENDC}")
            
            # Terminate processes
            try:
                backend_process.terminate()
                frontend_process.terminate()
                
                # Wait for processes to terminate
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
