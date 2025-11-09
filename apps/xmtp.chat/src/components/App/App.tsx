import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "@/components/App/AppLayout";
import { BasicLayout } from "@/components/App/BasicLayout";
import { Disconnect } from "@/components/App/Disconnect";
import { ErrorModal } from "@/components/App/ErrorModal";
import { SelectConversation } from "@/components/App/SelectConversation";
import { Welcome } from "@/components/App/Welcome";
import { LoadConversation } from "@/components/Conversation/LoadConversation";
import { LoadDM } from "@/components/Conversation/LoadDM";
import { LoadDMLegacy } from "@/components/Conversation/LoadDMLegacy";
import { ManageConsentModal } from "@/components/Conversation/ManageConsentModal";
import { ManageMembersModal } from "@/components/Conversation/ManageMembersModal";
import { ManageMetadataModal } from "@/components/Conversation/ManageMetadataModal";
import { ManagePermissionsModal } from "@/components/Conversation/ManagePermissionsModal";
import { CreateDmModal } from "@/components/Conversations/CreateDmModal";
import { CreateGroupModal } from "@/components/Conversations/CreateGroupModal";
import { IdentityModal } from "@/components/Identity/IdentityModal";
import { InboxTools } from "@/components/InboxTools/InboxTools";
import { InboxToolsLayout } from "@/components/InboxTools/InboxToolsLayout";
import { MessageModal } from "@/components/Messages/MessageModal";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useSettings } from "@/hooks/useSettings";

export const App: React.FC = () => {
  useAnalytics();
  const { environment } = useSettings();

  return (
    <>
      <ErrorModal />
      <Routes>
        <Route path="/" element={<BasicLayout />}>
          <Route path="" element={<Welcome />} />
        </Route>
        <Route path="/inbox-tools/*" element={<InboxToolsLayout />}>
          <Route path="" element={<InboxTools />} />
        </Route>
        <Route path="/disconnect" element={<Disconnect />} />
        <Route path="/dm/:address" element={<LoadDMLegacy />} />
        <Route path="/:environment" element={<AppLayout />}>
          <Route
            index
            element={<Navigate to={`/${environment}/conversations`} />}
          />
          <Route path="dm/:address" element={<LoadDM />} />
          <Route path="identity" element={<IdentityModal />} />
          <Route path="conversations">
            <Route index element={<SelectConversation />} />
            <Route path="new-dm" element={<CreateDmModal />} />
            <Route path="new-group" element={<CreateGroupModal />} />
            <Route path=":conversationId" element={<LoadConversation />}>
              <Route path="new-dm" element={<CreateDmModal />} />
              <Route path="new-group" element={<CreateGroupModal />} />
              <Route path="identity" element={<IdentityModal />} />
              <Route path="message/:messageId" element={<MessageModal />} />
              <Route path="manage">
                <Route path="consent" element={<ManageConsentModal />} />
                <Route path="members" element={<ManageMembersModal />} />
                <Route
                  path="permissions"
                  element={<ManagePermissionsModal />}
                />
                <Route path="metadata" element={<ManageMetadataModal />} />
              </Route>
            </Route>
          </Route>
        </Route>
      </Routes>
    </>
  );
};
