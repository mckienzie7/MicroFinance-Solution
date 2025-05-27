const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/api/v1/users/login', {
        email,
        password
      });

      const { token, admin, username } = response.data;
      
      // Store the token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        email,
        username,
        admin
      }));

      // Redirect based on user role
      if (admin) {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to log in. Please check your credentials and try again.');
      }
    } finally {
      setLoading(false);
    }
  }; 