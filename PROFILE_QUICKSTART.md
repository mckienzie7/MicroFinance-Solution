# Profile Page - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Backend server running on `http://localhost:5000`
- Frontend server running on `http://localhost:5173`
- User account created and logged in

### Start the Application

#### 1. Start Backend
```bash
cd MicroFinance-Solution/BackEnd
python api/v1/app.py
```

#### 2. Start Frontend
```bash
cd MicroFinance-Solution/microfinance-frontend
npm run dev
```

#### 3. Access Profile Page
Navigate to: `http://localhost:5173/profile` (or your user dashboard profile link)

## ✨ Features Overview

### 1. View Profile
- See your profile picture, name, email
- View member since date
- Check verification status
- See admin badge (if applicable)

### 2. Update Personal Information
Click on any field and edit:
- Full Name
- Phone Number
- Gender (dropdown)
- Age
- Location
- Fayda ID
- Bio (multi-line)
- Interests
- Hobbies
- Preferences

Click **"Update Profile"** to save changes.

### 3. Upload Profile Picture
1. Click **"Choose File"** under Profile Picture section
2. Select an image (PNG, JPG, JPEG, GIF - max 5MB)
3. Preview appears automatically
4. Click **"Upload"** button
5. Wait for success message
6. Profile picture updates automatically

### 4. Upload ID Cards
1. Scroll to **"Identity Verification"** section
2. Upload ID Card Front:
   - Click "Choose File" under ID Card Front
   - Select front image
3. Upload ID Card Back:
   - Click "Choose File" under ID Card Back
   - Select back image
4. Click **"Upload ID Cards"** button
5. Wait for success message

### 5. Change Password
1. Click **"Change Password"** in Security section
2. Enter current password
3. Enter new password (min 8 characters)
4. Confirm new password
5. Click **"Save New Password"**
6. Form closes automatically on success

## 🎯 Quick Tips

### Validation Rules
- **Phone**: Use format like +251912345678
- **Age**: Must be 18-120 years
- **Password**: Minimum 8 characters
- **Images**: Max 5MB, PNG/JPG/JPEG only

### Common Actions
- **Reset Form**: Click "Reset Changes" to restore original values
- **Cancel Password Change**: Click "Cancel Password Change" to close form
- **View Errors**: Red messages show validation errors
- **View Success**: Green messages confirm successful operations

### Troubleshooting
- **Profile not loading**: Check if backend is running
- **Upload fails**: Verify file size and format
- **Update fails**: Check validation errors
- **Password change fails**: Verify current password is correct

## 📱 Mobile Usage
The profile page is fully responsive:
- Works on phones, tablets, and desktops
- Touch-friendly buttons and inputs
- Optimized layout for small screens

## 🔒 Security Notes
- All requests require authentication
- Passwords are securely hashed
- Files are validated server-side
- Session tokens expire after 24 hours

## 📊 Testing

### Test the Backend
```bash
cd MicroFinance-Solution
python test_profile_endpoints.py
```

This will verify:
- ✓ Login functionality
- ✓ Profile fetching
- ✓ Profile updates
- ✓ Password changes

### Manual Testing Checklist
- [ ] Load profile page
- [ ] View all profile information
- [ ] Update personal information
- [ ] Upload profile picture
- [ ] Upload ID card images
- [ ] Change password
- [ ] Reset form
- [ ] Check error messages
- [ ] Verify success messages

## 🎨 UI Components

### Profile Header
- Avatar (profile picture or initial)
- Full name
- Email address
- Member since date
- Verification badge
- Admin badge

### Profile Form
- Personal information fields
- Validation messages
- Reset and Update buttons
- Loading states

### File Upload Sections
- Profile picture upload
- ID card front upload
- ID card back upload
- Image previews
- Upload buttons

### Security Section
- Password change form
- Current password field
- New password field
- Confirm password field
- Save button

## 🔄 Workflow Example

### Complete Profile Setup
1. **Login** to your account
2. **Navigate** to Profile page
3. **Update** personal information:
   - Add full name
   - Add phone number
   - Select gender
   - Enter age
   - Add location
   - Write bio
4. **Upload** profile picture
5. **Upload** ID cards for verification
6. **Save** all changes
7. **Change** password if needed

## 📞 Support

### Common Issues

**Issue**: Profile not loading
**Solution**: 
- Check backend server is running
- Verify you're logged in
- Check browser console for errors

**Issue**: Upload fails
**Solution**:
- Check file size (max 5MB)
- Verify file format (PNG/JPG/JPEG)
- Check internet connection

**Issue**: Update fails
**Solution**:
- Check validation errors
- Verify all required fields
- Check phone number format

**Issue**: Password change fails
**Solution**:
- Verify current password is correct
- Check new password is at least 8 characters
- Ensure passwords match

## 🎓 Best Practices

1. **Keep Profile Updated**: Regular updates help with verification
2. **Use Real Information**: Accurate data speeds up loan processing
3. **Upload Clear ID Images**: High-quality images for faster verification
4. **Strong Passwords**: Use mix of letters, numbers, and symbols
5. **Regular Password Changes**: Update password periodically

## 📈 Next Steps

After completing your profile:
1. Wait for admin verification
2. Check verification status on profile
3. Apply for loans once verified
4. Keep profile information current
5. Update contact details if changed

---

**Need Help?** Contact support or check the full documentation in `PROFILE_FEATURES.md`
