# Profile Page - Complete Feature Documentation

## Overview
The Profile page has been fully enhanced with comprehensive functionality for user profile management, including personal information updates, profile picture uploads, ID card verification, and password management.

## Frontend Features (Profile.jsx)

### 1. **Profile Data Fetching**
- Automatically fetches complete user profile on page load
- Displays loading spinner during data fetch
- Handles errors gracefully with user-friendly messages

### 2. **Personal Information Management**
Users can view and update the following fields:

#### Read-Only Fields:
- **Username** - Cannot be changed after registration
- **Email** - Cannot be changed after registration

#### Editable Fields:
- **Full Name** (Required) - User's complete name
- **Phone Number** - With validation for format (+251912345678)
- **Gender** - Dropdown selection (Male/Female/Other)
- **Age** - Number input with validation (18-120 years)
- **Location** - City, Country information
- **Fayda ID** - User's Fayda identification number
- **Bio** - Multi-line text area for personal description
- **Interests** - Comma-separated interests
- **Hobbies** - User's hobbies and activities
- **Preferences** - User preferences and settings

### 3. **Profile Picture Upload**
- Upload profile picture with preview
- Supported formats: PNG, JPG, JPEG, GIF
- Maximum file size: 5MB
- Real-time preview before upload
- Automatic refresh after successful upload
- Displays current profile picture in header

### 4. **ID Card Verification**
- Upload front and back images of ID card
- Supported formats: PNG, JPG, JPEG
- Maximum file size: 5MB per image
- Preview images before upload
- Can upload one or both sides
- Separate upload for each side

### 5. **Password Management**
- Secure password change functionality
- Requires current password verification
- New password validation (minimum 8 characters)
- Password confirmation matching
- Auto-close form after successful change
- Clear error messages for failed attempts

### 6. **User Interface Features**
- **Profile Header**: Displays user avatar, name, email, and member since date
- **Verification Badge**: Shows verified status if user is verified
- **Admin Badge**: Displays admin role if applicable
- **Loading States**: Shows spinners during async operations
- **Success Messages**: Green alerts for successful operations
- **Error Messages**: Red alerts for failed operations
- **Form Validation**: Real-time validation with error messages
- **Reset Button**: Restore original values before saving
- **Responsive Design**: Works on all screen sizes

## Backend API Endpoints

### 1. **GET /users/{user_id}/profile**
Fetches complete user profile including image URLs

**Response:**
```json
{
  "id": "user-id",
  "username": "johndoe",
  "email": "john@example.com",
  "fullname": "John Doe",
  "phone_number": "+251912345678",
  "bio": "Software developer",
  "location": "Addis Ababa, Ethiopia",
  "gender": "Male",
  "age": 25,
  "interests": "Technology, Finance",
  "hobbies": "Reading, Coding",
  "preferences": "Dark mode",
  "fayda_id": "FD123456",
  "profile_picture_url": "/static/profile_pictures/uuid.jpg",
  "id_card_front_url": "/static/id_cards/front/uuid.jpg",
  "id_card_back_url": "/static/id_cards/back/uuid.jpg",
  "is_verified": true,
  "admin": false,
  "created_at": "2024-01-01T00:00:00",
  "updated_at": "2024-01-15T10:30:00"
}
```

### 2. **PUT /users/{user_id}**
Updates user profile information

**Request Body:**
```json
{
  "fullname": "John Doe",
  "phone_number": "+251912345678",
  "bio": "Software developer",
  "location": "Addis Ababa",
  "gender": "Male",
  "age": 25,
  "interests": "Technology, Finance",
  "hobbies": "Reading, Coding",
  "preferences": "Dark mode",
  "fayda_id": "FD123456"
}
```

**Protected Fields** (Cannot be updated):
- id
- email
- username
- created_at
- updated_at
- password
- session_id
- reset_token

### 3. **PUT /users/{user_id}/change-password**
Changes user password

**Request Body:**
```json
{
  "current_password": "oldpassword",
  "new_password": "newpassword"
}
```

**Response:**
```json
{
  "message": "Password changed successfully"
}
```

### 4. **POST /users/{user_id}/profile-picture**
Uploads user profile picture

**Request:** Multipart form data
- Field name: `profile_picture`
- Allowed types: PNG, JPG, JPEG, GIF
- Max size: 5MB

**Response:**
```json
{
  "message": "Profile picture updated successfully",
  "profile_picture_url": "/static/profile_pictures/uuid.jpg"
}
```

### 5. **POST /users/{user_id}/id-card-front**
Uploads ID card front image

**Request:** Multipart form data
- Field name: `id_card_front`
- Allowed types: PNG, JPG, JPEG
- Max size: 5MB

**Response:**
```json
{
  "message": "ID card front updated successfully",
  "id_card_front_url": "/static/id_cards/front/uuid.jpg"
}
```

