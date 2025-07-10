import { useMemo } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { createEphemeralSigner } from "@/helpers/createSigner";
import { useSettings } from "@/hooks/useSettings";

export const useEphemeralSigner = () => {
  const { ephemeralAccountKey, setEphemeralAccountKey } = useSettings();

  const accountKey = useMemo(() => {
    let accountKey = ephemeralAccountKey;
    if (!accountKey) {
      accountKey = generatePrivateKey();
      setEphemeralAccountKey(accountKey);
    }
    return accountKey;
  }, [ephemeralAccountKey, setEphemeralAccountKey]);

  const signer = useMemo(() => {
    return createEphemeralSigner(accountKey);
  }, [accountKey]);

  const address = useMemo(() => {
    const account = privateKeyToAccount(accountKey);
    return account.address.toLowerCase();
  }, [accountKey]);

  return {
    address,
    signer,
  };
};
