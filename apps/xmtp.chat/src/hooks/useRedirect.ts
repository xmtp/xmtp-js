import { useLocalStorage } from "@mantine/hooks";

export const useRedirect = () => {
  const [redirectUrl, setRedirectUrl] = useLocalStorage({
    key: "XMTP_REDIRECT_URL",
    defaultValue: "",
    getInitialValueInEffect: false,
  });

  return {
    redirectUrl,
    setRedirectUrl,
  };
};
