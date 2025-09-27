import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Profile.css';

function Profile() {
  const { currentUser, userProfile, updateUserProfile, uploadAvatar, signOut } = useAuth();
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
    if (!currentUser) {
      navigate('/signin');
    }
  }, [currentUser, navigate]);

  // Load profile data when available
  useEffect(() => {
    if (userProfile) {
      setFormData({
        username: userProfile.username || '',
        full_name: userProfile.full_name || '',
        fitness_goals: userProfile.fitness_goals || ''
      });
    }
  }, [userProfile]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage('File size must be less than 2MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file');
      return;
    }

    setLoading(true);
    const { data: avatarUrl, error } = await uploadAvatar(file);
    
    if (error) {
      setMessage('Error uploading avatar: ' + error.message);
    } else {
      // Update profile with new avatar URL
      const { error: updateError } = await updateUserProfile(currentUser.id, {
        avatar_url: avatarUrl
      });
      
      if (updateError) {
        setMessage('Error updating profile: ' + updateError.message);
      } else {
        setMessage('Avatar updated successfully!');
      }
    }
    
    setLoading(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setMessage('');

    const { error } = await updateUserProfile(currentUser.id, formData);
    
    if (error) {
      setMessage('Error updating profile: ' + error.message);
    } else {
      setMessage('Profile updated successfully!');
      setEditing(false);
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      setMessage('Error signing out: ' + error.message);
    } else {
      navigate('/');
    }
  };

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
              <label htmlFor="avatar-upload" className="upload-btn">
                📸 Change Photo
              </label>
            </div>
          </div>
          <div className="profile-info">
            <h1>{userProfile?.full_name || 'Your Profile'}</h1>
            <p className="profile-email">{currentUser.email}</p>
          </div>
        </div>

        {message && (
          <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="profile-content">
          <div className="profile-section">
            <div className="section-header">
              <h2>Profile Information</h2>
              <button 
                className="edit-btn"
                onClick={() => setEditing(!editing)}
                disabled={loading}
              >
                {editing ? 'Cancel' : 'Edit'}
              </button>
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
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;