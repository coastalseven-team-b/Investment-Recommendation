# Investment App Frontend: Complete Documentation (For Viva)

## 1. Overview

- **Project Type:** Investment Recommendation Web App (Frontend)
- **Main Purpose:** Helps users register, log in, upload bank data, get investment tips, and receive personalized investment recommendations.
- **Tech Stack:**  
  - **Language:** JavaScript (ES6+)
  - **Framework:** React (with React Router)
  - **UI Library:** Material UI (MUI)
  - **HTTP Client:** Axios
  - **Animation:** Framer Motion
  - **State Management:** React Hooks (useState, useEffect)
  - **Styling:** Material UI, custom CSS-in-JS, and some styled-components
  - **Other:** Proxy setup for API calls, JWT for authentication

---

## 2. Folder and File Structure

```
frontend/
  ├── public/
  │   └── index.html
  ├── src/
  │   ├── App.js
  │   ├── index.js
  │   ├── setupProxy.js
  │   ├── theme.js
  │   ├── components/
  │   │   └── NavBar.js
  │   └── pages/
  │       ├── BankUpload.js
  │       ├── Dashboard.js
  │       ├── Investment.js
  │       ├── Login.js
  │       ├── NotFound.js
  │       ├── Profile.js
  │       ├── Recommendation.js
  │       ├── Register.js
  │       ├── RiskProfile.js
  │       └── Tips.js
  ├── package.json
  └── package-lock.json
```

---

## 3. Key Libraries and Tools Used

- **React:** For building user interfaces with components.
- **Material UI (MUI):** For beautiful, responsive, and accessible UI components (Buttons, Cards, TextFields, Alerts, etc.).
- **Axios:** For making HTTP requests to the backend API.
- **Framer Motion:** For smooth animations and transitions.
- **React Router:** For navigation between pages (e.g., `/login`, `/dashboard`).
- **Styled-components:** For custom component styling (used in some files).
- **JWT (JSON Web Token):** For user authentication (token stored in localStorage).
- **Proxy Setup:** `setupProxy.js` to forward API requests to the backend during development.

---

## 4. How We Built It (Step-by-Step)

### a. Project Setup
- Used `create-react-app` to bootstrap the project.
- Installed dependencies:  
  ```
  npm install @mui/material @emotion/react @emotion/styled axios framer-motion react-router-dom styled-components
  ```
- Set up `setupProxy.js` to avoid CORS issues when calling the backend.

### b. UI Design
- Imported and used Material UI components for all forms, cards, buttons, alerts, etc.
- Used MUI’s theme system for consistent colors and dark mode.
- Used Framer Motion for page and card animations.
- Custom styles added with styled-components and inline styles.

### c. Routing
- All routes are defined in `App.js` using React Router.
- Example routes: `/login`, `/register`, `/dashboard`, `/profile`, `/recommendations`, `/bank-upload`, `/risk-profile`, `/tips`, and a catch-all for 404s.

---

## 5. Every Page and Component Explained

### App.js
- The main entry point for the app.
- Sets up all routes using `<Routes>` and `<Route>`.
- Handles which page to show for each URL.

### index.js
- Renders the `<App />` component into the root div in `index.html`.
- Wraps the app in Material UI’s theme provider.

### setupProxy.js
- Forwards `/api/*` requests to the backend server during development.

### theme.js
- Defines the custom Material UI theme (colors, typography, etc.).
- Used for consistent look and feel.

---

### components/NavBar.js
- The top navigation bar.
- Shows links to Dashboard, Bank Data, Investments, Recommendations, Tips, Profile, and Sign Out.
- Uses Material UI AppBar, Toolbar, and Button components.
- Responsive and styled for dark mode.

---

### pages/Register.js
- Registration form for new users.
- Uses Material UI TextFields, Button, Alert, and LinearProgress for password strength.
- Validates input (email, password, etc.).
- On successful registration, **redirects to the login page** (recently changed as per your request).
- Uses Axios to send registration data to `/api/register`.

### pages/Login.js
- Login form for existing users.
- Uses Material UI components.
- On successful login, checks if the user has completed the risk profile:
  - If yes, goes to Dashboard.
  - If no, goes to Risk Profile page.
- Stores JWT token in localStorage.

### pages/Dashboard.js
- Shows a summary of the user’s investment portfolio.
- Displays total balance, invested amount, returns, and available balance.
- Lists all investments in a table.
- Fetches data from `/api/profile` and `/api/investments`.

### pages/Profile.js
- Lets users view and edit their profile (name, email, risk level, investment goal, financial behavior).
- Lets users change their password.
- Uses styled-components for custom styling.
- Fetches and updates data via Axios.

### pages/BankUpload.js
- Lets users upload their bank statement (CSV file).
- Shows a table of transactions and detected financial behavior.
- Uses Material UI Table, Button, and Alert.
- Uploads file to `/api/transactions/upload`.

### pages/Investment.js
- Lets users add new investments.
- Shows a list of all investments.
- Validates input and updates the user’s virtual balance.
- Uses Material UI and Axios.

### pages/Recommendation.js
- Shows personalized investment recommendations.
- Checks if the user has completed their risk profile and uploaded bank data.
- Uses Material UI, Axios, and Framer Motion for UI and animations.

### pages/RiskProfile.js
- Questionnaire for users to determine their risk profile.
- Uses Material UI Radio buttons, Select, and Button.
- On submit, saves risk profile and investment goal.

### pages/Tips.js
- Shows investment tips and educational content.
- Simple static page using Material UI.

### pages/NotFound.js
- 404 page for undefined routes.

---

## 6. How We Used Material UI (MUI) in This Project

### a. Installing Material UI and Related Libraries
- We installed Material UI and its dependencies using the following command:
  ```bash
  npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
  ```
