import {
  Checkbox,
  MultiSelect,
  NativeSelect,
  NumberInput,
  Textarea,
  TextInput,
} from "@mantine/core";
import type { InputComponent } from "@xmtp/content-type-mini-app";
import { useMiniAppContext } from "@xmtp/content-type-mini-app/react";
import { useCallback, useMemo, useState } from "react";
import { useFlexStyles } from "@/mini-app/useFlexStyles";

export const Input: React.FC<InputComponent["props"]> = ({ ...props }) => {
  const { handleInputChange } = useMiniAppContext();
  const initialValue = useMemo(() => {
    switch (props.type) {
      case "checkbox":
        return false;
      case "multi-select":
        return [];
      case "number":
        return 0;
      default:
        return "";
    }
  }, [props.type]);
  const [value, setValue] = useState<string | number | string[] | boolean>(
    initialValue,
  );
  const flexStyles = useFlexStyles(props.grow, props.shrink, props.basis);
  const handleChange = useCallback(
    (
      event: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      setValue(event.target.value);
      if (props.id) {
        handleInputChange(props.id, event.target.value);
      }
    },
    [props.id, handleInputChange],
  );
  const handleNumberChange = useCallback(
    (value: string | number) => {
      setValue(value);
      if (props.id) {
        handleInputChange(props.id, value);
      }
    },
    [props.id, handleInputChange],
  );
  const handleMultiSelectChange = useCallback(
    (value: string[]) => {
      setValue(value);
      if (props.id) {
        handleInputChange(props.id, value);
      }
    },
    [props.id, handleInputChange],
  );
  const handleCheckboxChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setValue(event.target.checked);
      if (props.id) {
        handleInputChange(props.id, event.target.checked);
      }
    },
    [props.id, handleInputChange],
  );

  switch (props.type) {
    case "text":
      return (
        <TextInput
          style={{ ...flexStyles }}
          onChange={handleChange}
          radius={props.radius}
          size={props.size}
          label={props.label}
          description={props.description}
          placeholder={props.placeholder}
          required={props.required}
          value={value as string}
        />
      );
    case "textarea":
      return (
        <Textarea
          style={{ ...flexStyles }}
          onChange={handleChange}
          radius={props.radius}
          size={props.size}
          label={props.label}
          description={props.description}
          placeholder={props.placeholder}
          required={props.required}
          value={value as string}
        />
      );
    case "number":
      return (
        <NumberInput
          style={{ ...flexStyles }}
          onChange={handleNumberChange}
          radius={props.radius}
          size={props.size}
          label={props.label}
          description={props.description}
          placeholder={props.placeholder}
          required={props.required}
          min={props.minValue}
          max={props.maxValue}
          value={value as number}
        />
      );
    case "checkbox":
      return (
        <Checkbox
          style={{ ...flexStyles }}
          onChange={handleCheckboxChange}
          label={props.label}
          description={props.description}
          placeholder={props.placeholder}
          required={props.required}
          size={props.size}
          checked={value as boolean}
        />
      );
    case "select":
      return (
        <NativeSelect
          style={{ ...flexStyles }}
          onChange={handleChange}
          label={props.label}
          description={props.description}
          required={props.required}
          data={props.data}
          size={props.size}
          value={value as string}
        />
      );
    case "multi-select":
      return (
        <MultiSelect
          style={{ ...flexStyles }}
          onChange={handleMultiSelectChange}
          label={props.label}
          description={props.description}
          required={props.required}
          data={props.data}
          clearable
          searchable
          size={props.size}
          value={value as string[]}
        />
      );
  }

  return null;
};