### 6. **POST /users/{user_id}/id-card-back**
Uploads ID card back image

**Request:** Multipart form data
- Field name: `id_card_back`
- Allowed types: PNG, JPG, JPEG
- Max size: 5MB

**Response:**
```json
{
  "message": "ID card back updated successfully",
  "id_card_back_url": "/static/id_cards/back/uuid.jpg"
}
```

### 7. **GET /users/{user_id}/profile-picture/download**
Downloads user's profile picture

### 8. **GET /users/{user_id}/id-card-front/download**
Downloads ID card front image

### 9. **GET /users/{user_id}/id-card-back/download**
Downloads ID card back image

## Database Schema

The User model includes the following fields:

```python
class User(BaseModel, Base):
    __tablename__ = "users"
    
    # Basic Information
    fullname = Column(String(50), nullable=False)
    phone_number = Column(String(20))
    username = Column(String(80), unique=True, nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password = Column(String(128), nullable=False)
    
    # Profile Information
    bio = Column(Text)
    gender = Column(String(10))
    age = Column(Integer)
    interests = Column(String(255))
    location = Column(String(100))
    hobbies = Column(String(255))
    preferences = Column(String(255))
    
    # File Paths
    profile_picture_path = Column(String(255))
    id_card_front_path = Column(String(255))
    id_card_back_path = Column(String(255))
    fayda_document_path = Column(String(255))  # Legacy
    
    # Verification & Admin
    fayda_id = Column(String(50))
    admin = Column(Boolean, nullable=True, default=False)
    is_verified = Column(Boolean, default=False)
    verification_token = Column(String(255))
    
    # Session Management
    session_id = Column(String(250))
    session_expiration = Column(DateTime)
    reset_token = Column(String(250))
```

## Validation Rules

### Frontend Validation:
1. **Phone Number**: Must match pattern `^\+?[0-9]{10,15}$`
2. **Age**: Must be between 18 and 120
3. **Password**: Minimum 8 characters
4. **Password Confirmation**: Must match new password
5. **File Type**: Only allowed image formats
6. **File Size**: Maximum 5MB per file

### Backend Validation:
1. **Protected Fields**: Cannot update id, email, username, etc.
2. **Password Verification**: Current password must be correct
3. **File Type Validation**: Server-side file type checking
4. **Required Fields**: Enforced at database level

## Security Features

1. **Session-Based Authentication**: All requests require valid session token
2. **Password Hashing**: Passwords stored using bcrypt
3. **File Upload Security**: 
   - File type validation
   - File size limits
   - Unique filename generation (UUID)
   - Secure file storage
4. **Protected Routes**: Profile endpoints require authentication
5. **Input Sanitization**: All user inputs are validated

## Error Handling

### Frontend:
- Network errors displayed to user
- Validation errors shown inline
- Success messages auto-clear
- Loading states prevent duplicate submissions

### Backend:
- 400: Bad Request (invalid data)
- 401: Unauthorized (invalid credentials)
- 403: Forbidden (insufficient permissions)
- 404: Not Found (user doesn't exist)
- 500: Internal Server Error

## Testing

Run the test script to verify all endpoints:

```bash
python test_profile_endpoints.py
```

This will test:
- User login
- Profile fetching
- Profile updates
- Password changes

## Configuration

### Frontend (.env):
```
VITE_API_URL=http://localhost:5000/api/v1
```

### Backend:
- File uploads stored in `BackEnd/static/`
- Profile pictures: `static/profile_pictures/`
- ID cards: `static/id_cards/front/` and `static/id_cards/back/`

## Usage Example

### Updating Profile:
```javascript
const updateData = {
  fullname: "John Doe",
  phone_number: "+251912345678",
  bio: "Software developer",
  location: "Addis Ababa",
  gender: "Male",
  age: 25
};

const response = await apiClient.put(`/users/${userId}`, updateData);
```

### Uploading Profile Picture:
```javascript
const formData = new FormData();
formData.append('profile_picture', file);

const response = await apiClient.post(
  `/users/${userId}/profile-picture`,
  formData,
  { headers: { 'Content-Type': 'multipart/form-data' } }
);
```

### Changing Password:
```javascript
const passwordData = {
  current_password: "oldpassword",
  new_password: "newpassword"
};

const response = await apiClient.put(
  `/users/${userId}/change-password`,
  passwordData
);
```

## Future Enhancements

Potential features to add:
1. Email change with verification
2. Two-factor authentication
3. Profile visibility settings
4. Social media links
5. Profile completion percentage
6. Activity log
7. Account deletion
8. Export profile data
9. Profile themes
10. Notification preferences

## Support

For issues or questions:
1. Check error messages in browser console
2. Verify backend server is running
3. Check API endpoint URLs
4. Verify authentication token
5. Review validation rules

---

**Last Updated**: January 2025
**Version**: 1.0.0
