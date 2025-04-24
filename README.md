# MicroFinance Solution
## A Comprehensive Microfinance Web and Mobile Application

MicroFinance Solution is a web and mobile application designed to provide microfinance services, enabling users to access financial resources efficiently.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [Docker Deployment](#docker-deployment)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)
- [License](#license)

## Features

- User authentication and profile management
- Loan application and approval system
- Payment tracking and transaction history
- Secure data encryption and session management
- Mobile-first design with Flutter
- Containerized deployment with Docker

## Technologies Used

### Backend (Flask)
- Flask for backend development
- SQLAlchemy for database interactions
- MySQL as the database
- bcrypt for password hashing
- Flask-JWT-Extended for authentication
- Docker for containerization

### Mobile (Flutter)
- Dart programming language
- Provider for state management
- Dio for API requests
- Shared Preferences for local storage
- Firebase for push notifications (if applicable)

## Installation

### Prerequisites

- Python 3.8 or higher
- MySQL server
- Flutter SDK
- Docker & Docker Compose
- Virtual Environment (recommended for Python)

## Backend Installation (Flask)

### 1. Create a Virtual Environment

```sh
python3 -m venv venv
```

Activate the virtual environment:
- **Windows:**
  ```sh
  venv\Scripts\activate
  ```
- **macOS/Linux:**
  ```sh
  source venv/bin/activate
  ```

### 2. Install Required Packages

```sh
pip install -r requirements.txt
```

### 3. Configure MySQL

Start MySQL and create the database:

```sql
CREATE DATABASE microfinance_db;
CREATE USER 'microfinance_user'@'localhost' IDENTIFIED BY 'securepassword';
GRANT ALL PRIVILEGES ON microfinance_db.* TO 'microfinance_user'@'localhost';
FLUSH PRIVILEGES;
```

### 4. Configure Flask Application

Update `config.py` with MySQL credentials:

```python
app.config['MYSQL_HOST'] = 'localhost'
app.config['MYSQL_USER'] = 'microfinance_user'
app.config['MYSQL_PASSWORD'] = 'securepassword'
app.config['MYSQL_DB'] = 'microfinance_db'
```

### 5. Run Flask Application

```sh
python3 -m app.v1.app
```

## Mobile Installation (Flutter)

### 1. Install Flutter SDK
Follow the official [Flutter installation guide](https://flutter.dev/docs/get-started/install).

### 2. Clone the Repository

```sh
git clone https://github.com/your-username/microfinance-solution.git
cd microfinance-solution/mobile
```

### 3. Install Dependencies

```sh
flutter pub get
```

### 4. Run the Application

For Android:
```sh
flutter run
```

For iOS:
```sh
flutter run --no-sound-null-safety
```

## Docker Deployment

### 1. Build and Run the Application with Docker

Ensure you have Docker and Docker Compose installed, then run:

```sh
docker-compose up --build
```

### 2. Stop the Containers

```sh
docker-compose down
```

### 3. Access the Application

- Flask API: `http://localhost:5000`
- MySQL: `localhost:3306`

## API Endpoints

Refer to `API_DOCS.md` for detailed API documentation.

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature-branch`)
3. Commit changes (`git commit -m "Added new feature"`)
4. Push to branch (`git push origin feature-branch`)
5. Open a Pull Request

## License

This project is licensed under the MIT License. See `LICENSE` for more details.

## Contact

For support or questions, contact:  
📧 Email: Michaelelsa12@gmail.com 
🔗 GitHub: [Michael Solomin](https://github.com/Mckienzie7)
