import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ContactModal: React.FC<ContactModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Update form when user changes or modal opens
  useEffect(() => {
    if (isOpen && user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [isOpen, user]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const EMAIL_SERVICE_URL = process.env.EMAIL_SERVICE_URL || '';
      
      if (!EMAIL_SERVICE_URL) {
        // Development mode: store in localStorage
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          const contactData = {
            ...formData,
            timestamp: new Date().toISOString(),
            type: 'contact_form'
          };
          const contacts = JSON.parse(localStorage.getItem('fewtalks_contacts') || '[]');
          contacts.push(contactData);
          if (contacts.length > 10) contacts.shift();
          localStorage.setItem('fewtalks_contacts', JSON.stringify(contacts));
          
          setSubmitStatus('success');
          setFormData({ name: user?.name || '', email: user?.email || '', message: '' });
          setTimeout(() => {
            onClose();
            setSubmitStatus('idle');
          }, 2000);
          setIsSubmitting(false);
          console.log('Contact form saved locally (development mode):', contactData);
          return;
        }
        throw new Error('Email service is not configured. Please set EMAIL_SERVICE_URL in your .env.local file.');
      }

      const response = await fetch(EMAIL_SERVICE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'fewtalks007@gmail.com',
          reply_to: formData.email,
          subject: 'Contact Form Submission - Fewtalks',
          data: {
            email: formData.email,
            name: formData.name,
            message: formData.message,
            timestamp: new Date().toISOString(),
            type: 'contact_form'
          },
        }),
      }).catch((fetchError) => {
        // Network error (CORS, connection refused, etc.)
        if (fetchError.message.includes('Failed to fetch') || fetchError.message.includes('NetworkError')) {
          throw new Error('Cannot connect to email service. This may be a CORS issue or the server is not accessible. Make sure the PHP endpoint is deployed and accessible.');
        }
        throw fetchError;
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Server error (${response.status})`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMsg = errorJson.message || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const result = await response.json();
      
      if (result.success) {
        setSubmitStatus('success');
        setFormData({ name: user?.name || '', email: user?.email || '', message: '' });
        setTimeout(() => {
          onClose();
          setSubmitStatus('idle');
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to send message');
      }
    } catch (error: any) {
      setSubmitStatus('error');
      let errorMsg = error.message || 'Failed to send message. Please try again.';
      
      // Provide helpful hints for common issues
      if (errorMsg.includes('Failed to fetch') || errorMsg.includes('NetworkError')) {
        errorMsg = 'Cannot connect to email service. If testing locally, make sure: 1) EMAIL_SERVICE_URL is set in .env.local, 2) The PHP endpoint is deployed on a server, 3) CORS is enabled on the server.';
      }
      
      setErrorMessage(errorMsg);
      console.error('Contact form error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-brand-light rounded-2xl shadow-2xl p-6 sm:p-8 m-4 max-w-md w-full border border-slate-200 dark:border-slate-700 transform transition-transform duration-300 scale-95 animate-modal-pop max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Contact Us</h2>
          <button 
            onClick={onClose} 
            className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors p-1 touch-manipulation" 
            aria-label="Close contact modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-6">
          Have a question or feedback? Send us a message and we'll get back to you soon.
        </p>

        {submitStatus === 'success' && (
          <div className="mb-4 p-3 bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700 rounded-lg">
            <p className="text-sm text-green-700 dark:text-green-300">Message sent successfully! We'll get back to you soon.</p>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/50 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="Your name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              placeholder="your.email@example.com"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Message *
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={5}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent resize-none"
              placeholder="Tell us how we can help..."
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting || submitStatus === 'success'}
            className="w-full bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:bg-brand-accent active:bg-brand-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation min-h-[48px]"
          >
            {isSubmitting ? 'Sending...' : submitStatus === 'success' ? 'Sent!' : 'Send Message'}
          </button>
        </form>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes modalPop {
          from { transform: scale(0.95); opacity: 0.8; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-pop {
          animation: modalPop 0.3s ease-out forwards;
        }
        .touch-manipulation {
          touch-action: manipulation;
        }
      `}</style>
    </div>
  );
};

export default ContactModal;

