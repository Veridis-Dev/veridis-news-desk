import type { ButtonHTMLAttributes } from 'react';
interface Props extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: 'primary' | 'secondary' | 'ghost' }
export function VeridisButton({ variant = 'primary', className = '', type = 'button', ...props }: Props) {
  return <button type={type} className={`vnd-button vnd-button--${variant} ${className}`} {...props} />;
}
