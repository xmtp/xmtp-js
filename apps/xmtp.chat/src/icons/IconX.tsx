export type IconXProps = Omit<
  React.SVGProps<SVGSVGElement>,
  "width" | "height"
> & {
  size?: number;
};

export const IconX: React.FC<IconXProps> = ({
  size = 16,
  color = "currentColor",
  ...rest
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}>
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </svg>
  );
};
