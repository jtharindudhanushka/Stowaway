import toast, { ToastOptions } from 'react-hot-toast';

export const notify = {
  success: (message: string, description?: string, options?: ToastOptions) => {
    return toast.success(description ? `${message}\n${description}` : message, {
      ...options,
    });
  },
  error: (message: string, description?: string, options?: ToastOptions) => {
    return toast.error(description ? `${message}\n${description}` : message, {
      ...options,
    });
  },
  info: (message: string, description?: string, options?: ToastOptions) => {
    return toast(description ? `${message}\n${description}` : message, {
      icon: 'ℹ️',
      ...options,
    });
  },
  loading: (message: string, options?: ToastOptions) => {
    return toast.loading(message, options);
  },
  dismiss: (toastId?: string) => {
    toast.dismiss(toastId);
  },
};

export { toast };
