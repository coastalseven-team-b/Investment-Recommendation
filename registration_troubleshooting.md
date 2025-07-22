# Registration Troubleshooting Guide

This guide documents common issues encountered during user registration in web projects (React frontend + Flask backend), and their solutions. Save this for future reference!

---

## 1. Registration Fails Due to Port Conflict

### **Symptoms:**
- Registration (or any API call) fails in the browser.
- Backend server runs, but requests do not reach it.
- You may see errors like `ERR_CONNECTION_REFUSED` or timeouts.
- Backend is running on port **5000** (default for Flask).

### **Cause:**
- Port 5000 is often used by other macOS services (AirPlay, iTunes, etc.), causing conflicts.

### **Solution:**
- Change the backend port to something else (e.g., 5050 or 8000).
- Update the frontend proxy to match the new backend port.

#### **How to Change the Port:**
- In your Flask app (usually `app.py`):
  ```python
  if __name__ == "__main__":
      app.run(debug=True, port=5050)
  ```
- In your React frontend proxy (`src/setupProxy.js`):
  ```js
  createProxyMiddleware({
    target: 'http://localhost:5050',
    changeOrigin: true,
  })
  ```
- Restart both backend and frontend servers after making these changes.

---

## 2. Registration Fails Due to bcrypt/Password Hashing Issues

### **Symptoms:**
- Registration fails with errors related to password hashing.
- Errors like `ModuleNotFoundError: No module named 'passlib'` or `ImportError: cannot import name 'bcrypt'`.

### **Cause:**
- The backend uses `passlib.hash.bcrypt` for password hashing.
- The `passlib` library (which provides bcrypt) is not installed, or there is a version mismatch.

### **Solution:**
- Ensure `passlib` is installed in your backend environment:
  ```sh
  python3 -m pip install passlib
  ```
- If you use a requirements file, add `passlib` to it:
  ```
  passlib
  ```
- If you see issues with bcrypt specifically, you can also try:
  ```sh
  python3 -m pip install bcrypt
  ```
- Restart your backend after installing.

---

## Permanent Fixes & Best Practices

- **Always use a non-default port for your backend** (e.g., 5050, 8000, 8080) to avoid OS conflicts.
- **Add all dependencies to your `requirements.txt`** and use `pip install -r requirements.txt` when setting up a new environment.
- **After changing ports or installing packages, always restart your servers.**
- **Document your setup and common fixes** (like this file) for your future self and teammates.

---

**Keep this file handy for all your future projects!** 