- This command adds:
  - `@mui/material`: The core Material UI component library.
  - `@emotion/react` and `@emotion/styled`: Required for styling Material UI components.
  - `@mui/icons-material`: For using Material UI's icon set.

### b. Importing and Using Material UI Components
- In each page/component, we imported only the MUI components we needed. For example, in the registration page:
  ```js
  import { Button, TextField, Card, Alert, Typography, LinearProgress } from '@mui/material';
  import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
  ```
- We used these components to build:
  - **Forms:** `TextField`, `Button`, `Alert`, `LinearProgress` (for password strength)
  - **Cards and Layouts:** `Card`, `Box`, `Typography`
  - **Navigation:** `AppBar`, `Toolbar`, `Button` (in NavBar)
  - **Tables:** `Table`, `TableRow`, `TableCell` (for displaying investments and transactions)
  - **Icons:** For visual cues and better UX

### c. Theming and Styling
- We created a custom theme in `src/theme.js` with both light and dark variants, inspired by modern Indian trading apps.
- The theme includes custom colors, gradients, spacing, and shadows.
- We wrapped the app in a theme provider in `index.js`:
  ```js
  import { ThemeProvider } from 'styled-components';
  import { darkTheme } from './theme';
  ...
  <ThemeProvider theme={darkTheme}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </ThemeProvider>
  ```
- We used the `sx` prop and theme variables for consistent styling, e.g.:
  ```js
  <Button variant="contained" color="secondary" sx={{ mt: 2, borderRadius: 2 }}>
    Create Account
  </Button>
  ```
- We also used Material UI's dark mode and responsive design features.

### d. Adapting Material UI to Our Project
- We customized MUI components to match our app's branding and UX needs:
  - Used gradients and custom colors from our theme.
  - Adjusted border radii, spacing, and shadows for a modern look.
  - Combined MUI with styled-components for advanced custom styling (e.g., in Profile page).
  - Used MUI's Alert and Typography for user feedback and headings.
  - Used MUI's Table components for displaying data in a clean, readable way.
- We animated MUI components with Framer Motion for smooth transitions.

### e. Example: Registration Page with Material UI
- The registration form uses:
  - `TextField` for input fields (name, email, password)
  - `Button` for submission
  - `Alert` for error messages
  - `LinearProgress` for password strength
  - `Card` for the form container
  - `PersonAddAlt1Icon` for a visual icon
- All components are styled with the theme and `sx` prop for a consistent look.

### f. Why We Chose Material UI
- Fast development with ready-to-use, accessible components
- Easy theming and customization
- Large icon set and responsive design out of the box
- Good documentation and community support

---

## 7. How We Used Framer Motion

- Added smooth animations to page transitions and cards.
- Used `motion.div` to animate opacity and position for a modern feel.

---

## 8. How We Used Axios

- For all HTTP requests to the backend (register, login, profile, investments, etc.).
- Handles errors and shows user-friendly messages.

---

## 9. How We Used React Router

- For navigation between pages.
- Used `useNavigate` to programmatically redirect users after actions (like registration or login).

---

## 10. How We Used Styled-components

- For custom styles in some components (like Profile).
- Allows for dynamic and theme-based styling.

---

## 11. Recent Changes (Today’s Work)

- **Changed registration flow:**  
  After successful registration, users are now redirected to the login page instead of the risk profile page.
- **Material UI usage:**  
  All forms and UI elements use Material UI for a professional look.
- **Beginner-friendly code:**  
  All logic is written using React hooks and simple, readable code.

---

## 12. How to Explain This in Your Viva

- “I built the frontend using React and Material UI for a modern, responsive UI.”
- “I used React Router for navigation and Axios for talking to the backend.”
- “All forms are validated, and user feedback is shown using Material UI Alerts.”
- “I used Framer Motion for smooth animations.”
- “I set up a proxy for API calls to avoid CORS issues.”
- “I wrote all the logic myself, using React hooks for state and effects.”
- “I made sure the registration flow is user-friendly: after registering, users are sent to the login page.”

---

## 13. How We Installed and Used Material UI

### a. Installing Material UI
- We installed Material UI and its dependencies using the following command:
  ```
  npm install @mui/material @emotion/react @emotion/styled @mui/icons-material
  ```
- This command adds Material UI core, icons, and the required emotion styling libraries to the project.

### b. Using Material UI Components
- We imported Material UI components at the top of each file, for example:
  ```js
  import { Button, TextField, Card, Alert, Typography, LinearProgress } from '@mui/material';
  import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
  ```
- We used these components to build forms, cards, navigation bars, alerts, and more.
- We used the `sx` prop and custom themes for styling, and wrapped the app in a theme provider for consistent look and feel.
- Example of a styled button:
  ```js
  <Button variant="contained" color="secondary" sx={{ mt: 2, borderRadius: 2 }}>
    Create Account
  </Button>
  ```
- We also used Material UI's dark mode and responsive design features.

---

## 7. How to Run the Project (Frontend & Backend)

### a. Running the Backend
1. **Navigate to the backend folder:**
   ```bash
   cd U7.1/backend
   ```
2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Set up your `.env` file** with your MongoDB URI and JWT secret (see earlier instructions).
4. **Start the backend server:**
   ```bash
   python3 app.py
   ```
   - The backend will run on port 5050 by default.

### b. Running the Frontend
1. **Navigate to the frontend folder:**
   ```bash
   cd U7.1/frontend
   ```
2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```
3. **Start the frontend development server:**
   ```bash
   npm start
   ```
   - The frontend will run on port 3000 by default and proxy API requests to the backend.

---

If you follow these steps, both the backend and frontend will be running and connected. You can now register, log in, and use all features of the app!

--- 