#!/usr/bin/env python3
"""
Test script to verify profile endpoints are working
"""
import requests
import json

BASE_URL = "http://localhost:5000/api/v1"

def test_profile_endpoints():
    """Test profile-related endpoints"""
    
    print("=" * 60)
    print("Testing Profile Endpoints")
    print("=" * 60)
    
    # Test 1: Login to get session
    print("\n1. Testing Login...")
    login_data = {
        "email": "test@example.com",
        "password": "testpassword"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/users/login", json=login_data)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            session_id = data.get('session_id')
            user_id = data.get('id')
            print(f"   ✓ Login successful")
            print(f"   User ID: {user_id}")
            print(f"   Session ID: {session_id[:20]}...")
            
            # Test 2: Get user profile
            print("\n2. Testing Get Profile...")
            headers = {"Authorization": f"Bearer {session_id}"}
            response = requests.get(f"{BASE_URL}/users/{user_id}/profile", headers=headers)
            print(f"   Status: {response.status_code}")
            
            if response.status_code == 200:
                profile = response.json()
                print(f"   ✓ Profile fetched successfully")
                print(f"   Username: {profile.get('username')}")
                print(f"   Email: {profile.get('email')}")
                print(f"   Full Name: {profile.get('fullname')}")
                
                # Test 3: Update profile
                print("\n3. Testing Update Profile...")
                update_data = {
                    "fullname": "Updated Test User",
                    "bio": "This is a test bio",
                    "location": "Test City",
                    "gender": "Male",
                    "age": 25,
                    "interests": "Testing, Development",
                    "hobbies": "Coding, Reading",
                    "preferences": "Dark mode"
                }
                
                response = requests.put(
                    f"{BASE_URL}/users/{user_id}",
                    json=update_data,
                    headers=headers
                )
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"   ✓ Profile updated successfully")
                    updated_profile = response.json()
                    print(f"   Updated Full Name: {updated_profile.get('fullname')}")
                    print(f"   Updated Bio: {updated_profile.get('bio')}")
                else:
                    print(f"   ✗ Failed to update profile")
                    print(f"   Error: {response.text}")
                
                # Test 4: Change password
                print("\n4. Testing Change Password...")
                password_data = {
                    "current_password": "testpassword",
                    "new_password": "newtestpassword"
                }
                
                response = requests.put(
                    f"{BASE_URL}/users/{user_id}/change-password",
                    json=password_data,
                    headers=headers
                )
                print(f"   Status: {response.status_code}")
                
                if response.status_code == 200:
                    print(f"   ✓ Password changed successfully")
                    
                    # Change it back
                    password_data = {
                        "current_password": "newtestpassword",
                        "new_password": "testpassword"
                    }
                    requests.put(
                        f"{BASE_URL}/users/{user_id}/change-password",
                        json=password_data,
                        headers=headers
                    )
                    print(f"   ✓ Password restored")
                else:
                    print(f"   ✗ Failed to change password")
                    print(f"   Error: {response.text}")
                    
            else:
                print(f"   ✗ Failed to fetch profile")
                print(f"   Error: {response.text}")
        else:
            print(f"   ✗ Login failed")
            print(f"   Error: {response.text}")
            print("\n   Note: Make sure you have a test user with:")
            print("   Email: test@example.com")
            print("   Password: testpassword")
            
    except requests.exceptions.ConnectionError:
        print("   ✗ Connection Error: Backend server is not running")
        print("   Please start the backend server first")
    except Exception as e:
        print(f"   ✗ Error: {str(e)}")
    
    print("\n" + "=" * 60)
    print("Test Complete")
    print("=" * 60)

if __name__ == "__main__":
    test_profile_endpoints()
