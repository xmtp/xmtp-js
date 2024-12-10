import { useClient } from "../hooks/useClient";
import { AddressButton } from "./AddressButton";

export const User: React.FC = () => {
  const { client } = useClient();
  return (
    client && (
      <AddressButton
        address={client.accountAddress}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        inboxId={client.inboxId!}
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        installationId={client.installationId!}
      />
    )
  );
};
