import {
  Anchor,
  Box,
  Button,
  Checkbox,
  Flex,
  Group,
  Stack,
  Table,
  Text,
  Title,
  useMatches,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import { Utils } from "@xmtp/browser-sdk";
import { formatDistanceToNow } from "date-fns";
import { Fragment, useEffect, useState } from "react";
import { Outlet, useNavigate, useParams } from "react-router";
import { useAccount } from "wagmi";
import { nsToDate } from "@/helpers/date";
import { useSettings } from "@/hooks/useSettings";
import useStaticRevokeInstallations from "@/hooks/useStaticRevokeInstallations";
import { BadgeWithCopy } from "../BadgeWithCopy";
import { Connect } from "./Connect";

const RevokeInstallations = () => {
  const [selectedInstallationsIndexes, setSelectedInstallationsIndexes] =
    useState<number[]>([]);
  const px = useMatches({
    base: "5%",
    sm: "10%",
  });
  const { address } = useAccount();
  const params = useParams();
  const splatValue = params["*"];
  const inboxId =
    splatValue && splatValue !== "connect" ? splatValue : undefined;
  const navigate = useNavigate();
  const { environment } = useSettings();

  const { handleRevokeInstallations, installations, isRevoking } =
    useStaticRevokeInstallations(inboxId);

  useEffect(() => {
    if (address && !inboxId) {
      const utils = new Utils();
      void utils
        .getInboxIdForIdentifier(
          {
            identifier: address,
            identifierKind: "Ethereum",
          },
          environment,
        )
        .then((inboxId) => {
          if (inboxId) {
            void navigate("/revoke-installations/" + inboxId);
          } else {
            throw new Error(
              "Inbox ID not found for the provided address. Please ensure you have an XMTP account.",
            );
          }
        });
    }
  }, [address, inboxId, environment, navigate]);

  useEffect(() => {
    if (!address && inboxId) {
      // if wallet is disconnected but inboxId exist remove the inboxId from the URL
      void navigate("/revoke-installations");
    }
  }, [inboxId, address, navigate]);

  const toggleAllInstallations = (checked: boolean) => {
    setSelectedInstallationsIndexes(
      checked ? [...Array(installations.length).keys()] : [],
    );
  };

  const toggleInstallation = (installationIndex: number) => {
    setSelectedInstallationsIndexes((prev) =>
      prev.some((i) => i === installationIndex)
        ? prev.filter((i) => i !== installationIndex)
        : [...prev, installationIndex],
    );
  };

  const isInstallationSelected = (installationIndex: number) =>
    selectedInstallationsIndexes.some((i) => i === installationIndex);

  const handleRevoke = () => {
    if (!inboxId) return;
    void handleRevokeInstallations(
      inboxId,
      selectedInstallationsIndexes.map(
        (_, indexValue) => installations[indexValue].bytes,
      ),
    ).then(() => {
      // Clear selected installations indexes after revocation
      setSelectedInstallationsIndexes([]);
    });
  };

  const isMobile = useMediaQuery("(max-width: 600px)");

  return (
    <Fragment>
      <Stack
        gap="xl"
        py={isMobile ? 16 : 40}
        px={isMobile ? 12 : px}
        align="center"
        style={{
          minHeight: "100vh",
          width: "100vw",
          background: "#18181b",
          overflowX: "hidden",
        }}>
        <Stack
          gap="md"
          align="center"
          style={{ maxWidth: 600, width: "100%", margin: isMobile ? 0 : "xl" }}>
          <Title order={1} ta="center" style={{ fontSize: isMobile ? 28 : 36 }}>
            Revoke Installations
          </Title>
          <Text
            fs="italic"
            size={isMobile ? "md" : "xl"}
            style={{ textAlign: "center" }}>
            Revoke installations for your XMTP inbox ID.
          </Text>
        </Stack>
        <Stack gap="md" align="center" style={{ maxWidth: 600, width: "100%" }}>
          {inboxId && (
            <Text size="md" c="red" style={{ textAlign: "center" }}>
              Note that is a disruptive action as it will remove all the
              selected installations form your inbox, which will result in the
              loss of all your convesation history associated with them. Please
              proceed with caution as this action cannot undone.
            </Text>
          )}
          {!inboxId ? (
            <Connect url="/revoke-installations/connect" />
          ) : (
            <Box
              p={isMobile ? 0 : "md"}
              style={{
                textAlign: "center",
                width: "100%",
                background: isMobile ? "none" : "#232326",
                borderRadius: isMobile ? 0 : 12,
                boxShadow: isMobile ? "none" : "0 2px 16px 0 rgba(0,0,0,0.10)",
                border: isMobile ? "none" : "1px solid #232326",
                maxWidth: 600,
                margin: isMobile ? 0 : "auto",
              }}>
              <Flex direction="column" gap="sm" mb={isMobile ? 16 : 40}>
                <Text
                  size="lg"
                  fw={700}
                  style={{
                    maxWidth: isMobile ? 320 : 720,
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginRight: 8,
                    flex: 1,
                    display: "block",
                  }}
                  title={inboxId}>
                  Inbox ID: {inboxId}
                </Text>
                <Text
                  size="lg"
                  fw={700}
                  style={{
                    maxWidth: isMobile ? 320 : 720,
                    textAlign: "left",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    marginRight: 8,
                    flex: 1,
                    display: "block",
                  }}
                  title={address}>
                  Wallet Address: {address}
                </Text>
              </Flex>
              <Box mt={10}>
                {installations.length > 0 ? (
                  <Stack gap="sm">
                    <Group justify="space-between" px={isMobile ? 0 : "md"}>
                      <Text size="md">Select installations to revoke:</Text>
                      <Checkbox
                        label="Select All"
                        checked={
                          selectedInstallationsIndexes.length ===
                          installations.length
                        }
                        indeterminate={
                          selectedInstallationsIndexes.length > 0 &&
                          selectedInstallationsIndexes.length <
                            installations.length
                        }
                        onChange={(event) => {
                          toggleAllInstallations(event.currentTarget.checked);
                        }}
                      />
                    </Group>
                    <Box
                      style={{
                        maxHeight: isMobile ? 220 : 320,
                        overflowY: "auto",
                        background: isMobile ? "none" : "#18181b",
                        borderRadius: 8,
                        border: isMobile ? "none" : "1px solid #232326",
                        padding: isMobile ? 0 : 8,
                        marginBottom: isMobile ? 8 : 16,
                        width: "100%",
                      }}>
                      <Table
                        style={{
                          width: "100%",
                          tableLayout: "fixed",
                          background: isMobile ? "none" : "#18181b",
                          borderRadius: 8,
                          overflow: "hidden",
                          border: "none",
                        }}>
                        <Table.Thead>
                          <Table.Tr>
                            <Table.Th
                              style={{
                                width: "60%",
                                border: "none",
                                textAlign: "left",
                                padding: isMobile ? "8px 0" : "8px 16px",
                                fontWeight: 600,
                                fontSize: isMobile ? 14 : 16,
                                color: "#fff",
                                background: "none",
                              }}>
                              Installation ID
                            </Table.Th>
                            <Table.Th
                              style={{
                                width: "30%",
                                border: "none",
                                textAlign: "left",
                                padding: isMobile ? "8px 0" : "8px 16px",
                                fontWeight: 600,
                                fontSize: isMobile ? 14 : 16,
                                color: "#fff",
                                background: "none",
                              }}>
                              Created
                            </Table.Th>
                            <Table.Th
                              style={{
                                width: "10%",
                                border: "none",
                                background: "none",
                              }}></Table.Th>
                          </Table.Tr>
                        </Table.Thead>
                        <Table.Tbody>
                          {installations.map((installation, index) => {
                            const createdAt = nsToDate(
                              installation.clientTimestampNs ?? 0n,
                            );
                            return (
                              <Table.Tr
                                key={index}
                                style={{
                                  background: isMobile
                                    ? "none"
                                    : "rgba(0,0,0,0.05)",
                                  borderRadius: 6,
                                }}>
                                <Table.Td
                                  style={{
                                    padding: isMobile ? "8px 0" : "8px 16px",
                                    textAlign: "left",
                                    border: "none",
                                    verticalAlign: "middle",
                                    width: "60%",
                                    minWidth: 120,
                                    maxWidth: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}>
                                  <BadgeWithCopy
                                    maxWidth={isMobile ? "140" : "220"}
                                    value={installation.id}
                                  />
                                </Table.Td>
                                <Table.Td
                                  style={{
                                    padding: isMobile ? "8px 0" : "8px 16px",
                                    textAlign: "left",
                                    border: "none",
                                    verticalAlign: "middle",
                                    width: "30%",
                                    minWidth: 80,
                                    maxWidth: 120,
                                  }}>
                                  <Text
                                    size="xs"
                                    c="dimmed"
                                    style={{
                                      minWidth: 80,
                                      marginRight: 8,
                                      whiteSpace: "nowrap",
                                      textAlign: "left",
                                    }}
                                    title={createdAt.toISOString()}>
                                    {formatDistanceToNow(createdAt, {
                                      addSuffix: true,
                                    })}
                                  </Text>
                                </Table.Td>
                                <Table.Td
                                  style={{
                                    textAlign: "right",
                                    border: "none",
                                    verticalAlign: "middle",
                                    width: "10%",
                                    background: "none",
                                  }}>
                                  <Checkbox
                                    checked={isInstallationSelected(index)}
                                    onChange={() => {
                                      toggleInstallation(index);
                                    }}
                                  />
                                </Table.Td>
                              </Table.Tr>
                            );
                          })}
                        </Table.Tbody>
                      </Table>
                    </Box>
                  </Stack>
                ) : (
                  <Text size="md" c="text.primary">
                    No installations found for this inbox ID.
                  </Text>
                )}
              </Box>
              <Button
                mt={isMobile ? 12 : 20}
                w={"100%"}
                size={isMobile ? "md" : "lg"}
                disabled={
                  selectedInstallationsIndexes.length === 0 || isRevoking
                }
                loading={isRevoking}
                onClick={handleRevoke}
                style={{
                  fontSize: isMobile ? 16 : 18,
                  marginTop: isMobile ? 8 : 20,
                }}>
                {`Revoke ${
                  selectedInstallationsIndexes.length > 0
                    ? `(${selectedInstallationsIndexes.length})`
                    : ""
                }`}
              </Button>
            </Box>
          )}
          <Text style={{ textAlign: "center" }}>
            To Learn more about static installations revocation, see{" "}
            <Anchor
              href="https://docs.xmtp.org/inboxes/manage-inboxes#revoke-installations-for-a-user-who-cant-log-in"
              target="_blank">
              documentation
            </Anchor>
            .
          </Text>
        </Stack>
      </Stack>
      <Outlet />
    </Fragment>
  );
};

export default RevokeInstallations;
