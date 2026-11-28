"use client";

import React, { forwardRef } from "react";
import { AlertCircle } from "lucide-react";

export function FormFieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="text-[11px] text-red-700 font-medium flex items-center gap-1 mt-1"
    >
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-600" />
      <span>{message}</span>
    </p>
  );
}

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  containerClassName?: string;
}

export interface FormInputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    BaseFieldProps {}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    {
      label,
      required,
      error,
      helperText,
      icon,
      containerClassName = "",
      className = "",
      id,
      ...props
    },
    ref,
  ) {
    const fieldId = id || props.name;
    return (
      <div className={`space-y-1 ${containerClassName}`}>
        <label
          htmlFor={fieldId}
          className="font-bold text-stone-800 text-xs flex items-center gap-1"
        >
          {icon}
          <span>{label}</span>
          {required && <span className="text-red-600">*</span>}
        </label>
        <input
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error)}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border text-xs sm:text-sm text-stone-900 transition-colors focus:bg-white focus:outline-none ${
            error
              ? "border-red-400 focus:border-red-500 bg-red-50/30"
              : "border-cream-300 focus:border-[#174B3D]"
          } ${className}`}
          {...props}
        />
        {error ? (
          <FormFieldError message={error} />
        ) : helperText ? (
          <p className="text-[10px] text-stone-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

export interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    BaseFieldProps {}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  function FormTextarea(
    {
      label,
      required,
      error,
      helperText,
      icon,
      containerClassName = "",
      className = "",
      id,
      ...props
    },
    ref,
  ) {
    const fieldId = id || props.name;
    return (
      <div className={`space-y-1 ${containerClassName}`}>
        <label
          htmlFor={fieldId}
          className="font-bold text-stone-800 text-xs flex items-center gap-1"
        >
          {icon}
          <span>{label}</span>
          {required && <span className="text-red-600">*</span>}
        </label>
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error)}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border text-xs sm:text-sm text-stone-900 transition-colors focus:bg-white focus:outline-none ${
            error
              ? "border-red-400 focus:border-red-500 bg-red-50/30"
              : "border-cream-300 focus:border-[#174B3D]"
          } ${className}`}
          {...props}
        />
        {error ? (
          <FormFieldError message={error} />
        ) : helperText ? (
          <p className="text-[10px] text-stone-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

export interface FormSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement>,
    BaseFieldProps {}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(
    {
      label,
      required,
      error,
      helperText,
      icon,
      containerClassName = "",
      className = "",
      id,
      children,
      ...props
    },
    ref,
  ) {
    const fieldId = id || props.name;
    return (
      <div className={`space-y-1 ${containerClassName}`}>
        <label
          htmlFor={fieldId}
          className="font-bold text-stone-800 text-xs flex items-center gap-1"
        >
          {icon}
          <span>{label}</span>
          {required && <span className="text-red-600">*</span>}
        </label>
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={Boolean(error)}
          className={`w-full px-3.5 py-2.5 rounded-xl bg-cream-50 border text-xs sm:text-sm text-stone-900 transition-colors focus:bg-white focus:outline-none ${
            error
              ? "border-red-400 focus:border-red-500 bg-red-50/30"
              : "border-cream-300 focus:border-[#174B3D]"
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        {error ? (
          <FormFieldError message={error} />
        ) : helperText ? (
          <p className="text-[10px] text-stone-500">{helperText}</p>
        ) : null}
      </div>
    );
  },
);

export interface FormCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  function FormCheckbox({ label, error, className = "", id, ...props }, ref) {
    const fieldId = id || props.name;
    return (
      <div className="space-y-1">
        <label
          htmlFor={fieldId}
          className="flex items-center gap-2 pt-1 cursor-pointer select-none text-xs"
        >
          <input
            ref={ref}
            id={fieldId}
            type="checkbox"
            className={`rounded border-cream-300 text-[#174B3D] focus:ring-[#174B3D] ${className}`}
            {...props}
          />
          <span className="font-semibold text-stone-700">{label}</span>
        </label>
        <FormFieldError message={error} />
      </div>
    );
  },
);
