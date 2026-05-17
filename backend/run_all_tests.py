import os
import sys
import subprocess
import time

def run_test_script(script_name: str) -> tuple[bool, str, str]:
    """Runs a Python test script and returns success status, stdout, and stderr."""
    print(f"[RUNNING] {script_name}...")
    start_time = time.time()
    try:
        # Run using the virtual environment's python interpreter
        python_exe = os.path.join("venv", "Scripts", "python.exe")
        if not os.path.exists(python_exe):
            python_exe = "python" # Fallback
            
        result = subprocess.run(
            [python_exe, script_name],
            capture_output=True,
            text=True,
            timeout=90
        )
        elapsed = time.time() - start_time
        success = result.returncode == 0
        
        # Verify that asserts or print statements didn't report failure
        stdout = result.stdout
        stderr = result.stderr
        
        if "[FAIL]" in stdout or "Failed" in stdout or "Error:" in stdout:
            success = False
            
        print(f"[FINISHED] {script_name} in {elapsed:.2f}s (Exit code: {result.returncode})")
        return success, stdout, stderr
    except subprocess.TimeoutExpired:
        print(f"[TIMEOUT] Timeout expired for {script_name} after 90 seconds.")
        return False, "", "TIMEOUT EXPIRED"
    except Exception as e:
        print(f"[ERROR] Failed to execute {script_name}: {e}")
        return False, "", str(e)

def main():
    print("=" * 65)
    print("           VERIHIRE CENTRALIZED TEST RUNNER           ")
    print("=" * 65)
    
    test_scripts = [
        "test_extraction.py",
        "test_fraud.py",
        "test_job_match.py"
    ]
    
    results = {}
    
    for script in test_scripts:
        if not os.path.exists(script):
            print(f"[WARNING] Test script not found: {script}")
            results[script] = (False, "", f"File not found: {script}")
            continue
            
        success, stdout, stderr = run_test_script(script)
        results[script] = (success, stdout, stderr)
        print("-" * 65)
        
    print("\n" + "=" * 65)
    print("               FINAL TEST REPORT SUMMARY               ")
    print("=" * 65)
    
    all_passed = True
    for script, (success, stdout, stderr) in results.items():
        status_icon = "[ PASS ]" if success else "[ FAIL ]"
        if not success:
            all_passed = False
        print(f" {status_icon} | {script}")
        
    print("=" * 65)
    
    # Detailed output for failures
    if not all_passed:
        print("\n[DETAILED FAILURE LOGS]")
        print("=" * 65)
        for script, (success, stdout, stderr) in results.items():
            if not success:
                print(f"[FAIL] {script} Failed Details:")
                print("--- STDOUT ---")
                print(stdout)
                print("--- STDERR ---")
                print(stderr)
                print("=" * 65)
                
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
