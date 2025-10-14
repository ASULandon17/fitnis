import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up function with manual profile creation
  const signUp = async (email, password, userData = {}) => {
    try {
      console.log('Signing up with:', { email, userData });
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData
        }
      });
      
      if (error) {
        console.error('Signup error:', error);
        return { data, error };
      }

      console.log('Signup successful:', data);

      // If signup successful and we have a user, create their profile
      if (data.user) {
        console.log('Creating profile for user:', data.user.id);
        
        // Wait a moment for the user to be fully created
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: userData.full_name || null,
            updated_at: new Date().toISOString()
          }, { onConflict: 'id' });
        
        if (profileError) {
          console.error('Profile creation error:', profileError);
        } else {
          console.log('Profile created successfully');
        }
      }
      
      return { data, error };
    } catch (error) {
      console.error('Signup exception:', error);
      return { data: null, error };
    }
  };

  // Sign in function
  const signIn = async (email, password) => {
    try {
      console.log('Signing in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        return { data, error };
      }

      console.log('Sign in successful:', data);
      return { data, error };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { data: null, error };
    }
  };

  // Sign out function
  const signOut = async () => {
    try {
      console.log('Signing out...');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }
      
      console.log('Sign out successful');
      setCurrentUser(null);
      setUserProfile(null);
      return { error: null };
    } catch (error) {
      console.error('Sign out exception:', error);
      return { error };
    }
  };

  // Get or create user profile
  const getUserProfile = async (userId) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // First try to get the profile
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      // If no profile exists, create one
      if (!data) {
        console.log('Profile not found, creating new profile for user:', userId);
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          throw createError;
        }
        
        console.log('Profile created:', newProfile);
        return newProfile;
      }
      
      console.log('Profile fetched:', data);
      return data;
    } catch (error) {
      console.error('Exception in getUserProfile:', error);
      // Return null but don't crash
      return null;
    }
  };

  // Update user profile
  const updateUserProfile = async (userId, updates) => {
    try {
      console.log('Updating profile for user:', userId, 'with:', updates);
      
      // Perform the update with upsert to handle cases where profile might not exist
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          ...updates,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'id'
        })
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }
      
      console.log('Profile updated successfully:', data);
      setUserProfile(data);
      return { data, error: null };
    } catch (error) {
      console.error('Exception updating profile:', error);
      return { data: null, error };
    }
  };

  // Upload avatar
  const uploadAvatar = async (file) => {
    try {
      console.log('Uploading avatar:', file.name);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${currentUser.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return { data: null, error: uploadError };
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Avatar uploaded successfully:', publicUrl);
      return { data: publicUrl, error: null };
    } catch (error) {
      console.error('Exception uploading avatar:', error);
      return { data: null, error };
    }
  };

  useEffect(() => {
    console.log('AuthContext: Initializing...');
    let mounted = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) setLoading(false);
          return;
        }
        
        console.log('Initial session:', session ? 'Found' : 'None');
        
        if (mounted) {
          setCurrentUser(session?.user ?? null);
          
          if (session?.user) {
            console.log('Fetching profile for initial session');
            const profile = await getUserProfile(session.user.id);
            if (mounted) {
              setUserProfile(profile);
            }
          }
          
          setLoading(false);
        }
      } catch (error) {
        console.error('Exception getting initial session:', error);
        if (mounted) setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'Session exists' : 'No session');
        
        if (!mounted) return;
        
        setCurrentUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('Auth changed: Fetching profile');
          const profile = await getUserProfile(session.user.id);
          if (mounted) {
            setUserProfile(profile);
          }
        } else {
          console.log('Auth changed: Clearing profile');
          if (mounted) {
            setUserProfile(null);
          }
        }
      }
    );

    return () => {
      mounted = false;
      console.log('AuthContext: Cleaning up subscription');
      subscription?.unsubscribe();
    };
  }, []);

  // Add this useEffect to log state changes
  useEffect(() => {
    console.log('Auth state - loading:', loading, 'currentUser:', currentUser?.email || 'None', 'userProfile:', userProfile?.username || 'None');
  }, [loading, currentUser, userProfile]);

  const value = {
    currentUser,
    userProfile,
    signUp,
    signIn,
    signOut,
    updateUserProfile,
    uploadAvatar,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};