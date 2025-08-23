import { useState } from 'react';
import { Fragment as _Fragment, jsx as _jsx, jsxs as _jsxs } from 'react/jsx-runtime';
const Profile = () => {
  const [formData, setFormData] = useState({
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
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };
  const validateForm = () => {
    const newErrors = {};
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
  const handleSubmit = async (e) => {
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
  return _jsxs('div', {
    className: 'container',
    children: [
      _jsxs('div', {
        className: 'page-header',
        children: [
          _jsx('h1', { children: 'Profile Management' }),
          _jsx('p', {
            children:
              'Update your personal information and next of kin details. Please ensure all information is accurate and up-to-date.',
          }),
        ],
      }),
      _jsxs('div', {
        className: 'form-container',
        children: [
          successMessage &&
            _jsxs('div', {
              className: 'alert alert-success',
              children: [_jsx('strong', { children: 'Success!' }), ' ', successMessage],
            }),
          errorMessage &&
            _jsxs('div', {
              className: 'alert alert-error',
              children: [_jsx('strong', { children: 'Error:' }), ' ', errorMessage],
            }),
          _jsxs('form', {
            onSubmit: handleSubmit,
            children: [
              _jsxs('div', {
                className: 'card mb-6',
                children: [
                  _jsxs('div', {
                    className: 'card-header',
                    children: [
                      _jsx('h2', { className: 'card-title', children: 'Personal Information' }),
                      _jsx('p', {
                        className: 'card-subtitle',
                        children: 'Your basic personal details and contact information',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
                    children: [
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'firstName',
                            className: 'form-label',
                            children: 'First Name *',
                          }),
                          _jsx('input', {
                            type: 'text',
                            id: 'firstName',
                            name: 'firstName',
                            value: formData.firstName,
                            onChange: handleInputChange,
                            className: `form-input ${errors.firstName ? 'error' : ''}`,
                            placeholder: 'Enter your first name',
                            disabled: isLoading,
                          }),
                          errors.firstName &&
                            _jsx('div', { className: 'form-error', children: errors.firstName }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'lastName',
                            className: 'form-label',
                            children: 'Last Name *',
                          }),
                          _jsx('input', {
                            type: 'text',
                            id: 'lastName',
                            name: 'lastName',
                            value: formData.lastName,
                            onChange: handleInputChange,
                            className: `form-input ${errors.lastName ? 'error' : ''}`,
                            placeholder: 'Enter your last name',
                            disabled: isLoading,
                          }),
                          errors.lastName &&
                            _jsx('div', { className: 'form-error', children: errors.lastName }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'email',
                            className: 'form-label',
                            children: 'Email Address *',
                          }),
                          _jsx('input', {
                            type: 'email',
                            id: 'email',
                            name: 'email',
                            value: formData.email,
                            onChange: handleInputChange,
                            className: `form-input ${errors.email ? 'error' : ''}`,
                            placeholder: 'Enter your email address',
                            disabled: isLoading,
                          }),
                          errors.email &&
                            _jsx('div', { className: 'form-error', children: errors.email }),
                          _jsx('div', {
                            className: 'form-help',
                            children: 'This will be used for important communications',
                          }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'phone',
                            className: 'form-label',
                            children: 'Phone Number *',
                          }),
                          _jsx('input', {
                            type: 'tel',
                            id: 'phone',
                            name: 'phone',
                            value: formData.phone,
                            onChange: handleInputChange,
                            className: `form-input ${errors.phone ? 'error' : ''}`,
                            placeholder: 'Enter your phone number',
                            disabled: isLoading,
                          }),
                          errors.phone &&
                            _jsx('div', { className: 'form-error', children: errors.phone }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'dateOfBirth',
                            className: 'form-label',
                            children: 'Date of Birth *',
                          }),
                          _jsx('input', {
                            type: 'date',
                            id: 'dateOfBirth',
                            name: 'dateOfBirth',
                            value: formData.dateOfBirth,
                            onChange: handleInputChange,
                            className: `form-input ${errors.dateOfBirth ? 'error' : ''}`,
                            disabled: isLoading,
                          }),
                          errors.dateOfBirth &&
                            _jsx('div', { className: 'form-error', children: errors.dateOfBirth }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'gender',
                            className: 'form-label',
                            children: 'Gender *',
                          }),
                          _jsxs('select', {
                            id: 'gender',
                            name: 'gender',
                            value: formData.gender,
                            onChange: handleInputChange,
                            className: `form-select ${errors.gender ? 'error' : ''}`,
                            disabled: isLoading,
                            children: [
                              _jsx('option', { value: '', children: 'Select gender' }),
                              _jsx('option', { value: 'male', children: 'Male' }),
                              _jsx('option', { value: 'female', children: 'Female' }),
                            ],
                          }),
                          errors.gender &&
                            _jsx('div', { className: 'form-error', children: errors.gender }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'card mb-6',
                children: [
                  _jsxs('div', {
                    className: 'card-header',
                    children: [
                      _jsx('h2', { className: 'card-title', children: 'Address Information' }),
                      _jsx('p', {
                        className: 'card-subtitle',
                        children: 'Your current residential address',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'form-group',
                    children: [
                      _jsx('label', {
                        htmlFor: 'address',
                        className: 'form-label',
                        children: 'Residential Address *',
                      }),
                      _jsx('textarea', {
                        id: 'address',
                        name: 'address',
                        value: formData.address,
                        onChange: handleInputChange,
                        className: `form-textarea ${errors.address ? 'error' : ''}`,
                        placeholder: 'Enter your full residential address',
                        disabled: isLoading,
                        rows: 3,
                      }),
                      errors.address &&
                        _jsx('div', { className: 'form-error', children: errors.address }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
                    children: [
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'state',
                            className: 'form-label',
                            children: 'State *',
                          }),
                          _jsxs('select', {
                            id: 'state',
                            name: 'state',
                            value: formData.state,
                            onChange: handleInputChange,
                            className: `form-select ${errors.state ? 'error' : ''}`,
                            disabled: isLoading,
                            children: [
                              _jsx('option', { value: '', children: 'Select state' }),
                              nigerianStates.map((state) =>
                                _jsx('option', { value: state, children: state }, state)
                              ),
                            ],
                          }),
                          errors.state &&
                            _jsx('div', { className: 'form-error', children: errors.state }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'lga',
                            className: 'form-label',
                            children: 'Local Government Area *',
                          }),
                          _jsx('input', {
                            type: 'text',
                            id: 'lga',
                            name: 'lga',
                            value: formData.lga,
                            onChange: handleInputChange,
                            className: `form-input ${errors.lga ? 'error' : ''}`,
                            placeholder: 'Enter your LGA',
                            disabled: isLoading,
                          }),
                          errors.lga &&
                            _jsx('div', { className: 'form-error', children: errors.lga }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs('div', {
                className: 'card mb-6',
                children: [
                  _jsxs('div', {
                    className: 'card-header',
                    children: [
                      _jsx('h2', { className: 'card-title', children: 'Next of Kin Information' }),
                      _jsx('p', {
                        className: 'card-subtitle',
                        children: 'Emergency contact person details',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
                    children: [
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'nextOfKinName',
                            className: 'form-label',
                            children: 'Next of Kin Name *',
                          }),
                          _jsx('input', {
                            type: 'text',
                            id: 'nextOfKinName',
                            name: 'nextOfKinName',
                            value: formData.nextOfKinName,
                            onChange: handleInputChange,
                            className: `form-input ${errors.nextOfKinName ? 'error' : ''}`,
                            placeholder: 'Enter next of kin full name',
                            disabled: isLoading,
                          }),
                          errors.nextOfKinName &&
                            _jsx('div', {
                              className: 'form-error',
                              children: errors.nextOfKinName,
                            }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group',
                        children: [
                          _jsx('label', {
                            htmlFor: 'nextOfKinPhone',
                            className: 'form-label',
                            children: 'Next of Kin Phone *',
                          }),
                          _jsx('input', {
                            type: 'tel',
                            id: 'nextOfKinPhone',
                            name: 'nextOfKinPhone',
                            value: formData.nextOfKinPhone,
                            onChange: handleInputChange,
                            className: `form-input ${errors.nextOfKinPhone ? 'error' : ''}`,
                            placeholder: 'Enter next of kin phone number',
                            disabled: isLoading,
                          }),
                          errors.nextOfKinPhone &&
                            _jsx('div', {
                              className: 'form-error',
                              children: errors.nextOfKinPhone,
                            }),
                        ],
                      }),
                      _jsxs('div', {
                        className: 'form-group md:col-span-2',
                        children: [
                          _jsx('label', {
                            htmlFor: 'nextOfKinRelationship',
                            className: 'form-label',
                            children: 'Relationship to Next of Kin *',
                          }),
                          _jsx('input', {
                            type: 'text',
                            id: 'nextOfKinRelationship',
                            name: 'nextOfKinRelationship',
                            value: formData.nextOfKinRelationship,
                            onChange: handleInputChange,
                            className: `form-input ${errors.nextOfKinRelationship ? 'error' : ''}`,
                            placeholder: 'e.g., Father, Mother, Brother, Sister, Guardian',
                            disabled: isLoading,
                          }),
                          errors.nextOfKinRelationship &&
                            _jsx('div', {
                              className: 'form-error',
                              children: errors.nextOfKinRelationship,
                            }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              _jsx('div', {
                className: 'form-group',
                children: _jsx('button', {
                  type: 'submit',
                  className: 'btn btn-primary btn-full btn-lg',
                  disabled: isLoading,
                  children: isLoading
                    ? _jsxs(_Fragment, {
                        children: [_jsx('span', { className: 'spinner' }), 'Updating Profile...'],
                      })
                    : 'Update Profile',
                }),
              }),
            ],
          }),
          _jsxs('div', {
            className: 'card mt-6',
            children: [
              _jsx('div', {
                className: 'card-header',
                children: _jsx('h3', { className: 'card-title', children: 'Additional Actions' }),
              }),
              _jsxs('div', {
                className: 'grid grid-cols-1 md:grid-cols-2 gap-6',
                children: [
                  _jsxs('div', {
                    children: [
                      _jsx('h4', { className: 'text-primary mb-2', children: 'Change Password' }),
                      _jsx('p', {
                        className: 'text-secondary mb-3',
                        children: 'Update your account password for enhanced security',
                      }),
                      _jsx('a', {
                        href: '/change-password',
                        className: 'btn btn-secondary',
                        children: 'Change Password',
                      }),
                    ],
                  }),
                  _jsxs('div', {
                    children: [
                      _jsx('h4', { className: 'text-primary mb-2', children: 'Document Upload' }),
                      _jsx('p', {
                        className: 'text-secondary mb-3',
                        children: 'Upload or update your supporting documents',
                      }),
                      _jsx('a', {
                        href: '/documents',
                        className: 'btn btn-info',
                        children: 'Manage Documents',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
};
export default Profile;
