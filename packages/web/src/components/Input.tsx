import { inputWrapper, label as labelStyle, input as inputStyle, textarea as textareaStyle } from './Input.css.js';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export function Input({ label, id, ...props }: InputProps) {
  return (
    <div className={inputWrapper}>
      {label && <label className={labelStyle} htmlFor={id}>{label}</label>}
      <input id={id} className={inputStyle} {...props} />
    </div>
  );
}

export function Textarea({ label, id, ...props }: TextareaProps) {
  return (
    <div className={inputWrapper}>
      {label && <label className={labelStyle} htmlFor={id}>{label}</label>}
      <textarea id={id} className={textareaStyle} {...props} />
    </div>
  );
}
