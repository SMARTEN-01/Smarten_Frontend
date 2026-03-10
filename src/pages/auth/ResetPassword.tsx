import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import SmartenLogo from '@/components/ui/SmartenLogo';
import { resetPassword } from '@/services/api';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    /* console.log('URL:', window.location.href); */ // Debug URL
    /* console.log('Token:', token, 'Email:', email); */ // Debug params
    if (!token || !email) {
      toast({
        title: 'Invalid Link',
        description: 'The password reset link is invalid or missing parameters.',
        variant: 'destructive',
      });
      setTimeout(() => navigate('/forgot-password'), 3000);
    }
  }, [token, email, navigate, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Error',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await resetPassword({ token, email, password: formData.password });
      toast({
        title: 'Password Reset Successful',
        description: 'Your password has been reset. You can now log in with your new password.',
      });
      navigate('/login', { replace: true });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to reset password.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100vh',
        position: 'relative',
        background: '#F8F9FA',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          background: 'white',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            left: 24,
            top: 24,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <SmartenLogo className="w-8 h-8" />
          <span
            style={{
              color: '#1862CA',
              fontSize: 20,
              fontWeight: '800',
            }}
          >
            SMARTEN
          </span>
        </div>
        <div
          style={{
            width: 400,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            position: 'absolute',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 16,
            display: 'flex',
          }}
        >
          <div
            style={{
              color: '#303030',
              fontSize: 24,
              fontWeight: '800',
              wordWrap: 'break-word',
            }}
          >
            Reset Password
          </div>
          <div
            style={{
              textAlign: 'center',
              color: '#8E8E8E',
              fontSize: 16,
              fontWeight: '400',
              wordWrap: 'break-word',
              lineHeight: '1.5',
            }}
          >
            Enter your new password below.
          </div>
          <form
            onSubmit={handleSubmit}
            style={{
              width: '100%',
              flexDirection: 'column',
              gap: 16,
              display: 'flex',
            }}
          >
            <input
              type="password"
              name="password"
              placeholder="New Password"
              value={formData.password}
              onChange={handleChange}
              style={{
                width: '100%',
                height: 44,
                padding: '0 16px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                fontSize: 16,
              }}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              style={{
                width: '100%',
                height: 44,
                padding: '0 16px',
                borderRadius: 8,
                border: '1px solid #D1D5DB',
                fontSize: 16,
              }}
              required
            />
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: 44,
                background: '#0E9CFF',
                borderRadius: 100,
                color: 'white',
                fontSize: 16,
                fontWeight: '600',
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                marginTop: 16,
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
          <div
            style={{
              textAlign: 'center',
              color: '#0E9CFF',
              fontSize: 14,
              fontWeight: '400',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/login')}
          >
            Back to Log In
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;