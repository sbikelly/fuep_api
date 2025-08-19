import React, { useState } from 'react';
// import { ProfileUpdateRequestSchema, ProfileUpdateRequest } from '@fuep/types';

// Temporary type definition for development
interface ProfileUpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  state: string;
  lga: string;
  nextOfKinName: string;
  nextOfKinPhone: string;
  nextOfKinRelationship: string;
}

const Profile: React.FC = () => {
  const [formData, setFormData] = useState<ProfileUpdateRequest>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    state: '',
    lga: '',
    nextOfKinName: '',
    nextOfKinPhone: '',
    nextOfKinRelationship: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Gender is required';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.lga.trim()) {
      newErrors.lga = 'LGA is required';
    }

    if (!formData.nextOfKinName.trim()) {
      newErrors.nextOfKinName = 'Next of kin name is required';
    }

    if (!formData.nextOfKinPhone.trim()) {
      newErrors.nextOfKinPhone = 'Next of kin phone is required';
    }

    if (!formData.nextOfKinRelationship.trim()) {
      newErrors.nextOfKinRelationship = 'Next of kin relationship is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Profile updated successfully!');
        // Optionally refresh the form with new data
      } else {
        setErrorMessage(data.error || 'Failed to update profile');
      }
    } catch (error) {
      setErrorMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const nigerianStates = [
    'Abia',
    'Adamawa',
    'Akwa Ibom',
    'Anambra',
    'Bauchi',
    'Bayelsa',
    'Benue',
    'Borno',
    'Cross River',
    'Delta',
    'Ebonyi',
    'Edo',
    'Ekiti',
    'Enugu',
    'Federal Capital Territory',
    'Gombe',
    'Imo',
    'Jigawa',
    'Kaduna',
    'Kano',
    'Katsina',
    'Kebbi',
    'Kogi',
    'Kwara',
    'Lagos',
    'Nasarawa',
    'Niger',
    'Ogun',
    'Ondo',
    'Osun',
    'Oyo',
    'Plateau',
    'Rivers',
    'Sokoto',
    'Taraba',
    'Yobe',
    'Zamfara',
  ];

  return (
    <div className="container">
      <div className="page-header">
        <h1>Profile Management</h1>
        <p>
          Update your personal information and next of kin details. Please ensure all information is
          accurate and up-to-date.
        </p>
      </div>

      <div className="form-container">
        {successMessage && (
          <div className="alert alert-success">
            <strong>Success!</strong> {successMessage}
          </div>
        )}

        {errorMessage && (
          <div className="alert alert-error">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Personal Information</h2>
              <p className="card-subtitle">Your basic personal details and contact information</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="firstName" className="form-label">
                  First Name *
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.firstName ? 'error' : ''}`}
                  placeholder="Enter your first name"
                  disabled={isLoading}
                />
                {errors.firstName && <div className="form-error">{errors.firstName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="lastName" className="form-label">
                  Last Name *
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.lastName ? 'error' : ''}`}
                  placeholder="Enter your last name"
                  disabled={isLoading}
                />
                {errors.lastName && <div className="form-error">{errors.lastName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={`form-input ${errors.email ? 'error' : ''}`}
                  placeholder="Enter your email address"
                  disabled={isLoading}
                />
                {errors.email && <div className="form-error">{errors.email}</div>}
                <div className="form-help">This will be used for important communications</div>
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={`form-input ${errors.phone ? 'error' : ''}`}
                  placeholder="Enter your phone number"
                  disabled={isLoading}
                />
                {errors.phone && <div className="form-error">{errors.phone}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth" className="form-label">
                  Date of Birth *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={`form-input ${errors.dateOfBirth ? 'error' : ''}`}
                  disabled={isLoading}
                />
                {errors.dateOfBirth && <div className="form-error">{errors.dateOfBirth}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  Gender *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={`form-select ${errors.gender ? 'error' : ''}`}
                  disabled={isLoading}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                {errors.gender && <div className="form-error">{errors.gender}</div>}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Address Information</h2>
              <p className="card-subtitle">Your current residential address</p>
            </div>

            <div className="form-group">
              <label htmlFor="address" className="form-label">
                Residential Address *
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={`form-textarea ${errors.address ? 'error' : ''}`}
                placeholder="Enter your full residential address"
                disabled={isLoading}
                rows={3}
              />
              {errors.address && <div className="form-error">{errors.address}</div>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="state" className="form-label">
                  State *
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`form-select ${errors.state ? 'error' : ''}`}
                  disabled={isLoading}
                >
                  <option value="">Select state</option>
                  {nigerianStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && <div className="form-error">{errors.state}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="lga" className="form-label">
                  Local Government Area *
                </label>
                <input
                  type="text"
                  id="lga"
                  name="lga"
                  value={formData.lga}
                  onChange={handleInputChange}
                  className={`form-input ${errors.lga ? 'error' : ''}`}
                  placeholder="Enter your LGA"
                  disabled={isLoading}
                />
                {errors.lga && <div className="form-error">{errors.lga}</div>}
              </div>
            </div>
          </div>

          {/* Next of Kin Information */}
          <div className="card mb-6">
            <div className="card-header">
              <h2 className="card-title">Next of Kin Information</h2>
              <p className="card-subtitle">Emergency contact person details</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label htmlFor="nextOfKinName" className="form-label">
                  Next of Kin Name *
                </label>
                <input
                  type="text"
                  id="nextOfKinName"
                  name="nextOfKinName"
                  value={formData.nextOfKinName}
                  onChange={handleInputChange}
                  className={`form-input ${errors.nextOfKinName ? 'error' : ''}`}
                  placeholder="Enter next of kin full name"
                  disabled={isLoading}
                />
                {errors.nextOfKinName && <div className="form-error">{errors.nextOfKinName}</div>}
              </div>

              <div className="form-group">
                <label htmlFor="nextOfKinPhone" className="form-label">
                  Next of Kin Phone *
                </label>
                <input
                  type="tel"
                  id="nextOfKinPhone"
                  name="nextOfKinPhone"
                  value={formData.nextOfKinPhone}
                  onChange={handleInputChange}
                  className={`form-input ${errors.nextOfKinPhone ? 'error' : ''}`}
                  placeholder="Enter next of kin phone number"
                  disabled={isLoading}
                />
                {errors.nextOfKinPhone && <div className="form-error">{errors.nextOfKinPhone}</div>}
              </div>

              <div className="form-group md:col-span-2">
                <label htmlFor="nextOfKinRelationship" className="form-label">
                  Relationship to Next of Kin *
                </label>
                <input
                  type="text"
                  id="nextOfKinRelationship"
                  name="nextOfKinRelationship"
                  value={formData.nextOfKinRelationship}
                  onChange={handleInputChange}
                  className={`form-input ${errors.nextOfKinRelationship ? 'error' : ''}`}
                  placeholder="e.g., Father, Mother, Brother, Sister, Guardian"
                  disabled={isLoading}
                />
                {errors.nextOfKinRelationship && (
                  <div className="form-error">{errors.nextOfKinRelationship}</div>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-group">
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Updating Profile...
                </>
              ) : (
                'Update Profile'
              )}
            </button>
          </div>
        </form>

        {/* Additional Actions */}
        <div className="card mt-6">
          <div className="card-header">
            <h3 className="card-title">Additional Actions</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-primary mb-2">Change Password</h4>
              <p className="text-secondary mb-3">
                Update your account password for enhanced security
              </p>
              <a href="/change-password" className="btn btn-secondary">
                Change Password
              </a>
            </div>
            <div>
              <h4 className="text-primary mb-2">Document Upload</h4>
              <p className="text-secondary mb-3">Upload or update your supporting documents</p>
              <a href="/documents" className="btn btn-info">
                Manage Documents
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
