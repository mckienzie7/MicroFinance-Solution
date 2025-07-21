import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  LockClosedIcon,
  IdentificationIcon,
  CameraIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phoneNumber: '+251',
    password: '',
    confirmPassword: '',
    idCardFront: null,
    idCardBack: null
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState({ front: false, back: false });
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const frontFileRef = useRef(null);
  const backFileRef = useRef(null);
  
  const { register, isLoading, authError, isAuthenticated, role, clearAuthError } = useAuth();
  const navigate = useNavigate();

  const steps = [
    { id: 1, name: 'Personal Info', icon: UserIcon, description: 'Basic information' },
    { id: 2, name: 'ID Verification', icon: IdentificationIcon, description: 'Upload your Fayda' },
    { id: 3, name: 'Complete', icon: CheckCircleIcon, description: 'Finish registration' }
  ];

  useEffect(() => {
    clearAuthError();
    if (isAuthenticated) {
      const dashboardPath = role === 'admin' ? '/admin/dashboard' : '/user/dashboard';
      navigate(dashboardPath, { replace: true });
    }
  }, [isAuthenticated, navigate, role, clearAuthError]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleFileUpload = (file, type) => {
    if (file && file.type.startsWith('image/')) {
      setFormData({
        ...formData,
        [type]: file
      });
      setError('');
    } else {
      setError('Please upload a valid image file');
    }
  };

  const handleDrag = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive({ ...dragActive, [type]: true });
    } else if (e.type === "dragleave") {
      setDragActive({ ...dragActive, [type]: false });
    }
  };

  const handleDrop = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive({ ...dragActive, [type]: false });
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0], type);
    }
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phoneNumber || formData.phoneNumber === '+251') {
      setError('Phone number is required');
      return false;
    }
    if (!/^\+251\d{9}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      setError('Phone number must start with +251 followed by 9 digits');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.idCardFront || !formData.idCardBack) {
      setError('Please upload both front and back of your ID card');
      return false;
    }
    return true;
  };

  const nextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    
    setError('');
    setCurrentStep(currentStep + 1);
  };

  const prevStep = () => {
    setCurrentStep(currentStep - 1);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('username', formData.username);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('password', formData.password);
      formDataToSend.append('fullName', formData.fullName);
      formDataToSend.append('phoneNumber', formData.phoneNumber);
      formDataToSend.append('admin', 'False');
      
      if (formData.idCardFront) {
        formDataToSend.append('idCardFront', formData.idCardFront);
      }
      if (formData.idCardBack) {
        formDataToSend.append('idCardBack', formData.idCardBack);
      }

      await register(formDataToSend, true);
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div className={`flex items-center justify-center w-16 h-16 rounded-full border-3 transition-all duration-500 ${
              currentStep >= step.id 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 border-transparent text-white shadow-lg transform scale-110' 
                : currentStep === step.id - 1
                  ? 'border-blue-300 text-blue-500 bg-blue-50'
                  : 'border-gray-300 text-gray-400 bg-white'
            }`}>
              <step.icon className="w-8 h-8" />
            </div>
            <div className="mt-3 text-center">
              <p className={`text-sm font-semibold ${currentStep >= step.id ? 'text-blue-600' : 'text-gray-500'}`}>
                {step.name}
              </p>
              <p className="text-xs text-gray-400 mt-1">{step.description}</p>
            </div>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-24 h-1 mx-6 transition-all duration-500 ${
              currentStep > step.id ? 'bg-gradient-to-r from-blue-500 to-purple-600' : 'bg-gray-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderPersonalInfoStep = () => (
    <div className="space-y-8">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <SparklesIcon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Personal Information
        </h3>
        <p className="text-gray-600 mt-3 text-lg">Tell us about yourself to get started</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Full Name</label>
          <div className="relative group">
            <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              name="fullName"
              type="text"
              required
              value={formData.fullName}
              onChange={handleChange}
              className="pl-12 w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="Enter your full name"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Username</label>
          <div className="relative group">
            <UserIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              name="username"
              type="text"
              required
              value={formData.username}
              onChange={handleChange}
              className="pl-12 w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="Choose a username"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Email Address</label>
          <div className="relative group">
            <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="pl-12 w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="Enter your email"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Phone Number</label>
          <div className="relative group">
            <PhoneIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              name="phoneNumber"
              type="tel"
              required
              value={formData.phoneNumber}
              onChange={handleChange}
              className="pl-12 w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="e.g., +251912345678"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Password</label>
          <div className="relative group">
            <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              name="password"
              type={showPassword ? "text" : "password"}
              required
              value={formData.password}
              onChange={handleChange}
              className="pl-12 pr-12 w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-gray-700">Confirm Password</label>
          <div className="relative group">
            <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              className="pl-12 pr-12 w-full px-4 py-4 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderIDUploadStep = () => (
    <div className="space-y-10">
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheckIcon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          ID Verification
        </h3>
        <p className="text-gray-600 mt-3 text-lg">Upload both sides of your Ethiopian ID (Fayda)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Front ID Upload */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="w-6 h-6 text-blue-600" />
            <h4 className="text-xl font-bold text-gray-900">Front Side</h4>
          </div>
          <div
            className={`relative border-3 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer ${
              dragActive.front 
                ? 'border-blue-500 bg-blue-50 scale-105' 
                : formData.idCardFront 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={(e) => handleDrag(e, 'front')}
            onDragLeave={(e) => handleDrag(e, 'front')}
            onDragOver={(e) => handleDrag(e, 'front')}
            onDrop={(e) => handleDrop(e, 'front')}
            onClick={() => frontFileRef.current?.click()}
          >
            <input
              ref={frontFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files[0], 'idCardFront')}
              className="hidden"
            />
            
            {formData.idCardFront ? (
              <div className="space-y-6">
                <img
                  src={URL.createObjectURL(formData.idCardFront)}
                  alt="ID Front"
                  className="w-full h-40 object-cover rounded-2xl shadow-lg"
                />
                <div className="flex items-center justify-center text-green-600">
                  <CheckCircleIcon className="w-6 h-6 mr-3" />
                  <span className="font-semibold text-lg">Front uploaded successfully</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    frontFileRef.current?.click();
                  }}
                  className="px-6 py-2 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-xl font-semibold text-gray-900 mb-2">Upload Front Side</p>
                  <p className="text-gray-500">Drag and drop or click to browse</p>
                  <p className="text-sm text-gray-400 mt-2">JPG, PNG up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back ID Upload */}
        <div className="space-y-6">
          <div className="flex items-center space-x-3">
            <DocumentIcon className="w-6 h-6 text-purple-600" />
            <h4 className="text-xl font-bold text-gray-900">Back Side</h4>
          </div>
          <div
            className={`relative border-3 border-dashed rounded-3xl p-10 text-center transition-all duration-300 cursor-pointer ${
              dragActive.back 
                ? 'border-purple-500 bg-purple-50 scale-105' 
                : formData.idCardBack 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
            }`}
            onDragEnter={(e) => handleDrag(e, 'back')}
            onDragLeave={(e) => handleDrag(e, 'back')}
            onDragOver={(e) => handleDrag(e, 'back')}
            onDrop={(e) => handleDrop(e, 'back')}
            onClick={() => backFileRef.current?.click()}
          >
            <input
              ref={backFileRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleFileUpload(e.target.files[0], 'idCardBack')}
              className="hidden"
            />
            
            {formData.idCardBack ? (
              <div className="space-y-6">
                <img
                  src={URL.createObjectURL(formData.idCardBack)}
                  alt="ID Back"
                  className="w-full h-40 object-cover rounded-2xl shadow-lg"
                />
                <div className="flex items-center justify-center text-green-600">
                  <CheckCircleIcon className="w-6 h-6 mr-3" />
                  <span className="font-semibold text-lg">Back uploaded successfully</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    backFileRef.current?.click();
                  }}
                  className="px-6 py-2 bg-purple-100 text-purple-700 rounded-xl hover:bg-purple-200 transition-colors font-medium"
                >
                  Change Image
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                <CloudArrowUpIcon className="w-16 h-16 text-gray-400 mx-auto" />
                <div>
                  <p className="text-xl font-semibold text-gray-900 mb-2">Upload Back Side</p>
                  <p className="text-gray-500">Drag and drop or click to browse</p>
                  <p className="text-sm text-gray-400 mt-2">JPG, PNG up to 10MB</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-start">
          <IdentificationIcon className="w-8 h-8 text-blue-600 mt-1 mr-4" />
          <div>
            <h5 className="font-bold text-blue-900 text-lg mb-2">ID Requirements</h5>
            <ul className="text-blue-700 space-y-2">
              <li className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Clear, high-quality images
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                All text must be readable
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                No glare or shadows
              </li>
              <li className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Valid Ethiopian National ID (Fayda)
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="text-center space-y-8">
      <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto">
        <CheckCircleIcon className="w-12 h-12 text-white" />
      </div>
      <div>
        <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Ready to Complete!
        </h3>
        <p className="text-gray-600 mt-3 text-lg">Review your information and finish registration</p>
      </div>
      
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 text-left max-w-md mx-auto">
        <h4 className="font-bold text-gray-900 mb-6 text-center text-xl">Registration Summary</h4>
        <div className="space-y-4">
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Full Name:</span>
            <span className="font-semibold text-gray-900">{formData.fullName}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Email:</span>
            <span className="font-semibold text-gray-900">{formData.email}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-200">
            <span className="text-gray-600 font-medium">Phone:</span>
            <span className="font-semibold text-gray-900">{formData.phoneNumber}</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-600 font-medium">ID Verification:</span>
            <span className="font-semibold text-green-600 flex items-center">
              <CheckCircleIcon className="w-4 h-4 mr-1" />
              Complete
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircleIcon className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-green-600 mb-4">Registration Successful!</h2>
          <p className="text-gray-700 leading-relaxed">
            Thank you for registering with MicroFinance! A verification email has been sent to your email address. 
            Please check your inbox and follow the instructions to complete your registration.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center mt-8 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold"
          >
            Go to Login
            <ArrowRightIcon className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Join MicroFinance
          </h1>
          <p className="text-xl text-gray-600">
            Create your account and start your financial journey
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-12">
          {renderStepIndicator()}

          {(error || authError) && (
            <div className="mb-8 bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center">
              <ExclamationTriangleIcon className="w-6 h-6 mr-3" />
              <span className="font-medium">{error || authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderPersonalInfoStep()}
            {currentStep === 2 && renderIDUploadStep()}
            {currentStep === 3 && renderCompleteStep()}

            <div className="flex justify-between items-center mt-12">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="flex items-center px-8 py-4 border-2 border-gray-300 text-gray-700 rounded-2xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-semibold"
                >
                  <ArrowLeftIcon className="w-5 h-5 mr-2" />
                  Previous
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg"
                >
                  Next Step
                  <ArrowRightIcon className="w-5 h-5 ml-2" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || isLoading}
                  className="flex items-center px-10 py-4 bg-gradient-to-r from-green-500 to-blue-600 text-white rounded-2xl hover:from-green-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 font-semibold shadow-lg"
                >
                  {loading || isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Complete Registration
                      <CheckCircleIcon className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              )}
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-blue-600 hover:text-blue-500 transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;