import * as RadixSelect from '@radix-ui/react-select';
import { selectWrapper, label as labelStyle, trigger, content, item } from './Select.css.js';
import { useCallbackRef } from '../utils/useCallbackRef.js';
import { useCallback } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
}

const EmptyValue = `__empty_${Math.random().toString(36).slice(2, 9)}__`;

const safe = (value: string | null | undefined): string => (value === null || value === undefined || value === '' ? (EmptyValue as unknown as string) : value);

export function Select({ label, value, onValueChange, options, placeholder }: SelectProps) {
  const onValueChangeStable = useCallbackRef(onValueChange);
  const onValueChangeSafe = useCallback((value: string) => {
    if (value === (EmptyValue as unknown as string)) {
      onValueChangeStable('');
    } else {
      onValueChangeStable(value);
    }
  }, [onValueChangeStable]);
  return (
    <div className={selectWrapper}>
      {label && <span className={labelStyle}>{label}</span>}
      <RadixSelect.Root value={value} onValueChange={onValueChangeSafe}>
        <RadixSelect.Trigger className={trigger}>
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon>▾</RadixSelect.Icon>
        </RadixSelect.Trigger>
        <RadixSelect.Portal>
          <RadixSelect.Content className={content} position="popper">
            <RadixSelect.Viewport>
              {options.map((opt) => (
                <RadixSelect.Item key={opt.value} value={safe(opt.value)} className={item}>
                  <RadixSelect.ItemText>{opt.label}</RadixSelect.ItemText>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
    </div>
  );
}
