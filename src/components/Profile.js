import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

function Profile() {
  const { currentUser, userProfile, updateUserProfile, uploadAvatar, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    fitness_goals: ''
  });

  // Redirect if not logged in
  useEffect(() => {
    console.log('Profile: Checking auth, currentUser:', currentUser);
    if (!authLoading && !currentUser) {
      console.log('Profile: No user, redirecting to signin');
      navigate('/signin');
    }
  }, [currentUser, authLoading, navigate]);

  // Load profile data when available
  useEffect(() => {
    console.log('Profile: userProfile changed:', userProfile);
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        full_name: userProfile.full_name || '',
        fitness_goals: userProfile.fitness_goals || ''
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input changed:', name, value);
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAvatarUpload = async (e) => {
    console.log('Avatar upload started');
    const file = e.target.files?.[0];
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', file.name, file.size, file.type);

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage('File size must be less than 2MB');
      console.log('File too large');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file');
      console.log('Invalid file type');
      return;
    }

    setLoading(true);
    setMessage('Uploading...');
    
    const { data: avatarUrl, error } = await uploadAvatar(file);
    
    if (error) {
      console.error('Avatar upload error:', error);
      setMessage('Error uploading avatar: ' + error.message);
      setLoading(false);
      return;
    }

    console.log('Avatar uploaded, updating profile with URL:', avatarUrl);
    
    // Update profile with new avatar URL
    const { error: updateError } = await updateUserProfile(currentUser.id, {
      avatar_url: avatarUrl
    });
    
    if (updateError) {
      console.error('Profile update error:', updateError);
      setMessage('Error updating profile: ' + updateError.message);
    } else {
      console.log('Profile updated with new avatar');
      setMessage('Avatar updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    console.log('Save button clicked');
    console.log('Current form data:', formData);
    
    setLoading(true);
    setMessage('Saving...');

    const { data, error } = await updateUserProfile(currentUser.id, formData);
    
    if (error) {
      console.error('Save error:', error);
      setMessage('Error updating profile: ' + error.message);
    } else {
      console.log('Save successful:', data);
      setMessage('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    console.log('Sign out button clicked');
    
    setLoading(true);
    const { error } = await signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      setMessage('Error signing out: ' + error.message);
      setLoading(false);
    } else {
      console.log('Sign out successful, navigating to home');
      navigate('/');
    }
  };

  // Show loading state
  if (authLoading) {
    return (
      <div className="profile-page">
        <div className="profile-container">
          <p style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user
  if (!currentUser) {
    return null;
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {userProfile?.avatar_url ? (
              <img 
                src={userProfile.avatar_url} 
                alt="Profile" 
                className="avatar-img-large"
              />
            ) : (
              <div className="avatar-placeholder-large">
                {userProfile?.username?.charAt(0)?.toUpperCase() || 
                 userProfile?.full_name?.charAt(0)?.toUpperCase() ||
                 currentUser.email?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
            <div className="avatar-upload">
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={loading}
              />
              <label htmlFor="avatar-upload" className={`upload-btn ${loading ? 'disabled' : ''}`}>
                📸 Change Photo
              </label>
            </div>
          </div>
          <div className="profile-info">
            <h1>{userProfile?.full_name || userProfile?.username || 'Your Profile'}</h1>
            <p className="profile-email">{currentUser.email}</p>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('success') ? 'success' : message.includes('Error') ? 'error' : 'info'}`}>
            {message}
          </div>
        )}

        <div className="profile-content">
          <div className="profile-section">
            <div className="section-header">
              <h2>Profile Information</h2>
              {!editing ? (
                <button 
                  className="edit-btn"
                  onClick={() => {
                    console.log('Edit button clicked');
                    setEditing(true);
                  }}
                  disabled={loading}
                >
                  Edit
                </button>
              ) : (
                <button 
                  className="edit-btn cancel"
                  onClick={() => {
                    console.log('Cancel button clicked');
                    setEditing(false);
                    // Reset form data
                    setFormData({
                      username: userProfile?.username || '',
                      full_name: userProfile?.full_name || '',
                      fitness_goals: userProfile?.fitness_goals || ''
                    });
                  }}
                  disabled={loading}
                >
                  Cancel
                </button>
              )}
            </div>

            <div className="profile-form">
              <div className="form-group">
                <label>Username</label>
                {editing ? (
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    disabled={loading}
                  />
                ) : (
                  <p>{formData.username || 'Not set'}</p>
                )}
              </div>

              <div className="form-group">
                <label>Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    disabled={loading}
                  />
                ) : (
                  <p>{formData.full_name || 'Not set'}</p>
                )}
              </div>

              <div className="form-group">
                <label>Fitness Goals</label>
                {editing ? (
                  <textarea
                    name="fitness_goals"
                    value={formData.fitness_goals}
                    onChange={handleInputChange}
                    placeholder="What are your fitness goals?"
                    rows="4"
                    disabled={loading}
                  />
                ) : (
                  <p>{formData.fitness_goals || 'No goals set yet'}</p>
                )}
              </div>

              {editing && (
                <button 
                  className="save-btn"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </div>

          <div className="profile-actions">
            <button 
              className="logout-btn"
              onClick={handleSignOut}
              disabled={loading}
            >
              {loading ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;