'use client';

import * as React from 'react';
import ReactSelect, {
  components,
  OptionProps,
  SingleValueProps,
  MultiValueProps,
  StylesConfig,
  ActionMeta,
} from 'react-select';
import { cn } from '@/lib/utils';
import { AlertCircle, Check, X } from 'lucide-react';

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
  badge?: string;
  description?: string;
}

export interface SelectProps {
  label?: string;
  value?: string | number;
  defaultValue?: string | number;
  onChange?: (e: { target: { value: string; name?: string } }) => void;
  options?: SelectOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  name?: string;
  id?: string;
  className?: string;
  searchable?: boolean;
  isClearable?: boolean;
  children?: React.ReactNode;
}

// Custom Option for Single Select
const CustomSingleOption = (props: OptionProps<SelectOption, false>) => {
  const { data, isSelected } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 truncate flex-1">
          {data.icon && <span className="shrink-0 text-neutral-500">{data.icon}</span>}
          <div className="truncate">
            <span className={cn('truncate block', isSelected ? 'font-bold' : 'font-medium')}>
              {data.label}
            </span>
            {data.description && (
              <span className="text-[10px] text-neutral-400 font-normal line-clamp-1 block">
                {data.description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {data.badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
              {data.badge}
            </span>
          )}
          {isSelected && <Check className="w-3.5 h-3.5 text-neutral-900 shrink-0" />}
        </div>
      </div>
    </components.Option>
  );
};

// Custom Single Value in Control Box
const CustomSingleValue = (props: SingleValueProps<SelectOption, false>) => {
  const { data } = props;
  return (
    <components.SingleValue {...props}>
      <div className="flex items-center gap-2 truncate pr-2 text-xs font-semibold text-neutral-900">
        {data.icon && <span className="shrink-0 text-neutral-500">{data.icon}</span>}
        <span className="truncate">{data.label}</span>
        {data.badge && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
            {data.badge}
          </span>
        )}
      </div>
    </components.SingleValue>
  );
};

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className,
      label,
      value,
      defaultValue,
      onChange,
      options = [],
      placeholder = 'Sélectionner une option...',
      helperText,
      error,
      disabled = false,
      name,
      id,
      searchable = true,
      isClearable = false,
      children,
    },
    ref
  ) => {
    const generatedId = React.useId();
    const selectId = id || generatedId;
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
      setMounted(true);
    }, []);

    // Parse options from children if passed as <option>
    const resolvedOptions = React.useMemo(() => {
      if (options && options.length > 0) {
        return options.map((opt) => ({
          ...opt,
          value: String(opt.value),
        }));
      }
      if (children) {
        const parsed: SelectOption[] = [];
        React.Children.forEach(children, (child) => {
          if (React.isValidElement(child) && child.props) {
            const childProps = child.props as any;
            parsed.push({
              value: String(childProps.value ?? ''),
              label: String(childProps.children ?? childProps.value ?? ''),
            });
          }
        });
        return parsed;
      }
      return [];
    }, [options, children]);

    // Current selected option
    const currentValue =
      value !== undefined
        ? String(value)
        : defaultValue !== undefined
        ? String(defaultValue)
        : '';

    const selectedOption = React.useMemo(() => {
      if (currentValue === '') return null;
      return resolvedOptions.find((o) => o.value === currentValue) || null;
    }, [resolvedOptions, currentValue]);

    const handleChange = (
      newValue: SelectOption | null,
      _actionMeta: ActionMeta<SelectOption>
    ) => {
      if (disabled) return;
      if (onChange) {
        onChange({
          target: {
            value: newValue ? String(newValue.value) : '',
            name,
          },
        });
      }
    };

    const styles: StylesConfig<SelectOption, false> = {
      control: (base, state) => ({
        ...base,
        minHeight: '40px',
        borderRadius: '0.75rem', // rounded-xl
        borderColor: error
          ? '#f87171'
          : state.isFocused
          ? '#0a0a0a'
          : '#e5e5e5',
        boxShadow: state.isFocused
          ? '0 0 0 2px rgba(10, 10, 10, 0.15)'
          : '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        '&:hover': {
          borderColor: state.isFocused ? '#0a0a0a' : '#d4d4d4',
        },
        backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
        fontSize: '0.75rem',
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '0 2px',
        transition: 'all 0.15s ease',
      }),
      valueContainer: (base) => ({
        ...base,
        padding: '2px 8px',
      }),
      placeholder: (base) => ({
        ...base,
        color: '#a3a3a3',
        fontSize: '0.75rem',
      }),
      input: (base) => ({
        ...base,
        fontSize: '0.75rem',
        color: '#0a0a0a',
        margin: '0',
        padding: '0',
      }),
      singleValue: (base) => ({
        ...base,
        margin: '0',
      }),
      menu: (base) => ({
        ...base,
        borderRadius: '0.75rem',
        overflow: 'hidden',
        boxShadow:
          '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e5e5',
        backgroundColor: '#ffffff',
        marginTop: '4px',
      }),
      menuList: (base) => ({
        ...base,
        padding: '4px',
        maxHeight: '220px',
      }),
      menuPortal: (base) => ({
        ...base,
        zIndex: 99999, // Floating outside modal DOM hierarchy into document.body
      }),
      option: (base, state) => ({
        ...base,
        backgroundColor: state.isSelected
          ? '#f5f5f5'
          : state.isFocused
          ? '#fafafa'
          : '#ffffff',
        color: '#171717',
        fontSize: '0.75rem',
        padding: '6px 10px',
        borderRadius: '0.5rem',
        cursor: 'pointer',
        '&:active': {
          backgroundColor: '#ebebeb',
        },
      }),
      indicatorSeparator: () => ({
        display: 'none',
      }),
      dropdownIndicator: (base, state) => ({
        ...base,
        color: state.isFocused ? '#0a0a0a' : '#a3a3a3',
        padding: '6px',
        transition: 'transform 0.2s',
        transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : undefined,
        '&:hover': {
          color: '#0a0a0a',
        },
      }),
      clearIndicator: (base) => ({
        ...base,
        color: '#a3a3a3',
        padding: '6px',
        '&:hover': {
          color: '#0a0a0a',
        },
      }),
      noOptionsMessage: (base) => ({
        ...base,
        fontSize: '0.75rem',
        color: '#a3a3a3',
        padding: '12px',
        fontStyle: 'italic',
      }),
    };

    return (
      <div className={cn('w-full space-y-1.5', className)} ref={ref}>
        {label && (
          <label
            htmlFor={selectId}
            className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700"
          >
            {label}
          </label>
        )}

        {mounted ? (
          <ReactSelect<SelectOption, false>
            instanceId={selectId}
            inputId={selectId}
            name={name}
            value={selectedOption}
            onChange={handleChange}
            options={resolvedOptions}
            placeholder={placeholder}
            isDisabled={disabled}
            isSearchable={searchable}
            isClearable={isClearable}
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            menuPosition="fixed"
            styles={styles}
            components={{
              Option: CustomSingleOption,
              SingleValue: CustomSingleValue,
            }}
            noOptionsMessage={() => 'Aucune option correspondante'}
          />
        ) : (
          <div className="w-full h-[40px] rounded-xl border border-neutral-200 bg-white px-3 flex items-center text-xs text-neutral-400">
            {placeholder}
          </div>
        )}

        {error ? (
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-neutral-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';

export interface MultiSelectOption {
  label: string;
  value: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface MultiSelectProps {
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
}

// Custom Multi Option with Checkbox
const CustomMultiOption = (props: OptionProps<MultiSelectOption, true>) => {
  const { data, isSelected } = props;
  return (
    <components.Option {...props}>
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2 truncate flex-1">
          {data.icon && <span className="shrink-0 text-neutral-500">{data.icon}</span>}
          <div className="truncate">
            <span className={cn('truncate block', isSelected ? 'font-bold' : 'font-medium')}>
              {data.label}
            </span>
            {data.description && (
              <span className="text-[10px] text-neutral-400 font-normal line-clamp-1 block">
                {data.description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          {data.badge && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-600 border border-neutral-200">
              {data.badge}
            </span>
          )}
          <div
            className={cn(
              'w-4 h-4 rounded-md border flex items-center justify-center transition-colors shadow-2xs',
              isSelected
                ? 'bg-[var(--royal-primary)] border-[var(--royal-primary)] text-white'
                : 'border-neutral-300 bg-white'
            )}
          >
            {isSelected && <Check className="w-3 h-3 text-white" />}
          </div>
        </div>
      </div>
    </components.Option>
  );
};

// Custom Multi Value (Light Luxury Pill Badge)
const CustomMultiValue = (props: MultiValueProps<MultiSelectOption, true>) => {
  const { data, removeProps } = props;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-300/80 my-0.5 mr-1 shadow-2xs">
      <span className="truncate max-w-[170px]">{data.label}</span>
      <span
        {...removeProps}
        className="p-0.5 rounded-full hover:bg-neutral-300 text-neutral-400 hover:text-neutral-800 transition cursor-pointer"
      >
        <X className="w-2.5 h-2.5" />
      </span>
    </span>
  );
};

export function MultiSelect({
  label,
  values = [],
  onChange,
  options = [],
  placeholder = 'Sélectionner des éléments...',
  helperText,
  error,
  disabled = false,
  className,
  id,
}: MultiSelectProps) {
  const generatedId = React.useId();
  const selectId = id || generatedId;
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const selectedOptions = React.useMemo(() => {
    return options.filter((o) => values.includes(String(o.value)));
  }, [options, values]);

  const handleChange = (
    selected: readonly MultiSelectOption[],
    _actionMeta: ActionMeta<MultiSelectOption>
  ) => {
    if (disabled) return;
    onChange(selected ? selected.map((s) => String(s.value)) : []);
  };

  const styles: StylesConfig<MultiSelectOption, true> = {
    control: (base, state) => ({
      ...base,
      minHeight: '42px',
      borderRadius: '0.75rem',
      borderColor: error
        ? '#f87171'
        : state.isFocused
        ? '#0a0a0a'
        : '#e5e5e5',
      boxShadow: state.isFocused
        ? '0 0 0 2px rgba(10, 10, 10, 0.15)'
        : '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
      '&:hover': {
        borderColor: state.isFocused ? '#0a0a0a' : '#d4d4d4',
      },
      backgroundColor: disabled ? '#f5f5f5' : '#ffffff',
      fontSize: '0.75rem',
      cursor: disabled ? 'not-allowed' : 'pointer',
      padding: '1px 2px',
    }),
    valueContainer: (base) => ({
      ...base,
      padding: '2px 6px',
      gap: '2px',
    }),
    placeholder: (base) => ({
      ...base,
      color: '#a3a3a3',
      fontSize: '0.75rem',
    }),
    input: (base) => ({
      ...base,
      fontSize: '0.75rem',
      color: '#0a0a0a',
      margin: '0',
      padding: '0',
    }),
    menu: (base) => ({
      ...base,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      boxShadow:
        '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      border: '1px solid #e5e5e5',
      backgroundColor: '#ffffff',
      marginTop: '4px',
    }),
    menuList: (base) => ({
      ...base,
      padding: '4px',
      maxHeight: '220px',
    }),
    menuPortal: (base) => ({
      ...base,
      zIndex: 99999, // Outside modal DOM into document.body
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#f5f5f5'
        : state.isFocused
        ? '#fafafa'
        : '#ffffff',
      color: '#171717',
      fontSize: '0.75rem',
      padding: '6px 10px',
      borderRadius: '0.5rem',
      cursor: 'pointer',
      '&:active': {
        backgroundColor: '#ebebeb',
      },
    }),
    indicatorSeparator: () => ({
      display: 'none',
    }),
    dropdownIndicator: (base, state) => ({
      ...base,
      color: state.isFocused ? '#0a0a0a' : '#a3a3a3',
      padding: '6px',
      transition: 'transform 0.2s',
      transform: state.selectProps.menuIsOpen ? 'rotate(180deg)' : undefined,
      '&:hover': {
        color: '#0a0a0a',
      },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: '#a3a3a3',
      padding: '6px',
      '&:hover': {
        color: '#0a0a0a',
      },
    }),
    noOptionsMessage: (base) => ({
      ...base,
      fontSize: '0.75rem',
      color: '#a3a3a3',
      padding: '12px',
      fontStyle: 'italic',
    }),
  };

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label && (
        <div className="flex items-center justify-between">
          <label
            htmlFor={selectId}
            className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700"
          >
            {label}
          </label>
          {values.length > 0 && (
            <span className="text-[10px] font-bold text-neutral-500">
              {values.length} sélectionné{values.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      )}

      {mounted ? (
        <ReactSelect<MultiSelectOption, true>
          instanceId={selectId}
          inputId={selectId}
          isMulti
          closeMenuOnSelect={false}
          value={selectedOptions}
          onChange={handleChange}
          options={options}
          placeholder={placeholder}
          isDisabled={disabled}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          styles={styles}
          components={{
            Option: CustomMultiOption,
            MultiValue: CustomMultiValue,
          }}
          noOptionsMessage={() => 'Aucun résultat'}
        />
      ) : (
        <div className="w-full min-h-[42px] rounded-xl border border-neutral-200 bg-white px-3 flex items-center text-xs text-neutral-400">
          {placeholder}
        </div>
      )}

      {error ? (
        <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      ) : helperText ? (
        <p className="text-[11px] text-neutral-400">{helperText}</p>
      ) : null}
    </div>
  );
}

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, helperText, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700"
          >
            {label}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={ref}
          className={cn(
            'w-full rounded-xl border bg-white px-3.5 py-2.5 text-xs text-neutral-900 placeholder:text-neutral-400 transition-all focus:outline-none focus:ring-2 focus:ring-neutral-950 focus:border-neutral-950 disabled:bg-neutral-100 disabled:opacity-60',
            error
              ? 'border-red-400 focus:ring-red-500'
              : 'border-neutral-200 hover:border-neutral-300',
            className
          )}
          {...props}
        />
        {error ? (
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-neutral-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
